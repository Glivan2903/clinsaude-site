import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { montarConteudoInstitucional, TIPOS_INSTITUCIONAIS } from '@/lib/conteudoInstitucional';
import { salvarRascunho } from '@/lib/instagram';
import { INSTAGRAM_INSTITUCIONAL_SYSTEM_PROMPT } from '@/lib/instagramSystemPrompt';
import { OPENAI_MODEL } from '@/lib/config';
import { slugify } from '@/lib/slugify';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TIPOS_VALIDOS = new Set([...TIPOS_INSTITUCIONAIS.map((t) => t.valor), 'aleatorio']);

async function gerarLegenda(client, contexto) {
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: INSTAGRAM_INSTITUCIONAL_SYSTEM_PROMPT },
      { role: 'user', content: contexto },
    ],
    max_tokens: 500,
  });

  const bruto = completion.choices[0].message.content;
  const dados = JSON.parse(bruto);
  if (!dados.legenda) throw new Error('Resposta do modelo sem legenda.');
  return dados.legenda;
}

// Gerado sob clique no /admin/instagram, quando não há data comemorativa no
// dia — divulga a própria clínica (profissional, especialidade, horários,
// agenda aberta) em vez de uma efeméride.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const tipo = TIPOS_VALIDOS.has(body.tipo) ? body.tipo : 'aleatorio';

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ success: false, error: 'OPENAI_API_KEY não configurada.' }, { status: 500 });
  }

  try {
    const { tema, contexto } = await montarConteudoInstitucional(tipo);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const legenda = await gerarLegenda(client, contexto);

    const rascunho = {
      slug: `institucional-${slugify(tema)}-${Date.now()}`,
      tema,
      legenda,
      publicado: false,
      criadoEm: Date.now(),
    };
    await salvarRascunho(rascunho);

    return NextResponse.json({ success: true, rascunho });
  } catch (err) {
    console.error('Falha ao gerar conteúdo institucional do Instagram:', err);
    const mensagem = err?.error?.message || err?.message || 'Falha ao gerar conteúdo.';
    return NextResponse.json({ success: false, error: mensagem }, { status: 502 });
  }
}
