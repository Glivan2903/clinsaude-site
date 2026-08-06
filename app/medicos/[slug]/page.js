import { notFound } from "next/navigation";
import ProfissionalBooking from "../../../components/ProfissionalBooking";
import EcgLine from "../../../components/EcgLine";
import { getProfissionalUnificadoPorSlugOuAlias } from "../../../lib/profissionais";
import { isProfissionalAtivo } from "../../../lib/profissionaisStatus";
import { CLINIC_PHONE_DISPLAY, CLINIC_WHATSAPP_URL } from "../../../lib/config";
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
  const { slug } = await params;
  const profissional = await getProfissionalUnificadoPorSlugOuAlias(slug);

  if (!profissional) {
    notFound();
  }

  // Usa sempre o slug real do profissional para checar o status — o status
  // fica salvo por slug real, independente de qual alias trouxe o visitante.
  const ativo = await isProfissionalAtivo(profissional.slug);
  if (!ativo) {
    return (
      <main className={styles.inativoWrapper}>
        <div className={styles.inativoCard}>
          <p className={styles.inativoTitulo}>Este link não está disponível</p>
          <p className={styles.inativoTexto}>
            A página de agendamento deste profissional está desativada no
            momento. Fale com a clínica para agendar sua consulta.
          </p>
          <a
            href={CLINIC_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ marginTop: '1.5rem' }}
          >
            Falar no WhatsApp
          </a>
          <p className={styles.brandFooter} style={{ marginTop: '1.5rem' }}>
            Clin+Saúde • {CLINIC_PHONE_DISPLAY}
          </p>
        </div>
      </main>
    );
  }

  const nomeExibicao = profissional.apelido || profissional.nome;
  const servicos = profissional.especialidades.map((e) => e.especialidade).join(' · ');

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
            <div className={styles.ecg}>
              <EcgLine variant="divider" />
            </div>
          </header>

          <ProfissionalBooking
            nome={profissional.nome}
            consCodigo={profissional.consCodigo}
            profCodigo={profissional.profCodigo}
            profEstadoCons={profissional.profEstadoCons}
            especialidades={profissional.especialidades}
            especialidadeSugeridaCenCodigo={profissional.especialidadeSugerida}
          />
        </div>
      </section>

      <p className={styles.brandFooter}>Clin+Saúde • {CLINIC_PHONE_DISPLAY}</p>
    </main>
  );
}
