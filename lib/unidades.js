import { UNIDADES_INFO } from './unidadesInfo';

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
      apiBaseUrl: process.env[`API_BASE_URL_${id.toUpperCase()}`] || null,
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
