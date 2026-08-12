import { getProfissionaisUnificados } from './profissionais';
import { getStatusParaSlugs } from './profissionaisStatus';
import { CLINIC_HORARIO_ATENDIMENTO } from './config';
import { TIPOS_INSTITUCIONAIS } from './tiposInstitucionais';

export { TIPOS_INSTITUCIONAIS };

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

async function profissionaisAtivos() {
  const todos = await getProfissionaisUnificados();
  const status = await getStatusParaSlugs(todos.map((p) => p.slug));
  return todos.filter((p) => status[p.slug]);
}

async function montarProfissionalDestaque() {
  const ativos = await profissionaisAtivos();
  if (ativos.length === 0) {
    throw new Error('Nenhum profissional com agenda ativa encontrado para destacar.');
  }
  const escolhido = sortear(ativos);
  const nome = escolhido.apelido || escolhido.nome;
  const especialidades = escolhido.especialidades.map((e) => e.especialidade).join(', ');

  return {
    tema: `Profissional em destaque: ${nome}`,
    contexto: `Apresente o(a) profissional ${nome}, da Clin+Saúde, especialista em ${especialidades}. Fale um pouco sobre a importância desse cuidado e convide o leitor a agendar uma consulta com ele(a).`,
  };
}

async function montarEspecialidadeDestaque() {
  const ativos = await profissionaisAtivos();
  const especialidades = [...new Set(ativos.flatMap((p) => p.especialidades.map((e) => e.especialidade)))];
  if (especialidades.length === 0) {
    throw new Error('Nenhuma especialidade ativa encontrada para destacar.');
  }
  const escolhida = sortear(especialidades);

  return {
    tema: `Especialidade em destaque: ${escolhida}`,
    contexto: `Explique de forma simples o que é o atendimento de "${escolhida}" e em que situações vale a pena procurar esse cuidado. Convide o leitor a agendar uma consulta dessa especialidade na Clin+Saúde.`,
  };
}

function montarAgendaAberta() {
  return {
    tema: 'Agenda aberta para consultas',
    contexto: 'Avise que a agenda da Clin+Saúde está aberta para novos agendamentos, nas unidades Matriz e Filial, em Aracaju/SE. Incentive o leitor a não deixar a consulta para depois e agendar pelo link da bio.',
  };
}

function montarHorarioAtendimento() {
  return {
    tema: 'Horários de atendimento',
    contexto: `Informe os horários de atendimento da Clin+Saúde: ${CLINIC_HORARIO_ATENDIMENTO}. Reforce que é fácil agendar pelo link da bio.`,
  };
}

function montarSobreAClinica() {
  return {
    tema: 'Sobre a Clin+Saúde',
    contexto: 'Fale sobre a Clin+Saúde: clínica médica multiespecialidade em Aracaju/SE, com atendimento humanizado desde 2015 e duas unidades (Matriz e Filial). Convide o leitor a conhecer a clínica e agendar uma consulta.',
  };
}

const MONTADORES = {
  profissional_destaque: montarProfissionalDestaque,
  especialidade_destaque: montarEspecialidadeDestaque,
  agenda_aberta: montarAgendaAberta,
  horario_atendimento: montarHorarioAtendimento,
  sobre_a_clinica: montarSobreAClinica,
};

export async function montarConteudoInstitucional(tipo) {
  const tipoResolvido = tipo === 'aleatorio' || !tipo
    ? sortear(TIPOS_INSTITUCIONAIS).valor
    : tipo;

  const montador = MONTADORES[tipoResolvido];
  if (!montador) throw new Error(`Tipo institucional desconhecido: "${tipoResolvido}".`);

  return montador();
}
