export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

// Max number of tool-calling round-trips the chat agent may perform for a
// single user turn before it's forced to answer without tools.
export const MAX_TOOL_ROUNDS = 6;

export const SPECIALTIES_CACHE_TTL_MS = 15 * 60 * 1000;

// How long the aggregated directory of professionals (all specialties) stays
// cached before Next.js revalidates it in the background.
export const PROFISSIONAIS_CACHE_REVALIDATE_SECONDS = 60 * 60;

export const CLINIC_PHONE_DISPLAY_MATRIZ = '(79) 99857-1937';
export const CLINIC_WHATSAPP_URL_MATRIZ = 'https://wa.me/5579998571937';

export const CLINIC_PHONE_DISPLAY_FILIAL = '(79) 99156-6040';
export const CLINIC_WHATSAPP_URL_FILIAL = 'https://wa.me/5579991566040';

// Usados apenas quando a unidade ainda não é conhecida (ex.: hero da home, chat da Sofia).
export const CLINIC_PHONE_DISPLAY = CLINIC_PHONE_DISPLAY_MATRIZ;
export const CLINIC_WHATSAPP_URL = CLINIC_WHATSAPP_URL_MATRIZ;

export const CLINIC_HORARIO_ATENDIMENTO = 'Segunda a sexta 06h–16h · Sábado 06h–12h · Domingo fechado';
