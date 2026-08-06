'use client';

import { useRef } from 'react';
import Link from 'next/link';
import styles from './CTASection.module.css';
import { gsap, useGSAP } from '../lib/gsap';

export default function CTASection() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.inner}`, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <section id="agendamento" ref={rootRef} className={styles.band}>
      <div className={`container ${styles.inner}`}>
        <div>
          <h2 className={styles.title}>Agende sua consulta ou exame online</h2>
          <p className={styles.text}>
            Escolha o especialista, o convênio e o horário que se encaixam na
            sua rotina. Leva menos de dois minutos.
          </p>
        </div>
        <Link href="/agendamento" className={`btn-primary ${styles.cta}`}>
          Agendar consulta
        </Link>
      </div>
    </section>
  );
}
