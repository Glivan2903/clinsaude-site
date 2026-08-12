import { NextResponse } from 'next/server';
import { getRascunho, atualizarRascunho } from '@/lib/instagram';

export async function POST(request, { params }) {
  const { slug } = await params;
  const atual = await getRascunho(slug);
  if (!atual) {
    return NextResponse.json({ success: false, error: 'Rascunho não encontrado.' }, { status: 404 });
  }

  const atualizado = await atualizarRascunho(slug, { publicado: !atual.publicado });
  return NextResponse.json({ success: true, publicado: atualizado.publicado });
}
