import styles from "./page.module.css";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import SpecialtiesSection from "../components/SpecialtiesSection";
import Footer from "../components/Footer";
import CTASection from "../components/CTASection";

export default function Home() {
  return (
    <main className={styles.main}>
      <Header />
      <HeroSection />
      <CTASection />
      <AboutSection />
      <SpecialtiesSection />
      <Footer />
    </main>
  );
}
