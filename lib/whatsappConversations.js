import { Redis } from '@upstash/redis';

const CONV_PREFIX = 'clinsaude:whatsapp:conv:';
const PAUSA_PREFIX = 'clinsaude:whatsapp:pausa:';
const ECO_PREFIX = 'clinsaude:whatsapp:eco:';
const VISTO_PREFIX = 'clinsaude:whatsapp:visto:';
const CONTATOS_PREFIX = 'clinsaude:whatsapp:contatos:';
const BUFFER_PREFIX = 'clinsaude:whatsapp:buffer:';
const DEBOUNCE_PREFIX = 'clinsaude:whatsapp:debounce:';

const CONV_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 dias de inatividade esquece a conversa
const PAUSA_TTL_SECONDS = 60 * 60; // handoff humano: Sofia fica muda por 60min
const ECO_TTL_SECONDS = 5 * 60; // janela de tolerância para o eco do próprio envio via API
const VISTO_TTL_SECONDS = 60 * 60 * 24; // dedupe de retries do webhook
const BUFFER_TTL_SECONDS = 2 * 60; // rede de segurança se o "vencedor" do debounce nunca rodar
const DEBOUNCE_TOKEN_TTL_SECONDS = 60; // rede de segurança acima do próprio tempo de espera

const HISTORY_MAX_MESSAGES = 30; // trim: limita custo de tokens e tamanho do payload

// Mesmo padrão de lib/instagram.js: sem Upstash configurado, cai para
// memória (só dura enquanto o processo está de pé — não serve pra produção
// serverless multi-instância, mas destrava dev local sem Redis).
function getMemoryStore() {
  if (!globalThis.__clinsaudeWhatsappStore) {
    globalThis.__clinsaudeWhatsappStore = new Map();
  }
  return globalThis.__clinsaudeWhatsappStore;
}

function memoryGet(key) {
  const store = getMemoryStore();
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key, value, ttlSeconds) {
  getMemoryStore().set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

function memoryDelete(key) {
  getMemoryStore().delete(key);
}

let redisClient = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

function chaveConversa(unidadeId, telefone) {
  return `${CONV_PREFIX}${unidadeId}:${telefone}`;
}

function chavePausa(unidadeId, telefone) {
  return `${PAUSA_PREFIX}${unidadeId}:${telefone}`;
}

function chaveEco(unidadeId, messageId) {
  return `${ECO_PREFIX}${unidadeId}:${messageId}`;
}

function chaveVisto(unidadeId, messageId) {
  return `${VISTO_PREFIX}${unidadeId}:${messageId}`;
}

function chaveBuffer(unidadeId, telefone) {
  return `${BUFFER_PREFIX}${unidadeId}:${telefone}`;
}

function chaveDebounce(unidadeId, telefone) {
  return `${DEBOUNCE_PREFIX}${unidadeId}:${telefone}`;
}

function chaveContatos(unidadeId) {
  return `${CONTATOS_PREFIX}${unidadeId}`;
}

export async function getHistorico(unidadeId, telefone) {
  const chave = chaveConversa(unidadeId, telefone);
  const redis = getRedis();
  const historico = redis ? await redis.get(chave) : memoryGet(chave);
  return Array.isArray(historico) ? historico : [];
}

export async function salvarHistorico(unidadeId, telefone, mensagens) {
  const chave = chaveConversa(unidadeId, telefone);
  const trimmed = (mensagens || []).slice(-HISTORY_MAX_MESSAGES);
  const redis = getRedis();
  if (redis) {
    await redis.set(chave, trimmed, { ex: CONV_TTL_SECONDS });
  } else {
    memorySet(chave, trimmed, CONV_TTL_SECONDS);
  }
  return trimmed;
}

// estaPausada combina duas fontes: a pausa automática de handoff (TTL de
// 60min, ver pausarConversa) e o override manual do admin em
// /admin/whatsapp (definirIaAtiva) — que não expira sozinho, só quando o
// admin muda de novo.
export async function estaPausada(unidadeId, telefone) {
  const contato = await getContato(unidadeId, telefone);
  if (contato && contato.iaAtiva === false) return true;

  const chave = chavePausa(unidadeId, telefone);
  const redis = getRedis();
  const valor = redis ? await redis.get(chave) : memoryGet(chave);
  return Boolean(valor);
}

export async function pausarConversa(unidadeId, telefone) {
  const chave = chavePausa(unidadeId, telefone);
  const redis = getRedis();
  if (redis) {
    await redis.set(chave, '1', { ex: PAUSA_TTL_SECONDS });
  } else {
    memorySet(chave, '1', PAUSA_TTL_SECONDS);
  }
}

// Só é necessário se a UAZAPI ecoar via webhook (fromMe:true) as próprias
// mensagens enviadas pela nossa chamada de API — ver Fase 0 do plano.
export async function registrarEcoEnvio(unidadeId, messageId) {
  if (!messageId) return;
  const chave = chaveEco(unidadeId, messageId);
  const redis = getRedis();
  if (redis) {
    await redis.set(chave, '1', { ex: ECO_TTL_SECONDS });
  } else {
    memorySet(chave, '1', ECO_TTL_SECONDS);
  }
}

// Verifica e consome (apaga) a marca de eco — um messageId só é "gasto" uma vez.
export async function consumirEcoEnvio(unidadeId, messageId) {
  if (!messageId) return false;
  const chave = chaveEco(unidadeId, messageId);
  const redis = getRedis();
  if (redis) {
    const existia = await redis.get(chave);
    if (existia) await redis.del(chave);
    return Boolean(existia);
  }
  const existia = memoryGet(chave);
  if (existia) memoryDelete(chave);
  return Boolean(existia);
}

export async function jaProcessado(unidadeId, messageId) {
  if (!messageId) return false;
  const chave = chaveVisto(unidadeId, messageId);
  const redis = getRedis();
  const valor = redis ? await redis.get(chave) : memoryGet(chave);
  return Boolean(valor);
}

export async function marcarProcessado(unidadeId, messageId) {
  if (!messageId) return;
  const chave = chaveVisto(unidadeId, messageId);
  const redis = getRedis();
  if (redis) {
    await redis.set(chave, '1', { ex: VISTO_TTL_SECONDS });
  } else {
    memorySet(chave, '1', VISTO_TTL_SECONDS);
  }
}

// Mapa { [telefone]: contato } por unidade. Volume de contatos de uma
// clínica pequena é baixo o suficiente pra um único blob JSON por unidade
// ser mais simples que um sorted set + hashes separados — sem TTL (a lista
// de conversas é algo que o admin quer ver mesmo dias depois).
async function getMapaContatos(unidadeId) {
  const chave = chaveContatos(unidadeId);
  const redis = getRedis();
  const mapa = redis ? await redis.get(chave) : memoryGet(chave);
  return mapa && typeof mapa === 'object' ? mapa : {};
}

async function salvarMapaContatos(unidadeId, mapa) {
  const chave = chaveContatos(unidadeId);
  const redis = getRedis();
  if (redis) {
    await redis.set(chave, mapa);
  } else {
    memorySet(chave, mapa, null);
  }
}

export async function getContato(unidadeId, telefone) {
  const mapa = await getMapaContatos(unidadeId);
  return mapa[telefone] || null;
}

// Chamado a cada mensagem individual (do paciente ou fromMe) pra manter a
// lista de conversas de /admin/whatsapp atualizada. Preserva o iaAtiva já
// definido pelo admin — só assume true (padrão) num contato novo.
export async function registrarContato(unidadeId, telefone, { nome, ultimaMensagem, autor }) {
  const mapa = await getMapaContatos(unidadeId);
  const atual = mapa[telefone] || { telefone, iaAtiva: true };
  mapa[telefone] = {
    ...atual,
    telefone,
    nome: nome || atual.nome || null,
    ultimaMensagem: ultimaMensagem ?? atual.ultimaMensagem ?? '',
    autor: autor || atual.autor || null,
    ultimaAtividade: Date.now(),
  };
  await salvarMapaContatos(unidadeId, mapa);
}

export async function listarContatos(unidadeId) {
  const mapa = await getMapaContatos(unidadeId);
  return Object.values(mapa)
    .map((c) => ({ ...c, iaAtiva: c.iaAtiva !== false }))
    .sort((a, b) => (b.ultimaAtividade || 0) - (a.ultimaAtividade || 0));
}

// Toggle do admin em /admin/whatsapp: ativar volta a Sofia a responder
// imediatamente (mesmo que ainda faltasse tempo na pausa automática de
// 60min); desativar silencia a Sofia até o admin reativar de novo.
export async function definirIaAtiva(unidadeId, telefone, ativa) {
  const mapa = await getMapaContatos(unidadeId);
  const atual = mapa[telefone] || { telefone, ultimaAtividade: Date.now() };
  mapa[telefone] = { ...atual, telefone, iaAtiva: Boolean(ativa) };
  await salvarMapaContatos(unidadeId, mapa);

  if (ativa) {
    const chave = chavePausa(unidadeId, telefone);
    const redis = getRedis();
    if (redis) await redis.del(chave);
    else memoryDelete(chave);
  }
}

// Debounce de mensagens em sequência: cada mensagem chega numa invocação de
// webhook separada. Em vez de responder uma por uma, cada invocação
// registra sua mensagem no buffer, "reivindica" a vez com um token novo, e
// espera; só quem ainda for o token vigente depois da espera (ninguém mais
// recente chegou nesse intervalo) processa o buffer inteiro de uma vez —
// as demais invocações desistem silenciosamente. Ver app/api/whatsapp/*.

export async function adicionarMensagemPendente(unidadeId, telefone, texto) {
  const chave = chaveBuffer(unidadeId, telefone);
  const redis = getRedis();
  if (redis) {
    await redis.rpush(chave, texto);
    await redis.expire(chave, BUFFER_TTL_SECONDS);
    return;
  }
  const atual = memoryGet(chave) || [];
  atual.push(texto);
  memorySet(chave, atual, BUFFER_TTL_SECONDS);
}

export async function obterELimparPendentes(unidadeId, telefone) {
  const chave = chaveBuffer(unidadeId, telefone);
  const redis = getRedis();
  if (redis) {
    const mensagens = await redis.lrange(chave, 0, -1);
    await redis.del(chave);
    return mensagens || [];
  }
  const mensagens = memoryGet(chave) || [];
  memoryDelete(chave);
  return mensagens;
}

// Gera e registra um token novo pra essa conversa, tornando-o o "vencedor"
// atual do debounce. Retorna o token para o chamador comparar depois de
// esperar.
export async function reivindicarDebounce(unidadeId, telefone) {
  const chave = chaveDebounce(unidadeId, telefone);
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const redis = getRedis();
  if (redis) {
    await redis.set(chave, token, { ex: DEBOUNCE_TOKEN_TTL_SECONDS });
  } else {
    memorySet(chave, token, DEBOUNCE_TOKEN_TTL_SECONDS);
  }
  return token;
}

export async function ehVencedorDebounce(unidadeId, telefone, token) {
  const chave = chaveDebounce(unidadeId, telefone);
  const redis = getRedis();
  const atual = redis ? await redis.get(chave) : memoryGet(chave);
  return atual === token;
}

export async function encerrarDebounce(unidadeId, telefone) {
  const chave = chaveDebounce(unidadeId, telefone);
  const redis = getRedis();
  if (redis) await redis.del(chave);
  else memoryDelete(chave);
}
