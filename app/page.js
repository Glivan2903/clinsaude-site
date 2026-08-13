import styles from "./page.module.css";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import SpecialtiesSection from "../components/SpecialtiesSection";
import Footer from "../components/Footer";
import CTASection from "../components/CTASection";
import { getUnidadesFooterProps } from "../lib/unidades";

export default function Home() {
  const unidadesProps = getUnidadesFooterProps();

  return (
    <main className={styles.main}>
      <Header />
      <HeroSection />
      <CTASection />
      <AboutSection {...unidadesProps} />
      <SpecialtiesSection />
      <Footer {...unidadesProps} />
    </main>
  );
}
