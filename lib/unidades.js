import { UNIDADES_INFO } from './unidadesInfo';

// "false" (deixado assim de propósito no .env, sem apagar a variável) conta
// como não configurada, igual string vazia.
function normalizarApiBaseUrl(valor) {
  if (!valor || valor.trim().toLowerCase() === 'false') return null;
  return valor;
}

// Registro server-only das unidades — cada uma aponta pro seu próprio
// backend/banco ClinVida. Uma unidade sem API_BASE_URL_<ID> no ambiente
// simplesmente não aparece em getUnidadesConfiguradas() nem é resolvida por
// getUnidade(): é assim que a Filial pode ficar desligada até sua URL ser
// preenchida, sem quebrar nada que já funciona só com a Matriz.
export const UNIDADES = Object.fromEntries(
  UNIDADES_INFO.map(({ id, nome }) => [
    id,
    {
      id,
      nome: `Unidade ${nome}`,
      apiBaseUrl: normalizarApiBaseUrl(process.env[`API_BASE_URL_${id.toUpperCase()}`]),
    },
  ])
);

export function getUnidade(unidadeId) {
  const unidade = UNIDADES[unidadeId];
  if (!unidade || !unidade.apiBaseUrl) return null;
  return unidade;
}

export function getUnidadesConfiguradas() {
  return Object.values(UNIDADES).filter((u) => Boolean(u.apiBaseUrl));
}

// Atalho pros componentes visuais (Footer, AboutSection) que mostram um
// bloco fixo por unidade — evita repetir esse cálculo em cada página.
export function getUnidadesFooterProps() {
  const ids = getUnidadesConfiguradas().map((u) => u.id);
  return { mostrarMatriz: ids.includes('matriz'), mostrarFilial: ids.includes('filial') };
}
