'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import styles from './MedicosDirectory.module.css';

export default function MedicosDirectory({ profissionais }) {
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.toLowerCase();
  const filtrados = profissionais.filter(
    (p) => p.nome.toLowerCase().includes(query) || p.especialidade.toLowerCase().includes(query)
  );

  return (
    <div>
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar por nome ou especialidade..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {filtrados.map((prof) => (
          <Link key={prof.slug} href={`/medicos/${prof.slug}`} className={styles.card}>
            <div className={styles.avatar}>{(prof.apelido || prof.nome).charAt(0)}</div>
            <div className={styles.info}>
              <span className={styles.nome}>{prof.apelido || prof.nome}</span>
              <span className={styles.especialidade}>{prof.especialidade}</span>
            </div>
            <ChevronRight className={styles.arrow} size={18} />
          </Link>
        ))}
      </div>

      {filtrados.length === 0 && <p className={styles.noResults}>Nenhum profissional encontrado.</p>}
    </div>
  );
}
