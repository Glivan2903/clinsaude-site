'use client';
import { motion } from 'motion/react';
import styles from './AboutSection.module.css';
import { MapPin, Clock } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

const infoStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};

const statsStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function AboutSection() {
  return (
    <section id="sobre" className="section container">
      <div className={styles.grid}>
        {/* Left: stats card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            className={styles.statsCard}
            variants={statsStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <motion.div variants={fadeUp} className={styles.statItem}>
              <span className={styles.statValue}>
                <AnimatedNumber value={10} suffix="+" />
              </span>
              <span className={styles.statDesc}>Anos de excelência</span>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.statItem}>
              <span className={styles.statValue}>
                <AnimatedNumber value={2} />
              </span>
              <span className={styles.statDesc}>Unidades em Aracaju</span>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.statItem}>
              <span className={styles.statValue}>
                <AnimatedNumber value={6} suffix="+" />
              </span>
              <span className={styles.statDesc}>Especialidades médicas</span>
            </motion.div>
            <motion.div variants={fadeUp} className={styles.statItem}>
              <span className={styles.statValue}>Seg–Sáb</span>
              <span className={styles.statDesc}>Horário de atendimento</span>
            </motion.div>
            <div className={styles.statsCardBadge}>
              <p className={styles.statsCardBadgeText}>
                Cuidando da saúde das famílias de Aracaju <strong>desde 2015</strong>
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: content */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        >
          <h2 className={styles.title}>
            Tradição e Cuidado em <span className="gradient-text">Aracaju</span>
          </h2>
          <p className={styles.description}>
            A Clin+Saúde nasceu com o propósito de oferecer medicina de qualidade com atendimento humanizado. Cuidando da sua saúde com excelência e profissionalismo desde 2015.
          </p>

          <motion.div
            className={styles.infoList}
            variants={infoStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeUp} className={styles.infoItem}>
              <motion.div
                className={styles.iconWrapper}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.18 }}
              >
                <MapPin size={22} />
              </motion.div>
              <div>
                <h4 className={styles.infoTitle}>Unidade Matriz</h4>
                <p className={styles.infoText}>
                  Rua Bahia, 998 — Siqueira Campos, Aracaju – SE<br />
                  <strong>(79) 99989-6288</strong>
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className={styles.infoItem}>
              <motion.div
                className={styles.iconWrapper}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.18 }}
              >
                <MapPin size={22} />
              </motion.div>
              <div>
                <h4 className={styles.infoTitle}>Unidade Filial</h4>
                <p className={styles.infoText}>
                  Rua Bahia, 928 — Siqueira Campos, Aracaju – SE<br />
                  <strong>(79) 99989-6288</strong>
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className={styles.infoItem}>
              <motion.div
                className={styles.iconWrapper}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.18 }}
              >
                <Clock size={22} />
              </motion.div>
              <div>
                <h4 className={styles.infoTitle}>Horário de Funcionamento</h4>
                <p className={styles.infoText}>
                  Segunda a Sexta: 06h às 16h<br />
                  Sábado: 06h às 12h<br />
                  Domingo e Feriados: Fechado
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
