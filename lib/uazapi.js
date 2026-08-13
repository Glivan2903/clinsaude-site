import dns from 'dns';
import { UNIDADES_INFO } from './unidadesInfo';

// Mesmo workaround de lib/clinvida.js: sem isso, o Node em alguns ambientes
// (Vercel/dev local) tenta IPv6 primeiro e trava esperando timeout antes de
// cair para IPv4 — observado como hang de ~2min nas chamadas à UAZAPI.
dns.setDefaultResultOrder('ipv4first');

// Registro server-only, mesmo espírito de lib/unidades.js: uma unidade sem
// UAZAPI_BASE_URL_<ID>/UAZAPI_TOKEN_<ID> no ambiente simplesmente não
// aparece configurada — fica "desligada" até os envs serem preenchidos.
function getInstanciaUazapi(unidadeId) {
  const id = String(unidadeId || '').toUpperCase();
  const baseUrl = process.env[`UAZAPI_BASE_URL_${id}`];
  const token = process.env[`UAZAPI_TOKEN_${id}`];
  if (!baseUrl || !token) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ''), token };
}

function getInstanciasConfiguradas() {
  return UNIDADES_INFO.map(({ id, nome }) => ({ id, nome, ...getInstanciaUazapi(id) })).filter((u) => u.baseUrl);
}

async function fetchUazapi(baseUrl, path, token, method, body) {
  return fetch(`${baseUrl}/${path}`, {
    method,
    headers: {
      token,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
}

// Client HTTP fino contra a UAZAPI — auth via header "token" (por instância,
// confirmado contra a conta real; sem cache/login, o token já é fixo).
async function uazapiRequest(unidadeId, path, { method = 'GET', body } = {}) {
  const instancia = getInstanciaUazapi(unidadeId);
  if (!instancia) {
    throw new Error(`Unidade "${unidadeId}" não tem instância UAZAPI configurada.`);
  }

  let response;
  try {
    response = await fetchUazapi(instancia.baseUrl, path, instancia.token, method, body);
  } catch (err) {
    // "fetch failed" intermitente (falha de conexão, observado sobretudo na
    // primeira chamada do processo) — uma retentativa resolve na prática.
    try {
      response = await fetchUazapi(instancia.baseUrl, path, instancia.token, method, body);
    } catch (err2) {
      throw new Error(`Falha de rede ao chamar a UAZAPI (${path}): ${err2.message}`);
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.message || `UAZAPI respondeu ${response.status} em ${path}.`);
  }
  return json;
}

// Formato normalizado próprio, isolando o resto do app dos nomes de campo
// reais da UAZAPI (instance.status/qrcode/paircode etc.) — só esta função
// muda se o formato da API divergir do observado contra a conta real.
function normalizarInstancia(json) {
  const instance = json?.instance || {};
  const status = json?.status || {};
  return {
    conectado: Boolean(status.connected),
    estado: instance.status || null, // "disconnected" | "connecting" | "connected" (observado)
    numero: status.jid || null,
    qrcode: instance.qrcode || null, // já vem como data URI: "data:image/png;base64,..."
    paircode: instance.paircode || null,
  };
}

export async function getStatus(unidadeId) {
  const json = await uazapiRequest(unidadeId, 'instance/status');
  return normalizarInstancia(json);
}

// Sem `phone`, a UAZAPI retorna QR code (fluxo padrão). Com `phone` (dígitos
// com código do país, ex: 5579912345678), retorna um pairing code de 8
// caracteres pra digitar em Aparelhos conectados > Conectar com número de
// telefone no próprio WhatsApp, sem precisar escanear nada.
export async function connect(unidadeId, phone) {
  const json = await uazapiRequest(unidadeId, 'instance/connect', {
    method: 'POST',
    body: phone ? { phone } : {},
  });
  return normalizarInstancia(json);
}

export async function disconnect(unidadeId) {
  const json = await uazapiRequest(unidadeId, 'instance/disconnect', { method: 'POST' });
  return normalizarInstancia(json);
}

// Prioriza o domínio fixo de produção da Vercel (populado automaticamente
// pela própria Vercel) sobre o host da requisição atual — evita registrar o
// webhook apontando pra uma URL de preview (derrubada depois do deploy) só
// porque o admin clicou "Configurar webhook" (ou a automação de
// on-connect em components/AdminWhatsappPanel.js) navegando numa preview em
// vez do domínio de produção. Cai pro host da própria requisição só quando
// não há domínio de produção conhecido (dev local, ex.: túnel do
// localtunnel, onde a UAZAPI precisa de uma URL alcançável de fora).
export function resolverOrigemWebhook(requestUrl) {
  const dominioProducao = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return dominioProducao ? `https://${dominioProducao}` : new URL(requestUrl).origin;
}

// Monta a URL do webhook (com ?secret= incluído) a partir de uma origem —
// ver resolverOrigemWebhook acima pra como essa origem é escolhida.
// Retorna null se o segredo ainda não foi configurado no ambiente.
export function montarWebhookUrl(origin, unidadeId) {
  const secret = process.env.UAZAPI_WEBHOOK_SECRET;
  if (!secret) return null;
  return `${origin}/api/whatsapp/${unidadeId}/webhook?secret=${encodeURIComponent(secret)}`;
}

// Registra o webhook da instância na própria UAZAPI, apontando pro endpoint
// /api/whatsapp/<unidade>/webhook do site. webhookUrl já vem pronta (com o
// ?secret= incluído) — ver montarWebhookUrl acima.
export async function configurarWebhook(unidadeId, webhookUrl) {
  await uazapiRequest(unidadeId, 'webhook', {
    method: 'POST',
    body: {
      enabled: true,
      url: webhookUrl,
      events: [],
      excludeMessages: [],
      addUrlEvents: false,
      addUrlTypesMessages: false,
    },
  });
}

// numero já em formato WhatsApp (dígitos com código do país, ex: 5579912345678).
export async function sendText(unidadeId, { numero, texto }) {
  const json = await uazapiRequest(unidadeId, 'send/text', {
    method: 'POST',
    body: { number: numero, text: texto },
  });
  return { messageId: json?.id || json?.messageid || null };
}

export { getInstanciaUazapi, getInstanciasConfiguradas };
