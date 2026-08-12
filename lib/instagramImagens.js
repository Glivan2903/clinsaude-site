import { Redis } from '@upstash/redis';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

const IMAGEM_KEY_PREFIX = 'clinsaude:instagram:imagemFundo:';

const TAMANHOS_OPENAI = {
  feed: '1024x1024',
  stories: '1024x1536',
};

const ASPECT_RATIO_GEMINI = {
  feed: '1:1',
  stories: '9:16',
};

function getMemoryStore() {
  if (!globalThis.__clinsaudeInstagramImagensStore) {
    globalThis.__clinsaudeInstagramImagensStore = new Map();
  }
  return globalThis.__clinsaudeInstagramImagensStore;
}

let redisClient = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

function chave(slug, formato) {
  return `${IMAGEM_KEY_PREFIX}${slug}:${formato}`;
}

// Imagem salva como { data: base64, mimeType } — o provedor (OpenAI ou
// Gemini) decide o formato de saída, então guardamos o mimeType real em vez
// de assumir jpeg/png fixo.
export async function salvarImagemFundo(slug, formato, imagem) {
  const redis = getRedis();
  if (redis) {
    await redis.set(chave(slug, formato), imagem);
    return;
  }
  getMemoryStore().set(chave(slug, formato), imagem);
}

export async function getImagemFundo(slug, formato) {
  const redis = getRedis();
  if (redis) return (await redis.get(chave(slug, formato))) || null;
  return getMemoryStore().get(chave(slug, formato)) || null;
}

export async function existeImagemFundo(slug, formato) {
  return Boolean(await getImagemFundo(slug, formato));
}

// Prompt usado nos dois provedores. Pede explicitamente para não ter
// texto/logo — deixamos a legibilidade do texto por conta do overlay que nós
// mesmos desenhamos (ver app/api/instagram/imagem/[slug]), já que modelos de
// imagem erram muito ao renderizar texto (especialmente com acentuação em
// português).
function montarPrompt(tema) {
  return `Fotografia editorial profissional para o post de rede social de uma clínica de saúde. Tema: "${tema}". Estilo clean, acolhedor e humano, tons de verde e branco predominantes, luz natural suave, sem nenhum texto, letra, número, símbolo ou logotipo na imagem. Deixe uma área lisa e com pouco detalhe na parte inferior da imagem, para permitir sobreposição de texto depois. Evite rostos em close-up e evite qualquer marca ou produto reconhecível.`;
}

async function gerarImagemFundoOpenAI(tema, formato) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada.');
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const resposta = await client.images.generate({
    model: 'gpt-image-1',
    prompt: montarPrompt(tema),
    size: TAMANHOS_OPENAI[formato],
    quality: 'medium',
    output_format: 'jpeg',
    output_compression: 70,
  });

  return { data: resposta.data[0].b64_json, mimeType: 'image/jpeg' };
}

// Usa o modelo de geração de imagem nativa do Gemini (generateContent com
// responseModalities: ['IMAGE']), não o Imagen via predict — contas novas do
// Gemini API costumam não ter acesso aos modelos imagen-*.
async function gerarImagemFundoGemini(tema, formato) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada.');
  }
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const resposta = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: montarPrompt(tema),
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: ASPECT_RATIO_GEMINI[formato],
      },
    },
  });

  const partes = resposta.candidates?.[0]?.content?.parts || [];
  const imagem = partes.find((p) => p.inlineData)?.inlineData;
  if (!imagem?.data) throw new Error('O Gemini não retornou nenhuma imagem (pode ter sido filtrada).');

  return { data: imagem.data, mimeType: imagem.mimeType || 'image/png' };
}

export const PROVEDORES_IMAGEM = ['openai', 'gemini'];

export async function gerarImagemFundoIA(tema, formato, provedor = 'gemini') {
  if (provedor === 'openai') return gerarImagemFundoOpenAI(tema, formato);
  if (provedor === 'gemini') return gerarImagemFundoGemini(tema, formato);
  throw new Error(`Provedor de imagem desconhecido: "${provedor}".`);
}
