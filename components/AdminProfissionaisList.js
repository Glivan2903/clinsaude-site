'use client';

import { useState } from 'react';
import styles from './AdminProfissionaisList.module.css';

export default function AdminProfissionaisList({ profissionais, statusInicial }) {
  const [status, setStatus] = useState(statusInicial);
  const [loadingSlug, setLoadingSlug] = useState(null);

  async function toggle(slug) {
    setLoadingSlug(slug);
    try {
      const res = await fetch(`/api/admin/profissionais/${encodeURIComponent(slug)}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus((prev) => ({ ...prev, [slug]: data.ativo }));
      }
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <div className={styles.list}>
      {profissionais.map((prof) => {
        const ativo = Boolean(status[prof.slug]);
        return (
          <div key={prof.slug} className={styles.row}>
            <div className={styles.info}>
              <span className={styles.nome}>{prof.apelido || prof.nome}</span>
              <span className={styles.especialidade}>{prof.especialidade}</span>
              <span className={styles.slug}>/medicos/{prof.slug}</span>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${ativo ? styles.toggleAtivo : ''}`}
              onClick={() => toggle(prof.slug)}
              disabled={loadingSlug === prof.slug}
              aria-pressed={ativo}
              aria-label={ativo ? 'Desativar link' : 'Ativar link'}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
