import styles from './HeroSection.module.css';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBackground}></div>
      <div className={`container ${styles.heroContent}`}>
        <div className={styles.heroText}>
          <div className={styles.badge}>Clin+Saúde</div>
          <h1 className={styles.title}>
            Sua Saúde em <br />
            <span className="gradient-text">Boas Mãos</span>
          </h1>
          <p className={styles.subtitle}>
            Cuidando da sua saúde com excelência e profissionalismo desde 2015. Atendimento de qualidade e exames especializados em Aracaju.
          </p>
          <div className={styles.actions}>
            <Link href="/agendamento" className="btn-primary">
              Agende Agora
            </Link>
            <Link href="#sobre" className="btn-secondary" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '2px solid var(--border-color)', boxShadow: 'none' }}>
              Conheça a Clínica
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
