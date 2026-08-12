import { Redis } from '@upstash/redis';

const POST_KEY_PREFIX = 'clinsaude:blog:post:';
const INDEX_KEY = 'clinsaude:blog:index';

// Mesmo padrão de lib/profissionaisStatus.js: sem Upstash configurado, cai
// para memória (só dura enquanto o processo está de pé). Usa `globalThis`
// porque o Turbopack recarrega módulos entre rota de API e página em dev.
function getMemoryStore() {
  if (!globalThis.__clinsaudeBlogStore) {
    globalThis.__clinsaudeBlogStore = { posts: new Map(), index: [] };
  }
  return globalThis.__clinsaudeBlogStore;
}

let redisClient = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

export async function existePost(slug) {
  const redis = getRedis();
  if (redis) return Boolean(await redis.get(POST_KEY_PREFIX + slug));
  return getMemoryStore().posts.has(slug);
}

export async function salvarPost(post) {
  const redis = getRedis();
  if (redis) {
    await redis.set(POST_KEY_PREFIX + post.slug, post);
    await redis.zadd(INDEX_KEY, { score: post.publicadoEm, member: post.slug });
    return;
  }
  const store = getMemoryStore();
  store.posts.set(post.slug, post);
  store.index = store.index.filter((slug) => slug !== post.slug);
  store.index.push(post.slug);
}

export async function getPost(slug) {
  const redis = getRedis();
  if (redis) return (await redis.get(POST_KEY_PREFIX + slug)) || null;
  return getMemoryStore().posts.get(slug) || null;
}

export async function listarPosts() {
  const redis = getRedis();
  if (redis) {
    const slugs = await redis.zrange(INDEX_KEY, 0, -1, { rev: true });
    if (!slugs.length) return [];
    const posts = await Promise.all(slugs.map((slug) => redis.get(POST_KEY_PREFIX + slug)));
    return posts.filter(Boolean);
  }
  const store = getMemoryStore();
  return [...store.index].reverse().map((slug) => store.posts.get(slug)).filter(Boolean);
}
