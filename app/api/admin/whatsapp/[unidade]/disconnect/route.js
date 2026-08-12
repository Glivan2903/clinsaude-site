import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '../../../../../../lib/unidadesInfo';
import { disconnect, getInstanciaUazapi } from '../../../../../../lib/uazapi';

export async function POST(request, { params }) {
  const { unidade } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }
  if (!getInstanciaUazapi(unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade sem instância UAZAPI configurada.' }, { status: 400 });
  }

  try {
    const status = await disconnect(unidade);
    return NextResponse.json({ success: true, ...status });
  } catch (error) {
    console.error(`Erro ao desconectar a UAZAPI (${unidade}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível desconectar.' }, { status: 502 });
  }
}
