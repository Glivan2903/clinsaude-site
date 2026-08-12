import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { getHistorico } from '@/lib/whatsappConversations';
import { FEATURE_WHATSAPP_INBOX } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

// Só as falas de fato (pergunta do paciente / resposta final da Sofia) —
// chamadas de ferramenta e resultados intermediários não interessam pra
// quem só quer ler a conversa no painel.
function paraExibicao(historico) {
  return historico
    .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
    .map((m) => ({ role: m.role, content: m.content }));
}

export async function GET(request, { params }) {
  if (!FEATURE_WHATSAPP_INBOX) {
    return NextResponse.json({ success: false, error: 'Inbox desativado.' }, { status: 404 });
  }

  const { unidade, numero } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }

  try {
    const historico = await getHistorico(unidade, numero);
    return NextResponse.json({ success: true, historico: paraExibicao(historico) });
  } catch (error) {
    console.error(`Erro ao carregar histórico do contato ${numero} (${unidade}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível carregar o histórico.' }, { status: 502 });
  }
}
