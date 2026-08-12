import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { sendText, getInstanciaUazapi } from '@/lib/uazapi';
import {
  getHistorico,
  salvarHistorico,
  registrarContato,
  registrarEcoEnvio,
  pausarConversa,
} from '@/lib/whatsappConversations';

// Envio manual do admin direto pelo painel (fora do fluxo da Sofia). Ao
// enviar, pausa a IA por 60min (mesma pausa automática de handoff — ver
// pausarConversa em lib/whatsappConversations.js) e grava a mensagem no
// histórico como "assistant", pra Sofia saber o que já foi dito se retomar.
export async function POST(request, { params }) {
  const { unidade, numero } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }
  if (!getInstanciaUazapi(unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade sem instância UAZAPI configurada.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido.' }, { status: 400 });
  }

  const texto = typeof body?.texto === 'string' ? body.texto.trim() : '';
  if (!texto) {
    return NextResponse.json({ success: false, error: 'Mensagem vazia.' }, { status: 400 });
  }

  try {
    const envio = await sendText(unidade, { numero, texto });
    await registrarEcoEnvio(unidade, envio.messageId);
    await pausarConversa(unidade, numero);

    const historicoAtual = await getHistorico(unidade, numero);
    await salvarHistorico(unidade, numero, [...historicoAtual, { role: 'assistant', content: texto }]);
    await registrarContato(unidade, numero, { ultimaMensagem: texto, autor: 'atendente' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Erro ao enviar mensagem manual do Whatsapp (${unidade}/${numero}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível enviar a mensagem.' }, { status: 502 });
  }
}
