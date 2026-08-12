'use client';

import { useState } from 'react';
import styles from './AdminProfissionaisList.module.css';
import { UNIDADES_INFO } from '../lib/unidadesInfo';

function nomeUnidade(unidadeId) {
  return UNIDADES_INFO.find((u) => u.id === unidadeId)?.nome || unidadeId;
}

export default function AdminProfissionaisList({ profissionais, statusInicial, aliasInicial }) {
  const [status, setStatus] = useState(statusInicial);
  const [alias, setAlias] = useState(aliasInicial || {});
  const [aliasInput, setAliasInput] = useState(() =>
    Object.fromEntries(profissionais.map((p) => [p.slug, (aliasInicial || {})[p.slug] || '']))
  );
  const [aliasError, setAliasError] = useState({});
  const [savingAlias, setSavingAlias] = useState(null);
  const [loadingSlug, setLoadingSlug] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);

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

  async function salvarAlias(slug) {
    setSavingAlias(slug);
    setAliasError((prev) => ({ ...prev, [slug]: null }));
    try {
      const res = await fetch(`/api/admin/profissionais/${encodeURIComponent(slug)}/alias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: aliasInput[slug] }),
      });
      const data = await res.json();
      if (data.success) {
        setAlias((prev) => ({ ...prev, [slug]: data.alias }));
        setAliasInput((prev) => ({ ...prev, [slug]: data.alias || '' }));
      } else {
        setAliasError((prev) => ({ ...prev, [slug]: data.error || 'Não foi possível salvar.' }));
      }
    } catch {
      setAliasError((prev) => ({ ...prev, [slug]: 'Falha ao salvar. Tente novamente.' }));
    } finally {
      setSavingAlias(null);
    }
  }

  async function copiarLink(slug) {
    const url = `${window.location.origin}/medicos/${alias[slug] || slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug((prev) => (prev === slug ? null : prev)), 2000);
  }

  return (
    <div className={styles.list}>
      {profissionais.map((prof) => {
        const ativo = Boolean(status[prof.slug]);
        const aliasAtual = alias[prof.slug];
        const inputSujo = (aliasInput[prof.slug] || '') !== (aliasAtual || '');
        return (
          <div key={prof.slug} className={styles.row}>
            <div className={styles.rowTop}>
              <div className={styles.info}>
                <span className={styles.nome}>
                  {prof.apelido || prof.nome}
                  <span className={styles.unidadeTag}> · {nomeUnidade(prof.unidade)}</span>
                </span>
                <div className={styles.especialidadesList}>
                  {prof.especialidades.map((e) => (
                    <span key={e.cenCodigo} className={styles.especialidadeTag}>
                      {e.especialidade}
                    </span>
                  ))}
                </div>
                <span className={styles.slug}>/medicos/{prof.slug}</span>
              </div>
              <div className={styles.acoes}>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => copiarLink(prof.slug)}
                >
                  {copiedSlug === prof.slug ? 'Copiado!' : 'Copiar link'}
                </button>
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
            </div>

            <div className={styles.aliasRow}>
              <label className={styles.aliasLabel} htmlFor={`alias-${prof.slug}`}>
                Link personalizado
              </label>
              <div className={styles.aliasInputGroup}>
                <span className={styles.aliasPrefix}>/medicos/</span>
                <input
                  id={`alias-${prof.slug}`}
                  type="text"
                  className={styles.aliasInput}
                  placeholder="ex: dr-hamilcar"
                  value={aliasInput[prof.slug] || ''}
                  onChange={(e) =>
                    setAliasInput((prev) => ({ ...prev, [prof.slug]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className={styles.aliasSaveButton}
                  onClick={() => salvarAlias(prof.slug)}
                  disabled={savingAlias === prof.slug || !inputSujo}
                >
                  {savingAlias === prof.slug ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              {aliasError[prof.slug] && <p className={styles.aliasError}>{aliasError[prof.slug]}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
