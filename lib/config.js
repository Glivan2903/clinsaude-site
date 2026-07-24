export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

// Max number of tool-calling round-trips the chat agent may perform for a
// single user turn before it's forced to answer without tools.
export const MAX_TOOL_ROUNDS = 6;

export const SPECIALTIES_CACHE_TTL_MS = 15 * 60 * 1000;

export const CLINIC_PHONE_DISPLAY = '(79) 99989-6288';
export const CLINIC_WHATSAPP_URL = 'https://wa.me/5579999896288';
