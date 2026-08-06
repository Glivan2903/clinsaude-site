import { Redis } from '@upstash/redis';
import { slugify, getProfissionaisUnificados } from './profissionais';

const ALIAS_KEY_PREFIX = 'clinsaude:profissional:alias:'; // slug real -> alias
const ALIAS_REVERSE_PREFIX = 'clinsaude:profissional:aliasSlug:'; // alias -> slug real

// Mesmo padrão de fallback do lib/profissionaisStatus.js: sem Redis
// configurado, usa um Map em memória (não sobrevive a restart nem a
// múltiplas instâncias serverless).
function getMemoryStore() {
  if (!globalThis.__clinsaudeProfissionaisAliasStore) {
    globalThis.__clinsaudeProfissionaisAliasStore = new Map();
  }
  return globalThis.__clinsaudeProfissionaisAliasStore;
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
      del: (key) => redisClient.del(key),
    };
  }

  const memoryStore = getMemoryStore();
  return {
    get: async (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    set: async (key, value) => {
      memoryStore.set(key, value);
    },
    del: async (key) => {
      memoryStore.delete(key);
    },
  };
}

export async function getAliasPorSlug(slug) {
  const store = getStore();
  const alias = await store.get(ALIAS_KEY_PREFIX + slug);
  return alias || null;
}

export async function getAliasParaSlugs(slugs) {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await getAliasPorSlug(slug)])
  );
  return Object.fromEntries(entries);
}

export async function getSlugPorAlias(alias) {
  const store = getStore();
  const slug = await store.get(ALIAS_REVERSE_PREFIX + slugify(alias));
  return slug || null;
}

// Define (ou remove, se alias vier vazio) o link personalizado de um
// profissional. Rejeita aliases que colidam com o slug real de outro
// profissional ou com o alias já usado por outro — para nunca deixar duas
// pessoas disputando a mesma URL.
export async function setAliasParaSlug(slug, aliasBruto) {
  const store = getStore();
  const aliasLimpo = slugify(aliasBruto || '');

  const aliasAnterior = await getAliasPorSlug(slug);

  if (!aliasLimpo) {
    if (aliasAnterior) await store.del(ALIAS_REVERSE_PREFIX + aliasAnterior);
    await store.del(ALIAS_KEY_PREFIX + slug);
    return { success: true, alias: null };
  }

  if (aliasLimpo.length < 3) {
    return { success: false, error: 'O link personalizado precisa ter pelo menos 3 caracteres.' };
  }

  const unificados = await getProfissionaisUnificados();
  const colideComSlugReal = unificados.some((p) => p.slug === aliasLimpo && p.slug !== slug);
  if (colideComSlugReal) {
    return { success: false, error: 'Esse link já é usado pela página padrão de outro profissional.' };
  }

  const slugDoAliasExistente = await getSlugPorAlias(aliasLimpo);
  if (slugDoAliasExistente && slugDoAliasExistente !== slug) {
    return { success: false, error: 'Esse link personalizado já está em uso por outro profissional.' };
  }

  if (aliasAnterior && aliasAnterior !== aliasLimpo) {
    await store.del(ALIAS_REVERSE_PREFIX + aliasAnterior);
  }

  await store.set(ALIAS_KEY_PREFIX + slug, aliasLimpo);
  await store.set(ALIAS_REVERSE_PREFIX + aliasLimpo, slug);
  return { success: true, alias: aliasLimpo };
}
