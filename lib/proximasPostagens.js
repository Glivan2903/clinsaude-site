import { temasDoDia } from './calendarioConteudo';
import { existePost } from './blog';
import { existeRascunho } from './instagram';
import { slugify } from './slugify';
import { hojeSaoPaulo } from './dataHoje';

// Lista as próximas datas comemorativas/de saúde (calendário + institucional
// móvel) a partir de hoje, com o status de blog/Instagram para cada tema —
// usa o mesmo slug (`${slugify(tema)}-${ano}`) gerado pelos crons, então o
// status reflete exatamente se aquele post já foi gerado ou não.
export async function listarProximasPostagens(diasParaFrente = 120) {
  const hoje = hojeSaoPaulo();
  const base = new Date(Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia));

  const dias = [];
  for (let i = 0; i < diasParaFrente; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    const ano = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();
    const temas = temasDoDia({ ano, mes, dia });
    if (temas.length === 0) continue;
    dias.push({ ano, mes, dia, timestamp: d.getTime(), temas });
  }

  return Promise.all(
    dias.map(async ({ ano, mes, dia, timestamp, temas }) => {
      const temasComStatus = await Promise.all(
        temas.map(async ({ tema }) => {
          const slug = `${slugify(tema)}-${ano}`;
          const [blogExiste, instagramExiste] = await Promise.all([
            existePost(slug),
            existeRascunho(slug),
          ]);
          return { tema, slug, blogExiste, instagramExiste };
        })
      );

      return {
        timestamp,
        data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`,
        temas: temasComStatus,
      };
    })
  );
}
