'use client';
import { motion } from 'motion/react';
import styles from './SpecialtiesSection.module.css';
import { Heart, Brain, Baby, Activity, Eye, Stethoscope, Bone, Microscope } from 'lucide-react';
import TiltCard from './TiltCard';

const specialties = [
  { id: 1, name: 'Clínica Geral', icon: Stethoscope },
  { id: 2, name: 'Cardiologia', icon: Heart },
  { id: 3, name: 'Pediatria', icon: Baby },
  { id: 4, name: 'Psiquiatria & Psicologia', icon: Brain },
  { id: 5, name: 'Exames de Imagem', icon: Activity },
  { id: 6, name: 'Dermatologia', icon: Eye },
  { id: 7, name: 'Ortopedia', icon: Bone },
  { id: 8, name: 'Exames Laboratoriais', icon: Microscope },
];

const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function SpecialtiesSection() {
  return (
    <section id="especialidades" className={`section ${styles.sectionBg}`}>
      <div className="container">
        <motion.div
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className={styles.sectionTitle}>
            Nossas <span className="gradient-text">Especialidades</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Ampla variedade de serviços médicos e exames para atender você e sua família com qualidade.
          </p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {specialties.map((spec) => (
            <motion.div key={spec.id} variants={cardVariant}>
              <TiltCard className={styles.card}>
                <div className={styles.iconWrapper}>
                  <spec.icon size={28} />
                </div>
                <h3 className={styles.cardTitle}>{spec.name}</h3>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
