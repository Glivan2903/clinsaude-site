import { NextResponse } from 'next/server';
import { isProfissionalAtivo, setProfissionalAtivo } from '@/lib/profissionaisStatus';

export async function POST(request, { params }) {
  const { slug } = await params;
  const atual = await isProfissionalAtivo(slug);
  const novoStatus = !atual;
  await setProfissionalAtivo(slug, novoStatus);
  return NextResponse.json({ success: true, ativo: novoStatus });
}
