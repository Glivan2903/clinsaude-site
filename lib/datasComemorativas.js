// Datas comemorativas gerais (não-clínicas) relevantes para o conteúdo social
// da clínica — além do calendário de saúde (lib/calendarioSaude.js). Foco em
// datas que combinam com um tom humanizado de clínica (família, cuidado,
// gentileza), não o calendário civil completo.
//
// Datas fixas: 'MM-DD'. Datas móveis (ex.: "2º domingo de maio") são
// resolvidas por ano em lib/calendarioConteudo.js.
export const DATAS_COMEMORATIVAS_FIXAS = [
  { data: '01-01', tema: 'Ano Novo' },
  { data: '03-08', tema: 'Dia Internacional da Mulher' },
  { data: '06-12', tema: 'Dia dos Namorados' },
  { data: '07-20', tema: 'Dia do Amigo' },
  { data: '10-01', tema: 'Dia Nacional do Idoso' },
  { data: '10-12', tema: 'Dia das Crianças' },
  { data: '12-25', tema: 'Natal' },
];

// diaSemana: 0 = domingo ... 6 = sábado. semana: 1ª, 2ª, 3ª... ocorrência do
// dia da semana no mês.
export const DATAS_COMEMORATIVAS_MOVEIS = [
  { mes: 5, semana: 2, diaSemana: 0, tema: 'Dia das Mães' },
  { mes: 8, semana: 2, diaSemana: 0, tema: 'Dia dos Pais' },
];
