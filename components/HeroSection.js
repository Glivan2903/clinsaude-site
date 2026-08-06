'use client';

import { useRef } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';
import EcgLine from './EcgLine';
import { gsap, useGSAP } from '../lib/gsap';
import { CLINIC_WHATSAPP_URL } from '../lib/config';

export default function HeroSection() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Única animação de load do site (§5.4 padrão 2). Total ≤ 1.6s.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline();
        tl.from(`.${styles.eyebrowReveal}`, { opacity: 0, y: 14, duration: 0.45 })
          .from(
            `.${styles.titleLine} > span`,
            { yPercent: 110, duration: 0.7, stagger: 0.12, ease: 'power3.out' },
            '-=0.2'
          )
          .from(`.${styles.subtitle}`, { opacity: 0, y: 18, duration: 0.5 }, '-=0.35')
          .from(`.${styles.actions}`, { opacity: 0, y: 14, duration: 0.45 }, '-=0.3')
          .fromTo(
            `.${styles.photoWrap}`,
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' },
            0.35
          );
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} className={styles.hero}>
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          <span className={`eyebrow ${styles.eyebrowReveal}`}>
            Clin+Saúde · Aracaju — desde 2015
          </span>

          <h1 className={styles.title}>
            <span className={styles.titleLine}>
              <span>Sua saúde em</span>
            </span>
            <span className={styles.titleLine}>
              <span>boas mãos.</span>
            </span>
          </h1>

          <p className={styles.subtitle}>
            Atendimento humanizado, diversas especialidades e exames
            especializados em Aracaju. Agende sua consulta sem sair de casa.
          </p>

          <div className={styles.actions}>
            <Link href="/agendamento" className="btn-primary">
              Agendar consulta
            </Link>
            <a
              href={CLINIC_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>

        <div className={styles.photoWrap}>
          <img
            src="/hero-bg1.jpg"
            alt="Recepção da Clínica Clin+Saúde"
            className={styles.photo}
          />
        </div>
      </div>

      <div className={styles.ecgWrap} aria-hidden="true">
        <EcgLine variant="hero" delay={1.0} />
      </div>
    </section>
  );
}
