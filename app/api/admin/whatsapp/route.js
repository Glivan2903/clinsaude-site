import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '../../../../lib/unidadesInfo';
import { getStatus, getInstanciaUazapi } from '../../../../lib/uazapi';

export const dynamic = 'force-dynamic';

export async function GET() {
  const resultados = await Promise.allSettled(
    UNIDADES_INFO.map(async ({ id, nome }) => {
      if (!getInstanciaUazapi(id)) {
        return { id, nome, configurada: false };
      }
      const status = await getStatus(id);
      return { id, nome, configurada: true, ...status };
    })
  );

  const unidades = UNIDADES_INFO.map(({ id, nome }, idx) => {
    const r = resultados[idx];
    if (r.status === 'fulfilled') return r.value;
    console.warn(`Unidade "${id}" não respondeu ao status da UAZAPI:`, r.reason?.message || r.reason);
    return { id, nome, configurada: true, conectado: false, estado: 'erro' };
  });

  return NextResponse.json({ success: true, unidades });
}
