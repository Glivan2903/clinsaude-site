import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { listarContatos } from '@/lib/whatsappConversations';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { unidade } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }

  try {
    const contatos = await listarContatos(unidade);
    return NextResponse.json({ success: true, contatos });
  } catch (error) {
    console.error(`Erro ao listar contatos do Whatsapp (${unidade}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível carregar os contatos.' }, { status: 502 });
  }
}
