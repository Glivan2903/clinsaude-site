import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { definirIaAtiva } from '@/lib/whatsappConversations';

export async function POST(request, { params }) {
  const { unidade, numero } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido.' }, { status: 400 });
  }

  try {
    const ativa = Boolean(body?.iaAtiva);
    await definirIaAtiva(unidade, numero, ativa);
    return NextResponse.json({ success: true, iaAtiva: ativa });
  } catch (error) {
    console.error(`Erro ao atualizar IA do contato ${numero} (${unidade}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível atualizar.' }, { status: 502 });
  }
}
