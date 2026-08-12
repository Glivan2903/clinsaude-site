import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { temasDoDia } from '../../../../lib/calendarioConteudo';
import { existePost, salvarPost } from '../../../../lib/blog';
import { BLOG_SYSTEM_PROMPT } from '../../../../lib/blogSystemPrompt';
import { OPENAI_MODEL } from '../../../../lib/config';
import { hojeSaoPaulo } from '../../../../lib/dataHoje';
import { slugify } from '../../../../lib/slugify';
import { FEATURE_BLOG } from '../../../../lib/featureFlags';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function gerarPost(client, tema) {
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: BLOG_SYSTEM_PROMPT },
      { role: 'user', content: `Data comemorativa de hoje: "${tema}". Escreva o post.` },
    ],
    max_tokens: 1200,
  });

  const bruto = completion.choices[0].message.content;
  const dados = JSON.parse(bruto);
  if (!dados.titulo || !dados.corpo) throw new Error('Resposta do modelo sem título ou corpo.');
  return dados;
}

// Executado 1x/dia pelo Vercel Cron (ver vercel.json). Protegido por
// CRON_SECRET para não poder ser disparado publicamente.
export async function GET(request) {
  if (!FEATURE_BLOG) {
    return NextResponse.json({ error: 'Feature Blog desativada (NEXT_PUBLIC_FEATURE_BLOG=false).' }, { status: 404 });
  }

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada.' }, { status: 500 });
  }

  const { ano, mes, dia, mesDia } = hojeSaoPaulo();
  const temas = temasDoDia({ ano, mes, dia });
  if (temas.length === 0) {
    return NextResponse.json({ gerados: [], mensagem: 'Nenhuma data comemorativa hoje.' });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const gerados = [];
  const falhas = [];

  for (const { tema } of temas) {
    const slug = `${slugify(tema)}-${ano}`;
    if (await existePost(slug)) continue;

    try {
      const { titulo, resumo, corpo } = await gerarPost(client, tema);
      await salvarPost({
        slug,
        titulo,
        resumo: resumo || '',
        corpo,
        tema,
        dataReferencia: `${ano}-${mesDia}`,
        publicadoEm: Date.now(),
      });
      gerados.push(slug);
    } catch (err) {
      console.error(`Falha ao gerar post do blog para "${tema}":`, err);
      falhas.push(tema);
    }
  }

  return NextResponse.json({ gerados, falhas });
}
