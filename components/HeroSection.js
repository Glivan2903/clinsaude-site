'use client';
import { motion } from 'motion/react';
import styles from './HeroSection.module.css';
import Link from 'next/link';
import AnimatedNumber from './AnimatedNumber';

const textGroup = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const statsGroup = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
};

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBackground} />
      <div className={`container ${styles.heroContent}`}>
        <div className={styles.heroText}>
          <motion.div variants={textGroup} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} className={styles.badge}>
              <span className={styles.badgeDot} />
              Clin+Saúde — Aracaju, SE
            </motion.div>

            <motion.h1 variants={fadeUp} className={styles.title}>
              Sua Saúde em <br />
              <span className="gradient-text">Boas Mãos</span>
            </motion.h1>

            <motion.p variants={fadeUp} className={styles.subtitle}>
              Cuidando da sua saúde com excelência e profissionalismo desde 2015.
              Atendimento humanizado e exames especializados em Aracaju.
            </motion.p>

            <motion.div variants={fadeUp} className={styles.actions}>
              <Link href="/agendamento" className="btn-primary">
                Agendar Consulta
              </Link>
              <Link href="#sobre" className="btn-secondary">
                Conheça a Clínica
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.statsRow}
            variants={statsGroup}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className={styles.stat}>
              <span className={styles.statNumber}>
                <AnimatedNumber value={10} suffix="+" />
              </span>
              <span className={styles.statLabel}>Anos de cuidado</span>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.stat}>
              <span className={styles.statNumber}>
                <AnimatedNumber value={2} />
              </span>
              <span className={styles.statLabel}>Unidades</span>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.stat}>
              <span className={styles.statNumber}>
                <AnimatedNumber value={6} suffix="+" />
              </span>
              <span className={styles.statLabel}>Especialidades</span>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.stat}>
              <span className={styles.statNumber}>Seg–Sáb</span>
              <span className={styles.statLabel}>Atendimento</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
