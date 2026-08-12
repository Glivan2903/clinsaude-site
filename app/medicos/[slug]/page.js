import { notFound } from "next/navigation";
import ProfissionalBooking from "../../../components/ProfissionalBooking";
import EcgLine from "../../../components/EcgLine";
import { getProfissionalUnificadoPorSlugOuAlias } from "../../../lib/profissionais";
import { isProfissionalAtivo } from "../../../lib/profissionaisStatus";
import {
  CLINIC_PHONE_DISPLAY_MATRIZ,
  CLINIC_WHATSAPP_URL_MATRIZ,
  CLINIC_PHONE_DISPLAY_FILIAL,
  CLINIC_WHATSAPP_URL_FILIAL,
} from "../../../lib/config";
import { UNIDADES_INFO } from "../../../lib/unidadesInfo";
import { FEATURE_PROFISSIONAIS, FEATURE_AGENDAMENTO } from "../../../lib/featureFlags";
import styles from "./page.module.css";

// O status ativo/inativo é controlado pelo /admin e pode mudar a qualquer
// momento, então esta página nunca pode ser servida a partir de um cache estático.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const profissional = await getProfissionalUnificadoPorSlugOuAlias(slug);
  if (!profissional) return {};

  const nomeExibicao = profissional.apelido || profissional.nome;
  const servicos = profissional.especialidades.map((e) => e.especialidade).join(', ');
  return {
    title: `${nomeExibicao} - ${servicos} | Clínica ClinSaúde`,
    description: `Agende uma consulta com ${nomeExibicao} (${servicos}) na Clínica ClinSaúde.`,
  };
}

export default async function MedicoPage({ params }) {
  if (!FEATURE_PROFISSIONAIS) notFound();

  const { slug } = await params;
  const profissional = await getProfissionalUnificadoPorSlugOuAlias(slug);

  if (!profissional) {
    notFound();
  }

  // Usa sempre o slug real do profissional para checar o status — o status
  // fica salvo por slug real, independente de qual alias trouxe o visitante.
  const whatsappUnidade = profissional.unidade === 'filial'
    ? CLINIC_WHATSAPP_URL_FILIAL
    : CLINIC_WHATSAPP_URL_MATRIZ;
  const telefoneUnidade = profissional.unidade === 'filial'
    ? CLINIC_PHONE_DISPLAY_FILIAL
    : CLINIC_PHONE_DISPLAY_MATRIZ;

  const ativo = await isProfissionalAtivo(profissional.slug);
  if (!ativo || !FEATURE_AGENDAMENTO) {
    return (
      <main className={styles.inativoWrapper}>
        <div className={styles.inativoCard}>
          <p className={styles.inativoTitulo}>
            {ativo ? 'Agendamento online indisponível' : 'Este link não está disponível'}
          </p>
          <p className={styles.inativoTexto}>
            {ativo
              ? 'No momento não aceitamos agendamento pelo site. Fale com a clínica para agendar sua consulta.'
              : 'A página de agendamento deste profissional está desativada no momento. Fale com a clínica para agendar sua consulta.'}
          </p>
          <a
            href={whatsappUnidade}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ marginTop: '1.5rem' }}
          >
            Falar no WhatsApp
          </a>
          <p className={styles.brandFooter} style={{ marginTop: '1.5rem' }}>
            Clin+Saúde • {telefoneUnidade}
          </p>
        </div>
      </main>
    );
  }

  const nomeExibicao = profissional.apelido || profissional.nome;
  const servicos = profissional.especialidades.map((e) => e.especialidade).join(' · ');
  const nomeUnidade = UNIDADES_INFO.find((u) => u.id === profissional.unidade)?.nome || profissional.unidade;

  return (
    <main className={styles.page}>
      <section className={`container ${styles.wrapper}`}>
        <div className={styles.card}>
          {/* Cartão de consultório */}
          <header className={styles.profileHeader}>
            <span className="eyebrow">
              {servicos}
              {profissional.consCodigo &&
                ` · ${profissional.consCodigo} ${profissional.profCodigo}/${profissional.profEstadoCons}`}
            </span>
            <h1 className={styles.nome}>{nomeExibicao}</h1>
            <span className={styles.unidade}>Unidade {nomeUnidade}</span>
            <div className={styles.ecg}>
              <EcgLine variant="divider" />
            </div>
          </header>

          <ProfissionalBooking
            nome={profissional.nome}
            unidade={profissional.unidade}
            consCodigo={profissional.consCodigo}
            profCodigo={profissional.profCodigo}
            profEstadoCons={profissional.profEstadoCons}
            especialidades={profissional.especialidades}
            especialidadeSugeridaCenCodigo={profissional.especialidadeSugerida}
          />
        </div>
      </section>

      <p className={styles.brandFooter}>Clin+Saúde • {telefoneUnidade}</p>
    </main>
  );
}
