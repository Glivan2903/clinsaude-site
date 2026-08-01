import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import BookingWizard from "../../../components/BookingWizard";
import { getProfissionalPorSlug } from "../../../lib/profissionais";
import { isProfissionalAtivo } from "../../../lib/profissionaisStatus";
import { CLINIC_PHONE_DISPLAY } from "../../../lib/config";
import styles from "./page.module.css";

// O status ativo/inativo é controlado pelo /admin e pode mudar a qualquer
// momento, então esta página nunca pode ser servida a partir de um cache estático.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const profissional = await getProfissionalPorSlug(slug);
  if (!profissional) return {};

  const nomeExibicao = profissional.apelido || profissional.nome;
  return {
    title: `${nomeExibicao} - ${profissional.especialidade} | Clínica ClinSaúde`,
    description: `Agende uma consulta com ${nomeExibicao}, especialista em ${profissional.especialidade}, na Clínica ClinSaúde.`,
  };
}

export default async function MedicoPage({ params }) {
  const { slug } = await params;
  const profissional = await getProfissionalPorSlug(slug);

  if (!profissional) {
    notFound();
  }

  const ativo = await isProfissionalAtivo(slug);
  if (!ativo) {
    return (
      <main className={styles.inativoWrapper}>
        <div className="glass" style={{ maxWidth: '420px', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <p className={styles.inativoTitulo}>Este link ainda não está disponível</p>
          <p className={styles.inativoTexto}>
            Entre em contato com a Clin+Saúde para mais informações.
          </p>
          <p className={styles.brandFooter} style={{ marginTop: '1.5rem' }}>Clin+Saúde • {CLINIC_PHONE_DISPLAY}</p>
        </div>
      </main>
    );
  }

  const nomeExibicao = profissional.apelido || profissional.nome;
  const initialCentro = { CEN_CODIGO: profissional.cenCodigo, CEN_DESCRICAO: profissional.especialidade };
  const initialProfissional = {
    PROF_CODIGO: profissional.profCodigo,
    PROF_NOME: profissional.nome,
    PROF_ESTADO_CONS: profissional.profEstadoCons,
    CONS_CODIGO: profissional.consCodigo,
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <section className="pageSection container" style={{ margin: "0.5rem auto 1rem" }}>
        <div className="glass contentCard" style={{ maxWidth: "720px", padding: "1.25rem" }}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              <UserRound size={30} strokeWidth={1.75} />
            </div>
            <h1 className={styles.nome}>{nomeExibicao}</h1>
            <p className={styles.especialidade}>{profissional.especialidade}</p>
            <p className={styles.crm}>
              {profissional.consCodigo} {profissional.profCodigo}/{profissional.profEstadoCons}
            </p>
          </div>

          <h2 className={styles.sectionTitle}>Agendar Consulta</h2>
          <BookingWizard initialCentro={initialCentro} initialProfissional={initialProfissional} />
        </div>
      </section>

      <p className={styles.brandFooter}>Clin+Saúde • {CLINIC_PHONE_DISPLAY}</p>
    </main>
  );
}
