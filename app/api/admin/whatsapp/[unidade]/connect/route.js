import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '../../../../../../lib/unidadesInfo';
import { connect, getInstanciaUazapi } from '../../../../../../lib/uazapi';

export async function POST(request, { params }) {
  const { unidade } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }
  if (!getInstanciaUazapi(unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade sem instância UAZAPI configurada.' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const phone = typeof body?.phone === 'string' ? body.phone.replace(/\D/g, '') : null;

  try {
    const status = await connect(unidade, phone || undefined);
    return NextResponse.json({ success: true, ...status });
  } catch (error) {
    console.error(`Erro ao conectar a UAZAPI (${unidade}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível gerar o QR code.' }, { status: 502 });
  }
}
