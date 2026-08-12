// Extraído de lib/conteudoInstitucional.js para poder ser importado também
// por componentes cliente (ex.: AdminInstagramList) sem arrastar os imports
// server-only desse módulo (getProfissionaisUnificados etc.).
export const TIPOS_INSTITUCIONAIS = [
  { valor: 'profissional_destaque', rotulo: 'Profissional em destaque' },
  { valor: 'especialidade_destaque', rotulo: 'Especialidade em destaque' },
  { valor: 'agenda_aberta', rotulo: 'Agenda aberta' },
  { valor: 'horario_atendimento', rotulo: 'Horários de atendimento' },
  { valor: 'sobre_a_clinica', rotulo: 'Sobre a clínica' },
];
