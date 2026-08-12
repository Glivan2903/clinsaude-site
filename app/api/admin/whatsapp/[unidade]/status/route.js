import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '../../../../../../lib/unidadesInfo';
import { getStatus, getInstanciaUazapi } from '../../../../../../lib/uazapi';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { unidade } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }
  if (!getInstanciaUazapi(unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade sem instância UAZAPI configurada.' }, { status: 400 });
  }

  try {
    const status = await getStatus(unidade);
    return NextResponse.json({ success: true, ...status });
  } catch (error) {
    console.error(`Erro ao consultar status da UAZAPI (${unidade}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível consultar o status.' }, { status: 502 });
  }
}
