import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { getInstanciaUazapi } from '@/lib/uazapi';
import { listarContatos } from '@/lib/whatsappConversations';

export const dynamic = 'force-dynamic';

const JANELA_MS = 48 * 60 * 60 * 1000; // conversas das últimas 48h, Matriz+Filial juntas

// Agrega as conversas de todas as unidades configuradas num só feed,
// ordenado por atividade mais recente — é o que alimenta a barra lateral
// estilo WhatsApp Web/Izing em /admin/whatsapp.
export async function GET() {
  try {
    const unidadesConfiguradas = UNIDADES_INFO.filter((u) => getInstanciaUazapi(u.id));

    const listas = await Promise.all(
      unidadesConfiguradas.map(async ({ id, nome }) => {
        const contatos = await listarContatos(id);
        return contatos.map((c) => ({ ...c, unidadeId: id, unidadeNome: nome }));
      })
    );

    const agora = Date.now();
    const conversas = listas
      .flat()
      .filter((c) => c.ultimaAtividade && agora - c.ultimaAtividade <= JANELA_MS)
      .sort((a, b) => (b.ultimaAtividade || 0) - (a.ultimaAtividade || 0));

    return NextResponse.json({ success: true, conversas });
  } catch (error) {
    console.error('Erro ao listar conversas do Whatsapp:', error);
    return NextResponse.json({ success: false, error: 'Não foi possível carregar as conversas.' }, { status: 502 });
  }
}
