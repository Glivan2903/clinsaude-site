import crypto from 'crypto';
import OpenAI, { toFile } from 'openai';

// Mídia do WhatsApp é entregue criptografada (URL do CDN + mediaKey no
// payload do webhook) — a UAZAPI não decripta isso por nós. O esquema é o
// mesmo usado por Baileys/whatsmeow: HKDF-SHA256 (sem salt) sobre a
// mediaKey, com uma "info" string por tipo de mídia, gerando 112 bytes que
// se dividem em IV (16) + chave AES (32) + chave MAC (32) + refKey (16,
// não usada aqui). O arquivo baixado é [ciphertext][mac de 10 bytes].
const INFO_STRINGS = {
  audio: 'WhatsApp Audio Keys',
  image: 'WhatsApp Image Keys',
  video: 'WhatsApp Video Keys',
  document: 'WhatsApp Document Keys',
};

function hkdfExpand(mediaKeyBase64, tipo) {
  const mediaKey = Buffer.from(mediaKeyBase64, 'base64');
  const info = Buffer.from(INFO_STRINGS[tipo] || INFO_STRINGS.audio);
  const expanded = Buffer.from(crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(0), info, 112));
  return {
    iv: expanded.subarray(0, 16),
    cipherKey: expanded.subarray(16, 48),
    macKey: expanded.subarray(48, 80),
  };
}

// Retorna o Buffer decriptado (ex.: os bytes reais do arquivo .ogg de um
// áudio de WhatsApp) ou lança erro se o MAC não validar (arquivo
// corrompido/mediaKey errada).
export async function baixarEDescriptografarMidia({ url, mediaKey, tipo = 'audio' }) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar mídia do WhatsApp: HTTP ${response.status}`);
  }
  const arquivo = Buffer.from(await response.arrayBuffer());
  if (arquivo.length < 10) {
    throw new Error('Arquivo de mídia recebido é menor que o MAC esperado.');
  }

  const { iv, cipherKey, macKey } = hkdfExpand(mediaKey, tipo);
  const ciphertext = arquivo.subarray(0, arquivo.length - 10);
  const macRecebido = arquivo.subarray(arquivo.length - 10);

  const macCalculado = crypto.createHmac('sha256', macKey).update(Buffer.concat([iv, ciphertext])).digest().subarray(0, 10);
  if (!macCalculado.equals(macRecebido)) {
    throw new Error('MAC da mídia não validou — mediaKey incorreta ou arquivo corrompido.');
  }

  const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// Notas de voz do WhatsApp (PTT) são sempre um container OGG/Opus, mesmo
// quando a UAZAPI reporta mimetype "audio/mpeg" no payload — por isso a
// extensão é fixa em .ogg, não vem do mimetype declarado.
export async function transcreverAudio(bufferDecriptado) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada.');
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const arquivo = await toFile(bufferDecriptado, 'audio.ogg');
  const resultado = await client.audio.transcriptions.create({
    file: arquivo,
    model: 'whisper-1',
    language: 'pt',
  });
  return resultado.text || '';
}
