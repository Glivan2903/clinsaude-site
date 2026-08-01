import { Redis } from '@upstash/redis';

const STATUS_KEY_PREFIX = 'clinsaude:profissional:ativo:';

// Sem Redis configurado (ex: dev local sem Upstash), cai para um Map em
// memória — só funciona enquanto o processo do servidor estiver de pé (reseta
// a cada restart) e não sobrevive a múltiplas instâncias serverless em
// produção. Usa `globalThis` (não uma variável de módulo comum) porque o
// Turbopack/Next recarrega módulos entre a rota de API e a página em dev,
// o que faria uma variável de módulo comum perder o valor entre uma e outra.
function getMemoryStore() {
  if (!globalThis.__clinsaudeProfissionaisStatusStore) {
    globalThis.__clinsaudeProfissionaisStatusStore = new Map();
  }
  return globalThis.__clinsaudeProfissionaisStatusStore;
}

let redisClient = null;

function getRedisUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function getRedisToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

function getStore() {
  const url = getRedisUrl();
  const token = getRedisToken();

  if (url && token) {
    if (!redisClient) {
      redisClient = new Redis({ url, token });
    }
    return {
      get: (key) => redisClient.get(key),
      set: (key, value) => redisClient.set(key, value),
    };
  }

  const memoryStore = getMemoryStore();
  return {
    get: async (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    set: async (key, value) => {
      memoryStore.set(key, value);
    },
  };
}

// Um profissional só fica com o link ativo depois que o admin liga
// explicitamente (ver app/admin) — por padrão, sem registro salvo, é inativo.
export async function isProfissionalAtivo(slug) {
  const store = getStore();
  const value = await store.get(STATUS_KEY_PREFIX + slug);
  return value === true || value === 'true';
}

export async function setProfissionalAtivo(slug, ativo) {
  const store = getStore();
  await store.set(STATUS_KEY_PREFIX + slug, Boolean(ativo));
}

export async function getStatusParaSlugs(slugs) {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await isProfissionalAtivo(slug)])
  );
  return Object.fromEntries(entries);
}
