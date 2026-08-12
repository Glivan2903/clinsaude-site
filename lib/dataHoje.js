// Data de "hoje" no fuso de Brasília — usado pelos crons de conteúdo
// (blog e Instagram) para saber que data comemorativa comparar, já que o
// servidor roda em UTC.
export function hojeSaoPaulo() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  const ano = Number(mapa.year);
  const mes = Number(mapa.month);
  const dia = Number(mapa.day);
  return { ano, mes, dia, mesDia: `${mapa.month}-${mapa.day}` };
}
