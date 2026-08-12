'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import styles from '../app/admin/calendario/calendario.module.css';

export default function AdminCalendarioLista({ proximasPostagens }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.diaCard}`, { opacity: 0, y: 16, stagger: 0.06, duration: 0.5 });
      });
    },
    { scope: rootRef, dependencies: [proximasPostagens] }
  );

  if (proximasPostagens.length === 0) {
    return <p>Nenhuma data comemorativa nos próximos meses.</p>;
  }

  return (
    <div ref={rootRef} className={styles.lista}>
      {proximasPostagens.map((dia) => (
        <div key={dia.timestamp} className={styles.diaCard}>
          <span className={styles.data}>{dia.data}</span>
          <ul className={styles.temasList}>
            {dia.temas.map((t) => (
              <li key={t.slug} className={styles.temaItem}>
                <span className={styles.temaTexto}>{t.tema}</span>
                <span className={styles.badges}>
                  <span className={`${styles.badge} ${t.blogExiste ? styles.badgeOk : ''}`}>
                    Blog{t.blogExiste ? ' ✓' : ''}
                  </span>
                  <span className={`${styles.badge} ${t.instagramExiste ? styles.badgeOk : ''}`}>
                    Instagram{t.instagramExiste ? ' ✓' : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
