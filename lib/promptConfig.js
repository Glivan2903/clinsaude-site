import { Redis } from '@upstash/redis';

const CHAVE = 'clinsaude:sofia:promptConfig';
const TAMANHO_MAX_CAMPO = 12000; // trava custo de tokens por turno de conversa

const PADRAO = { corpoPrompt: null, atualizadoEm: null };

// Mesmo padrão de lib/instagram.js: sem Upstash configurado, cai para
// memória (só dura enquanto o processo está de pé).
function getMemoryStore() {
  if (!globalThis.__clinsaudePromptConfigStore) {
    globalThis.__clinsaudePromptConfigStore = { config: null };
  }
  return globalThis.__clinsaudePromptConfigStore;
}

let redisClient = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

// corpoPrompt null = nunca customizado, buildSystemPrompt usa DEFAULT_PROMPT_BODY.
export async function getPromptConfig() {
  const redis = getRedis();
  const salvo = redis ? await redis.get(CHAVE) : getMemoryStore().config;
  if (!salvo || typeof salvo !== 'object') return { ...PADRAO };
  return { ...PADRAO, ...salvo };
}

export async function salvarPromptConfig({ corpoPrompt }) {
  const config = {
    corpoPrompt: corpoPrompt == null ? null : String(corpoPrompt).slice(0, TAMANHO_MAX_CAMPO),
    atualizadoEm: Date.now(),
  };

  const redis = getRedis();
  if (redis) {
    await redis.set(CHAVE, config);
  } else {
    getMemoryStore().config = config;
  }
  return config;
}

export { TAMANHO_MAX_CAMPO };
