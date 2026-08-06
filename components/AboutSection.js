'use client';

import { useRef } from 'react';
import styles from './AboutSection.module.css';
import { MapPin, Clock } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import EcgLine from './EcgLine';
import { gsap, useGSAP } from '../lib/gsap';

const FACTS = [
  { value: 10, suffix: '+', label: 'Anos de atuação em Aracaju' },
  { value: 2, suffix: '', label: 'Unidades no bairro Siqueira Campos' },
  { value: 6, suffix: '+', label: 'Especialidades médicas e exames' },
];

export default function AboutSection() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.reveal}`, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.08,
          scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <section id="sobre" ref={rootRef} className="section container">
      <div className={styles.divider}>
        <EcgLine variant="divider" />
      </div>

      <div className={styles.grid}>
        <div className={styles.content}>
          <span className={`eyebrow ${styles.reveal}`}>Sobre a clínica</span>
          <h2 className={`${styles.title} ${styles.reveal}`}>
            Tradição e cuidado em Aracaju
          </h2>
          <p className={`${styles.description} ${styles.reveal}`}>
            A Clin+Saúde nasceu com o propósito de oferecer medicina de
            qualidade com atendimento humanizado. Cuidamos da saúde das
            famílias de Aracaju com excelência e profissionalismo desde 2015.
          </p>

          <div className={styles.infoList}>
            <div className={`${styles.infoItem} ${styles.reveal}`}>
              <div className={styles.iconWrapper}>
                <MapPin size={20} />
              </div>
              <div>
                <h4 className={styles.infoTitle}>Unidade Matriz</h4>
                <p className={styles.infoText}>
                  Rua Bahia, 998 — Siqueira Campos, Aracaju – SE<br />
                  <strong>(79) 99989-6288</strong>
                </p>
              </div>
            </div>

            <div className={`${styles.infoItem} ${styles.reveal}`}>
              <div className={styles.iconWrapper}>
                <MapPin size={20} />
              </div>
              <div>
                <h4 className={styles.infoTitle}>Unidade Filial</h4>
                <p className={styles.infoText}>
                  Rua Bahia, 928 — Siqueira Campos, Aracaju – SE<br />
                  <strong>(79) 99989-6288</strong>
                </p>
              </div>
            </div>

            <div className={`${styles.infoItem} ${styles.reveal}`}>
              <div className={styles.iconWrapper}>
                <Clock size={20} />
              </div>
              <div>
                <h4 className={styles.infoTitle}>Horário de funcionamento</h4>
                <p className={styles.infoText}>
                  Segunda a sexta: 06h às 16h<br />
                  Sábado: 06h às 12h<br />
                  Domingo e feriados: fechado
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className={`${styles.factsCard} ${styles.reveal}`}>
          <span className="eyebrow">Clin+Saúde em números</span>
          <ul className={styles.factsList}>
            {FACTS.map((fact) => (
              <li key={fact.label} className={styles.factItem}>
                <span className={styles.factValue}>
                  <AnimatedNumber value={fact.value} suffix={fact.suffix} />
                </span>
                <span className={styles.factLabel}>{fact.label}</span>
              </li>
            ))}
            <li className={styles.factItem}>
              <span className={styles.factValue}>Seg–Sáb</span>
              <span className={styles.factLabel}>Dias de atendimento</span>
            </li>
          </ul>
          <p className={styles.factsFootnote}>
            Dados da própria clínica — atendimento desde 2015.
          </p>
        </aside>
      </div>
    </section>
  );
}
