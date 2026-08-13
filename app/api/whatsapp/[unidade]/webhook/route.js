import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { sendText } from '@/lib/uazapi';
import { runSofiaTurn } from '@/lib/sofiaEngine';
import { FEATURE_WHATSAPP } from '@/lib/featureFlags';
import { baixarEDescriptografarMidia, transcreverAudio } from '@/lib/whatsappMedia';
import {
  getHistorico,
  salvarHistorico,
  estaPausada,
  getIaAtivaUnidade,
  pausarConversa,
  registrarEcoEnvio,
  consumirEcoEnvio,
  jaProcessado,
  marcarProcessado,
  registrarContato,
  getContato,
  adicionarMensagemPendente,
  obterELimparPendentes,
  reivindicarDebounce,
  ehVencedorDebounce,
  encerrarDebounce,
  SAUDACAO_GAP_MS,
} from '@/lib/whatsappConversations';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Tempo de espera após cada mensagem recebida antes de responder — se o
// paciente mandar mais mensagens em sequência (ex.: "Olá" / "Bom dia" /
// "Tudo bem?" em 3 envios separados), a Sofia junta tudo e responde uma
// única vez em vez de uma resposta por mensagem. Ver
// lib/whatsappConversations.js (adicionarMensagemPendente/reivindicarDebounce).
const DEBOUNCE_MS = 10_000;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Confirmado contra payload real (Fase 0/4): envelope { EventType, message,
// chat, ... }. Só processamos EventType "messages" — os demais (ex.:
// "messages_update" de recibo de leitura, "chats") não nos interessam.
// message.chatid identifica a conversa de forma estável (para chats
// individuais, é o JID do paciente) mesmo quando message.sender vier como
// pseudo-id "@lid" (novo recurso de privacidade do WhatsApp).
function parseWebhookPayload(body) {
  if (body?.EventType !== 'messages') return null;
  const msg = body?.message;
  if (!msg || typeof msg !== 'object') return null;

  const messageId = msg.messageid || msg.id || null;
  const numero = String(msg.chatid || '').replace(/@.*$/, '');
  if (!messageId || !numero) return null;

  // Nota de voz (PTT): mídia vem criptografada (content.URL + content.mediaKey).
  const audio =
    msg.mediaType === 'ptt' && msg.content?.URL && msg.content?.mediaKey
      ? { url: msg.content.URL, mediaKey: msg.content.mediaKey }
      : null;

  return {
    messageId,
    isGroup: Boolean(msg.isGroup),
    fromMe: Boolean(msg.fromMe),
    texto: String(msg.text || ''),
    numero,
    audio,
    nome: msg.senderName || null,
  };
}

async function processarEvento(unidade, body) {
  const evento = parseWebhookPayload(body);
  if (!evento) return;
  const { messageId, isGroup, fromMe, numero, audio, nome } = evento;
  let texto = evento.texto;

  if (await jaProcessado(unidade, messageId)) return;

  if (isGroup) {
    await marcarProcessado(unidade, messageId);
    return; // Sofia nunca responde em grupos.
  }

  if (fromMe) {
    const eraEcoDoBot = await consumirEcoEnvio(unidade, messageId);
    if (!eraEcoDoBot && texto.trim()) {
      // Mensagem enviada manualmente pelo dispositivo conectado (direto no
      // app do Whatsapp, fora do painel): um atendente humano assumiu —
      // Sofia fica muda por 60min (lib/whatsappConversations.js). Precisa
      // gravar no histórico completo também (mesmo "role: assistant" do
      // envio manual do painel), senão ela só aparece no preview da lista de
      // conversas e some ao abrir o chat.
      await pausarConversa(unidade, numero);
      const historicoAtual = await getHistorico(unidade, numero);
      await salvarHistorico(unidade, numero, [...historicoAtual, { role: 'assistant', content: texto }]);
      await registrarContato(unidade, numero, { nome, ultimaMensagem: texto, autor: 'atendente' });
    }
    await marcarProcessado(unidade, messageId);
    return;
  }

  if (!texto.trim() && audio) {
    try {
      const bufferDecriptado = await baixarEDescriptografarMidia({ url: audio.url, mediaKey: audio.mediaKey, tipo: 'audio' });
      texto = await transcreverAudio(bufferDecriptado);
    } catch (error) {
      console.error(`Erro ao transcrever áudio do Whatsapp (${unidade}):`, error);
    }
  }

  if (!texto.trim()) {
    await marcarProcessado(unidade, messageId);
    return;
  }

  // Captura a última atividade ANTES de registrarContato sobrescrever com
  // "agora" — é essa diferença que diz se o paciente sumiu por um tempo.
  const contatoAnterior = await getContato(unidade, numero);
  const ultimaAtividadeAnterior = contatoAnterior?.ultimaAtividade || null;

  await marcarProcessado(unidade, messageId);
  await registrarContato(unidade, numero, { nome, ultimaMensagem: texto, autor: 'paciente' });

  // Debounce: registra esta mensagem no buffer e "reivindica" a vez. Se
  // chegar outra mensagem do mesmo paciente durante a espera, ela reivindica
  // de novo e esta invocação desiste — só quem ainda for o token vigente
  // depois da espera processa o buffer inteiro de uma vez.
  await adicionarMensagemPendente(unidade, numero, texto);
  const token = await reivindicarDebounce(unidade, numero);
  await esperar(DEBOUNCE_MS);
  if (!(await ehVencedorDebounce(unidade, numero, token))) return;

  const pendentes = await obterELimparPendentes(unidade, numero);
  await encerrarDebounce(unidade, numero);
  const textoCombinado = (pendentes.length ? pendentes : [texto]).join('\n');

  const historicoAnterior = await getHistorico(unidade, numero);
  const historicoComPergunta = [...historicoAnterior, { role: 'user', content: textoCombinado }];
  await salvarHistorico(unidade, numero, historicoComPergunta);

  if (await estaPausada(unidade, numero)) return; // atendente humano está conversando
  if (!(await getIaAtivaUnidade(unidade))) return; // IA desligada pra toda a unidade nas configurações

  const primeiraMensagem = historicoAnterior.length === 0;
  // Conversa nova já é coberta por primeiraMensagem acima — aqui só cobre
  // quem TEM histórico mas sumiu por mais de SAUDACAO_GAP_MS.
  const saudarNovamente =
    !primeiraMensagem &&
    (!ultimaAtividadeAnterior || Date.now() - ultimaAtividadeAnterior > SAUDACAO_GAP_MS);

  const { reply, historico } = await runSofiaTurn(historicoComPergunta, {
    today: new Date(),
    saudarNovamente,
    primeiraMensagem,
    contexto: { unidade, nome, telefone: numero },
  });
  await salvarHistorico(unidade, numero, historico);

  const envio = await sendText(unidade, { numero, texto: reply });
  await registrarEcoEnvio(unidade, envio.messageId);
  await registrarContato(unidade, numero, { ultimaMensagem: reply, autor: 'sofia' });
}

export async function POST(request, { params }) {
  if (!FEATURE_WHATSAPP) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { unidade } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const secretEsperado = process.env.UAZAPI_WEBHOOK_SECRET;
  const secretRecebido = request.nextUrl.searchParams.get('secret');
  if (!secretEsperado || secretRecebido !== secretEsperado) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // payload malformado: não faz sentido reenviar
  }

  try {
    await processarEvento(unidade, body);
  } catch (error) {
    console.error(`Erro ao processar webhook do Whatsapp (${unidade}):`, error);
  }

  // Sempre 200: evita que a UAZAPI reenvie o mesmo evento em loop por erro nosso.
  return NextResponse.json({ ok: true });
}
