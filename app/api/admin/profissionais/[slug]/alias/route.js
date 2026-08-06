import { NextResponse } from 'next/server';
import { setAliasParaSlug } from '@/lib/profissionaisAlias';

export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const resultado = await setAliasParaSlug(slug, body.alias);

  if (!resultado.success) {
    return NextResponse.json(resultado, { status: 409 });
  }
  return NextResponse.json(resultado);
}
