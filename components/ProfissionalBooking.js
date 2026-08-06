'use client';

import { useRef, useState } from 'react';
import BookingWizard from './BookingWizard';
import { gsap, useGSAP } from '../lib/gsap';
import styles from './ProfissionalBooking.module.css';

export default function ProfissionalBooking({
  nome,
  consCodigo,
  profCodigo,
  profEstadoCons,
  especialidades,
  especialidadeSugeridaCenCodigo,
}) {
  const inicial =
    especialidades.length === 1
      ? especialidades[0]
      : especialidades.find((e) => e.cenCodigo === especialidadeSugeridaCenCodigo) || null;
  const [selecionado, setSelecionado] = useState(inicial);
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(rootRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 });
      });
    },
    { dependencies: [selecionado] }
  );

  if (!selecionado) {
    return (
      <div ref={rootRef}>
        <h2 className={styles.title}>Selecione o atendimento</h2>
        <div className={styles.grid}>
          {especialidades.map((e) => (
            <button
              key={e.cenCodigo}
              type="button"
              className={styles.card}
              onClick={() => setSelecionado(e)}
            >
              {e.especialidade}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const initialCentro = { CEN_CODIGO: selecionado.cenCodigo, CEN_DESCRICAO: selecionado.especialidade };
  const initialProfissional = {
    PROF_CODIGO: profCodigo,
    PROF_NOME: nome,
    PROF_ESTADO_CONS: profEstadoCons,
    CONS_CODIGO: consCodigo,
  };

  return (
    <div ref={rootRef}>
      {especialidades.length > 1 && (
        <button type="button" className={styles.trocar} onClick={() => setSelecionado(null)}>
          ← Atendimento: {selecionado.especialidade} (trocar)
        </button>
      )}
      <h2 className={styles.title}>Agendar consulta</h2>
      <BookingWizard
        key={selecionado.cenCodigo}
        initialCentro={initialCentro}
        initialProfissional={initialProfissional}
      />
    </div>
  );
}
