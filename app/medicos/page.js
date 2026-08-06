import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MedicosDirectory from "../../components/MedicosDirectory";
import { getProfissionaisUnificados } from "../../lib/profissionais";
import { getStatusParaSlugs } from "../../lib/profissionaisStatus";

// O diretório só deve listar quem está com o link ativo (ver /admin), e esse
// status pode mudar a qualquer momento — por isso a página não pode ser estática.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Nossos Profissionais - Clínica ClinSaúde",
  description: "Conheça os médicos e profissionais da Clínica ClinSaúde e agende sua consulta diretamente com o especialista.",
};

export default async function Medicos() {
  const todos = await getProfissionaisUnificados();
  const status = await getStatusParaSlugs(todos.map((p) => p.slug));
  const profissionais = todos.filter((p) => status[p.slug]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <section className="pageSection container">
        <span className="eyebrow" style={{ marginBottom: "0.75rem" }}>Nossa equipe</span>
        <h1 className="responsiveTitle" style={{ marginBottom: "1.5rem" }}>Profissionais da Clin+Saúde</h1>
        <MedicosDirectory profissionais={profissionais} />
      </section>

      <Footer />
    </main>
  );
}
