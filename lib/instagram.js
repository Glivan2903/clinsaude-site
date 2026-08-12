import { Redis } from '@upstash/redis';

const RASCUNHO_KEY_PREFIX = 'clinsaude:instagram:rascunho:';
const INDEX_KEY = 'clinsaude:instagram:index';

// Mesmo padrão de lib/blog.js e lib/profissionaisStatus.js: sem Upstash
// configurado, cai para memória (só dura enquanto o processo está de pé).
function getMemoryStore() {
  if (!globalThis.__clinsaudeInstagramStore) {
    globalThis.__clinsaudeInstagramStore = { rascunhos: new Map(), index: [] };
  }
  return globalThis.__clinsaudeInstagramStore;
}

let redisClient = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

export async function existeRascunho(slug) {
  const redis = getRedis();
  if (redis) return Boolean(await redis.get(RASCUNHO_KEY_PREFIX + slug));
  return getMemoryStore().rascunhos.has(slug);
}

export async function salvarRascunho(rascunho) {
  const redis = getRedis();
  if (redis) {
    await redis.set(RASCUNHO_KEY_PREFIX + rascunho.slug, rascunho);
    await redis.zadd(INDEX_KEY, { score: rascunho.criadoEm, member: rascunho.slug });
    return;
  }
  const store = getMemoryStore();
  store.rascunhos.set(rascunho.slug, rascunho);
  store.index = store.index.filter((slug) => slug !== rascunho.slug);
  store.index.push(rascunho.slug);
}

export async function getRascunho(slug) {
  const redis = getRedis();
  if (redis) return (await redis.get(RASCUNHO_KEY_PREFIX + slug)) || null;
  return getMemoryStore().rascunhos.get(slug) || null;
}

export async function listarRascunhos() {
  const redis = getRedis();
  if (redis) {
    const slugs = await redis.zrange(INDEX_KEY, 0, -1, { rev: true });
    if (!slugs.length) return [];
    const rascunhos = await Promise.all(slugs.map((slug) => redis.get(RASCUNHO_KEY_PREFIX + slug)));
    return rascunhos.filter(Boolean);
  }
  const store = getMemoryStore();
  return [...store.index].reverse().map((slug) => store.rascunhos.get(slug)).filter(Boolean);
}

export async function atualizarRascunho(slug, alteracoes) {
  const atual = await getRascunho(slug);
  if (!atual) return null;
  const atualizado = { ...atual, ...alteracoes };
  await salvarRascunho(atualizado);
  return atualizado;
}
