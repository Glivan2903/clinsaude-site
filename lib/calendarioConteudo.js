import { DATAS_SAUDE } from './calendarioSaude';
import { DATAS_COMEMORATIVAS_FIXAS, DATAS_COMEMORATIVAS_MOVEIS } from './datasComemorativas';

// Dia do mês em que cai a N-ésima ocorrência de um dia da semana (ex.: 2º
// domingo de maio) num determinado ano/mês.
function diaDaNEsimaOcorrencia(ano, mes, diaSemana, n) {
  const diaSemanaDoPrimeiro = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const offset = (diaSemana - diaSemanaDoPrimeiro + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

// Retorna todos os temas (saúde + comemorativos, fixos + móveis) que caem em
// {ano, mes, dia}. `mes`/`dia` em base 1 (mes: 1-12).
export function temasDoDia({ ano, mes, dia }) {
  const mesDia = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

  const fixos = [...DATAS_SAUDE, ...DATAS_COMEMORATIVAS_FIXAS]
    .filter((item) => item.data === mesDia)
    .map((item) => ({ tema: item.tema }));

  const moveis = DATAS_COMEMORATIVAS_MOVEIS
    .filter(
      (item) =>
        item.mes === mes &&
        diaDaNEsimaOcorrencia(ano, item.mes, item.diaSemana, item.semana) === dia
    )
    .map((item) => ({ tema: item.tema }));

  return [...fixos, ...moveis];
}
