'use client';

import { useRef } from 'react';
import Link from 'next/link';
import styles from './CTASection.module.css';
import { gsap, useGSAP } from '../lib/gsap';
import { CLINIC_WHATSAPP_URL } from '../lib/config';
import { FEATURE_AGENDAMENTO } from '../lib/featureFlags';

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
        {FEATURE_AGENDAMENTO ? (
          <>
            <div>
              <h2 className={styles.title}>Agende sua consulta ou exame online</h2>
              <p className={styles.text}>
                Escolha o especialista, o convênio e o horário que se encaixam
                na sua rotina. Leva menos de dois minutos.
              </p>
            </div>
            <Link href="/agendamento" className={`btn-primary ${styles.cta}`}>
              Agendar consulta
            </Link>
          </>
        ) : (
          <>
            <div>
              <h2 className={styles.title}>Fale com a nossa equipe</h2>
              <p className={styles.text}>
                No momento não aceitamos agendamento pelo site. Fale com a
                clínica pelo WhatsApp para marcar sua consulta ou exame.
              </p>
            </div>
            <a
              href={CLINIC_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-primary ${styles.cta}`}
            >
              Falar no WhatsApp
            </a>
          </>
        )}
      </div>
    </section>
  );
}
