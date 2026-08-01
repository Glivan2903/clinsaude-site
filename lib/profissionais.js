import { unstable_cache } from 'next/cache';
import { clinvidaRequest } from './clinvida';
import { PROFISSIONAIS_CACHE_REVALIDATE_SECONDS } from './config';

function unwrap(json) {
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success === false) {
      throw new Error(json.error || 'Erro ao processar a solicitação no sistema da clínica.');
    }
    return json.data;
  }
  return json;
}

function clean(value) {
  return (value || '').toString().trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchProfissionaisDoCentro(cenCodigo, cenDescricao) {
  const json = await clinvidaRequest(`profissionais/${encodeURIComponent(cenCodigo)}`);
  const data = unwrap(json) || [];
  return data.map((item) => {
    const nomeExibicao = clean(item.profApelido) || clean(item.profNome);
    // profCodigo só é único dentro de um cenCodigo (mesmo médico pode ter
    // profCodigo diferente em outra especialidade), por isso ambos compõem o slug.
    return {
      slug: `${slugify(nomeExibicao)}-${cenCodigo.toLowerCase()}-${item.profCodigo}`,
      cenCodigo,
      especialidade: cenDescricao,
      profCodigo: item.profCodigo,
      consCodigo: clean(item.consCodigo),
      profEstadoCons: clean(item.profEstadoCons),
      nome: clean(item.profNome),
      apelido: clean(item.profApelido),
      obs: clean(item.profObs),
    };
  });
}

async function buildDiretorioProfissionais() {
  const centrosJson = await clinvidaRequest('centros');
  const centros = unwrap(centrosJson) || [];
  const listas = await Promise.all(
    centros.map((centro) => fetchProfissionaisDoCentro(clean(centro.cenCodigo), clean(centro.cenDescricao)))
  );
  return listas.flat();
}

// Agrega profissionais de todas as especialidades numa única lista, já que o
// backend ClinVida só expõe /profissionais/{cenCodigo} (não existe endpoint
// para listar todos os médicos de uma vez).
export const getTodosProfissionais = unstable_cache(buildDiretorioProfissionais, ['profissionais-diretorio'], {
  revalidate: PROFISSIONAIS_CACHE_REVALIDATE_SECONDS,
  tags: ['profissionais'],
});

export async function getProfissionalPorSlug(slug) {
  const todos = await getTodosProfissionais();
  return todos.find((profissional) => profissional.slug === slug) || null;
}
