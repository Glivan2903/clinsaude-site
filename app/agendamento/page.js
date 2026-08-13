import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BookingWizard from "../../components/BookingWizard";
import { FEATURE_AGENDAMENTO } from "../../lib/featureFlags";
import { getUnidadesFooterProps } from "../../lib/unidades";

export const metadata = {
  title: "Agendar Consulta - Clínica ClinSaúde",
  description: "Marque sua consulta ou exame na Clínica ClinSaúde de forma fácil, rápida e online.",
};

export default function Agendamento() {
  if (!FEATURE_AGENDAMENTO) notFound();

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      
      <section className="pageSection container">
        <div className="contentCard" style={{ maxWidth: "1200px", background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
          <span className="eyebrow text-center" style={{ display: "block" }}>Agendamento online</span>
          <h2 className="text-center responsiveTitle">
            Agende sua consulta ou exame
          </h2>
          <BookingWizard />
        </div>
      </section>

      <Footer {...getUnidadesFooterProps()} />
    </main>
  );
}
