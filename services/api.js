// Este serviço faz chamadas para a nossa API Route (Proxy), que por sua vez chama o backend ClinVida.

const BASE_URL = '/api/agendamento';

async function fetchAndUnwrap(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  if (json && typeof json === 'object') {
    if ('success' in json) {
      if (json.success === false) {
        throw new Error(json.error || 'Ocorreu um erro ao processar a solicitação.');
      }
      return json.data;
    }
  }
  return json;
}

export async function getCentros() {
  const data = await fetchAndUnwrap(`${BASE_URL}/centros`);
  return (data || []).map(item => ({
    CEN_CODIGO: item.cenCodigo,
    CEN_DESCRICAO: item.cenDescricao
  }));
}

export async function getProfissionais(cenCodigo) {
  const data = await fetchAndUnwrap(`${BASE_URL}/profissionais/${cenCodigo}`);
  return (data || []).map(item => ({
    PROF_CODIGO: item.profCodigo,
    PROF_NOME: item.profNome,
    PROF_ESTADO_CONS: item.profEstadoCons,
    CONS_CODIGO: item.consCodigo,
    PROF_CODIGO_EXPR: item.profCodigoExpr
  }));
}

export async function getOpcoes(cen, prof, cons, uf) {
  const data = await fetchAndUnwrap(`${BASE_URL}/opcoes/${cen}/${prof}/${cons}/${uf}`);
  return (data || []).map(item => ({
    TIPO: item.tipo,
    CODIGO: item.codigo,
    DESCRICAO: item.descricao
  }));
}

export async function getDias(cen, prof, cons, uf) {
  const data = await fetchAndUnwrap(`${BASE_URL}/dias/${cen}/${prof}/${cons}/${uf}`);
  return (data || []).map(item => ({
    HAG_DIA: item.hagDia,
    ORDEMDIA: item.ordemdia
  }));
}

export async function getHorarios(cen, prof, cons, uf, dia) {
  const data = await fetchAndUnwrap(`${BASE_URL}/horarios/${cen}/${prof}/${cons}/${uf}/${dia}`);
  return (data || []).map(item => ({
    HDI_CODIGO: item.hdiCodigo,
    AGD_CODIGO: item.agdCodigo,
    HAG_ORDEM_CHEGADA: item.hagOrdemChegada,
    HAG_DIA: item.hagDia,
    HORARIO: item.horario
  }));
}

export async function getAgendasLivres(dia, agd, hdi, semanas = 4) {
  const data = await fetchAndUnwrap(`${BASE_URL}/agendaslivres/${dia}/${agd}/${hdi}/${semanas}`);
  return (data || []).map(item => ({
    Data: item.data,
    Dia: item.dia,
    Marcados: item.marcados,
    Capacidade: item.capacidade,
    Livres: item.livres
  }));
}

export async function agendar(dadosAgendamento) {
  const data = await fetchAndUnwrap(`${BASE_URL}/agendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dadosAgendamento),
  });
  // Map [1] to [{ OK: 1 }]
  if (Array.isArray(data) && data[0] === 1) {
    return [{ OK: 1 }];
  }
  return data;
}

export async function getPaciente(telefone) {
  return fetchAndUnwrap(`${BASE_URL}/paciente/${telefone}`);
}

export async function getHistorico(telefone) {
  return fetchAndUnwrap(`${BASE_URL}/historico/${telefone}`);
}

export async function cancelarAgendamento(dadosCancelamento) {
  const data = await fetchAndUnwrap(`${BASE_URL}/cancelar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dadosCancelamento),
  });
  if (Array.isArray(data) && data[0] === 1) {
    return [{ OK: 1 }];
  }
  return data;
}

export async function reagendarAgendamento(dadosReagendamento) {
  const data = await fetchAndUnwrap(`${BASE_URL}/reagendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dadosReagendamento),
  });
  if (Array.isArray(data) && data[0] === 1) {
    return [{ OK: 1 }];
  }
  return data;
}

