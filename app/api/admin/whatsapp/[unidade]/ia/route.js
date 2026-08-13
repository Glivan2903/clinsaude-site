import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { definirIaAtivaUnidade } from '@/lib/whatsappConversations';

// Interruptor geral da IA por unidade — diferente do toggle por conversa em
// .../contatos/[numero]. Desligado aqui, a Sofia não responde a ninguém
// nessa unidade (ver checagem em app/api/whatsapp/[unidade]/webhook).
export async function POST(request, { params }) {
  const { unidade } = await params;
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
    const ativa = Boolean(body?.ativa);
    await definirIaAtivaUnidade(unidade, ativa);
    return NextResponse.json({ success: true, ativa });
  } catch (error) {
    console.error(`Erro ao atualizar IA da unidade ${unidade}:`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível atualizar.' }, { status: 502 });
  }
}
