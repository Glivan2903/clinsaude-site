import { NextResponse } from 'next/server';
import { getRascunho, atualizarRascunho } from '@/lib/instagram';

export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const legenda = typeof body.legenda === 'string' ? body.legenda.trim() : '';

  if (!legenda) {
    return NextResponse.json({ success: false, error: 'Legenda não pode ficar vazia.' }, { status: 400 });
  }

  const atual = await getRascunho(slug);
  if (!atual) {
    return NextResponse.json({ success: false, error: 'Rascunho não encontrado.' }, { status: 404 });
  }

  const atualizado = await atualizarRascunho(slug, { legenda });
  return NextResponse.json({ success: true, legenda: atualizado.legenda });
}
