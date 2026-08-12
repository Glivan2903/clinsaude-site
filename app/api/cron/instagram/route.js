import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { temasDoDia } from '../../../../lib/calendarioConteudo';
import { existeRascunho, salvarRascunho } from '../../../../lib/instagram';
import { INSTAGRAM_SYSTEM_PROMPT } from '../../../../lib/instagramSystemPrompt';
import { OPENAI_MODEL } from '../../../../lib/config';
import { hojeSaoPaulo } from '../../../../lib/dataHoje';
import { slugify } from '../../../../lib/slugify';
import { FEATURE_INSTAGRAM } from '../../../../lib/featureFlags';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function gerarLegenda(client, tema) {
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: INSTAGRAM_SYSTEM_PROMPT },
      { role: 'user', content: `Data comemorativa de hoje: "${tema}". Escreva a legenda.` },
    ],
    max_tokens: 500,
  });

  const bruto = completion.choices[0].message.content;
  const dados = JSON.parse(bruto);
  if (!dados.legenda) throw new Error('Resposta do modelo sem legenda.');
  return dados.legenda;
}

// Executado 1x/dia às 07:30 (horário de Brasília) pelo Vercel Cron (ver
// vercel.json), para dar tempo de revisar e publicar ainda de manhã. Gera só
// a legenda — a imagem é gerada sob demanda no /admin/instagram (botão
// "Gerar imagem"), e a publicação em si é manual, depois de aprovado.
export async function GET(request) {
  if (!FEATURE_INSTAGRAM) {
    return NextResponse.json({ error: 'Feature Instagram desativada (NEXT_PUBLIC_FEATURE_INSTAGRAM=false).' }, { status: 404 });
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

  const { ano, mes, dia } = hojeSaoPaulo();
  const temas = temasDoDia({ ano, mes, dia });
  if (temas.length === 0) {
    return NextResponse.json({ gerados: [], mensagem: 'Nenhuma data comemorativa hoje.' });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const gerados = [];
  const falhas = [];

  for (const { tema } of temas) {
    const slug = `${slugify(tema)}-${ano}`;
    if (await existeRascunho(slug)) continue;

    try {
      const legenda = await gerarLegenda(client, tema);
      await salvarRascunho({
        slug,
        tema,
        legenda,
        publicado: false,
        criadoEm: Date.now(),
      });
      gerados.push(slug);
    } catch (err) {
      console.error(`Falha ao gerar rascunho de Instagram para "${tema}":`, err);
      falhas.push(tema);
    }
  }

  return NextResponse.json({ gerados, falhas });
}
