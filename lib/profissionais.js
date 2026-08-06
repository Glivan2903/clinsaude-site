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

export function slugify(value) {
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

// O ClinVida cadastra o mesmo profissional uma vez por especialidade/exame em
// que atua (mesmo CRM, cenCodigo diferente) — por isso a lista "crua" tem
// Hamilcar Torres, por exemplo, aparecendo em "Angiologia" e "Duplex-Scan"
// como duas entradas distintas. Essa chave agrupa essas entradas pela
// identidade real do profissional (conselho + código + estado = o próprio
// registro do CRM/CRN). Quando algum desses três campos vem vazio (equipe
// sem conselho cadastrado), não há como confirmar a identidade com
// segurança, então o item fica "sozinho" (nunca agrupamos por suposição).
function chaveIdentidade(item) {
  if (item.consCodigo && item.profCodigo && item.profEstadoCons) {
    return `${item.consCodigo}|${item.profCodigo}|${item.profEstadoCons}`;
  }
  return null;
}

async function buildProfissionaisUnificados() {
  const todos = await getTodosProfissionais();
  const grupos = new Map();

  for (const item of todos) {
    const chave = chaveIdentidade(item) || `solo:${item.slug}`;
    if (!grupos.has(chave)) {
      const nomeExibicao = item.apelido || item.nome;
      grupos.set(chave, {
        slug: `${slugify(nomeExibicao)}-${item.profCodigo}`,
        nome: item.nome,
        apelido: item.apelido,
        consCodigo: item.consCodigo,
        profCodigo: item.profCodigo,
        profEstadoCons: item.profEstadoCons,
        obs: item.obs,
        especialidades: [],
      });
    }
    grupos.get(chave).especialidades.push({
      especialidade: item.especialidade,
      cenCodigo: item.cenCodigo,
      slugOriginal: item.slug,
    });
  }

  return Array.from(grupos.values());
}

// Visão pública/admin: um único card/link por profissional, com todos os
// serviços (especialidades/exames) que ele realiza. Não precisa de cache
// próprio — a chamada cara (fetch no ClinVida) já está cacheada dentro de
// getTodosProfissionais(); agrupar em memória é praticamente grátis.
export async function getProfissionaisUnificados() {
  return buildProfissionaisUnificados();
}

// Resolve o slug unificado, um alias customizado do admin, OU um link antigo
// no formato por especialidade (ex: .../hamilcar-torres-ang-1652) — para que
// um link já divulgado antes da unificação continue funcionando.
export async function getProfissionalUnificadoPorSlugOuAlias(slugOuAlias) {
  const unificados = await getProfissionaisUnificados();

  const porSlug = unificados.find((p) => p.slug === slugOuAlias);
  if (porSlug) return porSlug;

  const { getSlugPorAlias } = await import('./profissionaisAlias');
  const slugReal = await getSlugPorAlias(slugOuAlias);
  if (slugReal) {
    const porAlias = unificados.find((p) => p.slug === slugReal);
    if (porAlias) return porAlias;
  }

  // Link antigo, no formato por especialidade (ex: .../hamilcar-torres-ang-1652):
  // resolve para o profissional unificado, mas marca qual especialidade era a
  // do link original para pular a etapa de escolha (quem já tinha o link
  // salvo/divulgado continua indo direto para a mesma agenda).
  for (const p of unificados) {
    const especialidade = p.especialidades.find((e) => e.slugOriginal === slugOuAlias);
    if (especialidade) {
      return { ...p, especialidadeSugerida: especialidade.cenCodigo };
    }
  }
  return null;
}
