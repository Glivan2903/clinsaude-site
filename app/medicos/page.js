import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MedicosDirectory from "../../components/MedicosDirectory";
import { getProfissionaisUnificados } from "../../lib/profissionais";
import { getStatusParaSlugs } from "../../lib/profissionaisStatus";
import { FEATURE_PROFISSIONAIS } from "../../lib/featureFlags";

// O diretório lista todos os profissionais, mas quem está com o link
// desativado (ver /admin) recebe um indicativo visual e não é levado à
// agenda ao clicar — esse status pode mudar a qualquer momento, por isso a
// página não pode ser estática.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Nossos Profissionais - Clínica ClinSaúde",
  description: "Conheça os médicos e profissionais da Clínica ClinSaúde e agende sua consulta diretamente com o especialista.",
};

export default async function Medicos() {
  if (!FEATURE_PROFISSIONAIS) notFound();

  const profissionais = await getProfissionaisUnificados();
  const statusPorSlug = await getStatusParaSlugs(profissionais.map((p) => p.slug));

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <section className="pageSection container">
        <span className="eyebrow" style={{ marginBottom: "0.75rem" }}>Nossa equipe</span>
        <h1 className="responsiveTitle" style={{ marginBottom: "1.5rem" }}>Profissionais da Clin+Saúde</h1>
        <MedicosDirectory profissionais={profissionais} statusPorSlug={statusPorSlug} />
      </section>

      <Footer />
    </main>
  );
}
