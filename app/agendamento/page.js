import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BookingWizard from "../../components/BookingWizard";

export const metadata = {
  title: "Agendar Consulta - Clínica ClinSaúde",
  description: "Marque sua consulta ou exame na Clínica ClinSaúde de forma fácil, rápida e online.",
};

export default function Agendamento() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      
      <section className="pageSection container">
        <div className="glass contentCard" style={{ maxWidth: "1200px" }}>
          <h2 className="text-center responsiveTitle">
            Agende sua Consulta ou Exame
          </h2>
          <BookingWizard />
        </div>
      </section>

      <Footer />
    </main>
  );
}
