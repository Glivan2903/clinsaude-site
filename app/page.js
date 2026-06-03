import styles from "./page.module.css";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import SpecialtiesSection from "../components/SpecialtiesSection";
import Footer from "../components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <main className={styles.main}>
      <Header />
      <HeroSection />
      
      <section id="agendamento" className="section container" style={{ marginTop: '-4rem', position: 'relative', zIndex: 10 }}>
        <div className="glass text-center" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>
            Agende sua Consulta ou Exame Online
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Marque seu atendimento de forma rápida e segura. Escolha o especialista, convênio e horário que melhor se adaptam à sua rotina.
          </p>
          <Link href="/agendamento" className="btn-primary">
            Agendar Agora
          </Link>
        </div>
      </section>

      <AboutSection />
      <SpecialtiesSection />
      <Footer />
    </main>
  );
}
