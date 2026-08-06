'use client';

import { useRef } from 'react';
import styles from './SpecialtiesSection.module.css';
import { Heart, Brain, Baby, Activity, Eye, Stethoscope, Bone, Microscope } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';

const specialties = [
  { id: 1, name: 'Clínica Geral', desc: 'Consultas de rotina e acompanhamento contínuo.', icon: Stethoscope },
  { id: 2, name: 'Cardiologia', desc: 'Avaliação e cuidado da saúde do coração.', icon: Heart },
  { id: 3, name: 'Pediatria', desc: 'Atendimento dedicado a crianças e adolescentes.', icon: Baby },
  { id: 4, name: 'Psiquiatria & Psicologia', desc: 'Cuidado com a saúde mental e emocional.', icon: Brain },
  { id: 5, name: 'Exames de Imagem', desc: 'Ultrassonografia e diagnóstico por imagem.', icon: Activity },
  { id: 6, name: 'Dermatologia', desc: 'Saúde da pele, cabelos e unhas.', icon: Eye },
  { id: 7, name: 'Ortopedia', desc: 'Ossos, músculos e articulações.', icon: Bone },
  { id: 8, name: 'Exames Laboratoriais', desc: 'Coleta e análises clínicas no local.', icon: Microscope },
];

export default function SpecialtiesSection() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.sectionHeader}`, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
        });

        gsap.set(`.${styles.card}`, { opacity: 0, y: 24 });
        ScrollTrigger.batch(`.${styles.card}`, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }),
        });
      });
    },
    { scope: rootRef }
  );

  // Hover "lift": elevação sutil via GSAP (§5.4 padrão 3).
  const lift = (e, up) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.to(e.currentTarget, { y: up ? -3 : 0, duration: 0.25 });
  };

  return (
    <section id="especialidades" ref={rootRef} className={`section ${styles.sectionBg}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className="eyebrow">Especialidades</span>
          <h2 className={styles.sectionTitle}>O que cuidamos aqui</h2>
          <p className={styles.sectionSubtitle}>
            Serviços médicos e exames para atender você e sua família em um só
            lugar.
          </p>
        </div>

        <div className={styles.grid}>
          {specialties.map((spec) => (
            <div
              key={spec.id}
              className={styles.card}
              onMouseEnter={(e) => lift(e, true)}
              onMouseLeave={(e) => lift(e, false)}
            >
              <div className={styles.iconWrapper}>
                <spec.icon size={20} />
              </div>
              <h3 className={styles.cardTitle}>{spec.name}</h3>
              <p className={styles.cardDesc}>{spec.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
