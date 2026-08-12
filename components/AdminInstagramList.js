'use client';

import { useRef, useState } from 'react';
import InstagramPostPreview from './InstagramPostPreview';
import { TIPOS_INSTITUCIONAIS } from '../lib/tiposInstitucionais';
import { gsap, useGSAP } from '../lib/gsap';
import styles from './AdminInstagramList.module.css';

function formatarData(timestamp) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminInstagramList({ rascunhosIniciais, imagemGeradaInicial }) {
  const rootRef = useRef(null);
  const [rascunhos, setRascunhos] = useState(rascunhosIniciais);
  const [legendaInput, setLegendaInput] = useState(() =>
    Object.fromEntries(rascunhosIniciais.map((r) => [r.slug, r.legenda]))
  );
  const [salvandoSlug, setSalvandoSlug] = useState(null);
  const [publicandoSlug, setPublicandoSlug] = useState(null);
  const [copiadoSlug, setCopiadoSlug] = useState(null);
  const [erroSlug, setErroSlug] = useState({});
  const [imagemGerada, setImagemGerada] = useState(imagemGeradaInicial || {});
  const [gerandoImagemSlug, setGerandoImagemSlug] = useState(null);
  const [erroImagemSlug, setErroImagemSlug] = useState({});
  const [cacheBuster, setCacheBuster] = useState({});
  const [provedorImagem, setProvedorImagem] = useState(() =>
    Object.fromEntries(rascunhosIniciais.map((r) => [r.slug, 'gemini']))
  );
  const [tipoInstitucional, setTipoInstitucional] = useState('aleatorio');
  const [gerandoInstitucional, setGerandoInstitucional] = useState(false);
  const [erroInstitucional, setErroInstitucional] = useState(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.card}`, { opacity: 0, y: 16, stagger: 0.06, duration: 0.5 });
      });
    },
    { scope: rootRef }
  );

  async function gerarInstitucional() {
    setGerandoInstitucional(true);
    setErroInstitucional(null);
    try {
      const res = await fetch('/api/admin/instagram/gerar-institucional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoInstitucional }),
      });
      const data = await res.json();
      if (data.success) {
        const novo = data.rascunho;
        setRascunhos((prev) => [novo, ...prev]);
        setLegendaInput((prev) => ({ ...prev, [novo.slug]: novo.legenda }));
        setProvedorImagem((prev) => ({ ...prev, [novo.slug]: 'gemini' }));
      } else {
        setErroInstitucional(data.error || 'Não foi possível gerar o conteúdo.');
      }
    } catch {
      setErroInstitucional('Falha ao gerar conteúdo. Tente novamente.');
    } finally {
      setGerandoInstitucional(false);
    }
  }

  async function gerarImagem(slug) {
    setGerandoImagemSlug(slug);
    setErroImagemSlug((prev) => ({ ...prev, [slug]: null }));
    try {
      const res = await fetch(`/api/admin/instagram/${encodeURIComponent(slug)}/imagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provedor: provedorImagem[slug] || 'gemini' }),
      });
      const data = await res.json();
      if (data.success) {
        setImagemGerada((prev) => ({ ...prev, [slug]: true }));
        setCacheBuster((prev) => ({ ...prev, [slug]: data.geradoEm }));
      } else {
        setErroImagemSlug((prev) => ({ ...prev, [slug]: data.error || 'Não foi possível gerar a imagem.' }));
      }
    } catch {
      setErroImagemSlug((prev) => ({ ...prev, [slug]: 'Falha ao gerar imagem. Tente novamente.' }));
    } finally {
      setGerandoImagemSlug(null);
    }
  }

  async function salvarLegenda(slug) {
    setSalvandoSlug(slug);
    setErroSlug((prev) => ({ ...prev, [slug]: null }));
    try {
      const res = await fetch(`/api/admin/instagram/${encodeURIComponent(slug)}/legenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legenda: legendaInput[slug] }),
      });
      const data = await res.json();
      if (data.success) {
        setRascunhos((prev) => prev.map((r) => (r.slug === slug ? { ...r, legenda: data.legenda } : r)));
      } else {
        setErroSlug((prev) => ({ ...prev, [slug]: data.error || 'Não foi possível salvar.' }));
      }
    } catch {
      setErroSlug((prev) => ({ ...prev, [slug]: 'Falha ao salvar. Tente novamente.' }));
    } finally {
      setSalvandoSlug(null);
    }
  }

  async function togglePublicado(slug) {
    setPublicandoSlug(slug);
    try {
      const res = await fetch(`/api/admin/instagram/${encodeURIComponent(slug)}/publicado`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setRascunhos((prev) => prev.map((r) => (r.slug === slug ? { ...r, publicado: data.publicado } : r)));
      }
    } finally {
      setPublicandoSlug(null);
    }
  }

  async function copiarLegenda(slug) {
    await navigator.clipboard.writeText(legendaInput[slug] || '');
    setCopiadoSlug(slug);
    setTimeout(() => setCopiadoSlug((prev) => (prev === slug ? null : prev)), 2000);
  }

  return (
    <div ref={rootRef}>
      <div className={styles.institucionalBox}>
        <div>
          <span className={styles.institucionalTitulo}>Sem data comemorativa hoje?</span>
          <p className={styles.institucionalTexto}>
            Gere um conteúdo sobre a própria clínica — um profissional, uma especialidade, os horários de atendimento ou a agenda aberta.
          </p>
        </div>
        <div className={styles.institucionalAcoes}>
          <select
            className={styles.provedorSelect}
            value={tipoInstitucional}
            onChange={(e) => setTipoInstitucional(e.target.value)}
            disabled={gerandoInstitucional}
            aria-label="Tipo de conteúdo institucional"
          >
            <option value="aleatorio">Surpreenda-me</option>
            {TIPOS_INSTITUCIONAIS.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            onClick={gerarInstitucional}
            disabled={gerandoInstitucional}
          >
            {gerandoInstitucional ? 'Gerando...' : 'Gerar conteúdo institucional'}
          </button>
        </div>
        {erroInstitucional && <p className={styles.erro}>{erroInstitucional}</p>}
      </div>

      {rascunhos.length === 0 ? (
        <p>Nenhum rascunho gerado ainda. Um novo aparece aqui todo dia às 07:30, quando houver uma data comemorativa — ou use o botão acima.</p>
      ) : (
      <div className={styles.list}>
      {rascunhos.map((rascunho) => {
        const legendaSuja = (legendaInput[rascunho.slug] || '') !== rascunho.legenda;
        const gerada = Boolean(imagemGerada[rascunho.slug]);
        const gerando = gerandoImagemSlug === rascunho.slug;
        const v = cacheBuster[rascunho.slug];
        const srcFeed = `/api/instagram/imagem/${rascunho.slug}?formato=feed${v ? `&v=${v}` : ''}`;
        const srcStories = `/api/instagram/imagem/${rascunho.slug}?formato=stories${v ? `&v=${v}` : ''}`;
        return (
          <div key={rascunho.slug} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.tema}>{rascunho.tema}</span>
                <span className={styles.data}>{formatarData(rascunho.criadoEm)}</span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${rascunho.publicado ? styles.toggleAtivo : ''}`}
                onClick={() => togglePublicado(rascunho.slug)}
                disabled={publicandoSlug === rascunho.slug}
                aria-pressed={rascunho.publicado}
              >
                {rascunho.publicado ? 'Publicado' : 'Marcar como publicado'}
              </button>
            </div>

            <InstagramPostPreview
              imagemFeedSrc={srcFeed}
              imagemStoriesSrc={srcStories}
              legenda={legendaInput[rascunho.slug] || ''}
            />

            <div className={styles.imagemAcoes}>
              <select
                className={styles.provedorSelect}
                value={provedorImagem[rascunho.slug] || 'gemini'}
                onChange={(e) =>
                  setProvedorImagem((prev) => ({ ...prev, [rascunho.slug]: e.target.value }))
                }
                disabled={gerando}
                aria-label="Provedor de IA para gerar a imagem"
              >
                <option value="gemini">Gemini (Google)</option>
                <option value="openai">OpenAI</option>
              </select>
              <button
                type="button"
                className="btn-primary"
                onClick={() => gerarImagem(rascunho.slug)}
                disabled={gerando}
              >
                {gerando ? 'Gerando imagem...' : gerada ? 'Regenerar imagem com IA' : 'Gerar imagem com IA'}
              </button>
              {gerada && (
                <div className={styles.downloads}>
                  <a href={srcFeed} download={`${rascunho.slug}-feed.jpg`} className={styles.downloadLink}>
                    Baixar imagem do feed
                  </a>
                  <a href={srcStories} download={`${rascunho.slug}-stories.jpg`} className={styles.downloadLink}>
                    Baixar imagem do stories
                  </a>
                </div>
              )}
            </div>
            {erroImagemSlug[rascunho.slug] && <p className={styles.erro}>{erroImagemSlug[rascunho.slug]}</p>}

            <label className={styles.legendaLabel} htmlFor={`legenda-${rascunho.slug}`}>
              Legenda
            </label>
            <textarea
              id={`legenda-${rascunho.slug}`}
              className={styles.legendaInput}
              rows={5}
              value={legendaInput[rascunho.slug] || ''}
              onChange={(e) =>
                setLegendaInput((prev) => ({ ...prev, [rascunho.slug]: e.target.value }))
              }
            />
            {erroSlug[rascunho.slug] && <p className={styles.erro}>{erroSlug[rascunho.slug]}</p>}

            <div className={styles.acoes}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => copiarLegenda(rascunho.slug)}
              >
                {copiadoSlug === rascunho.slug ? 'Copiado!' : 'Copiar legenda'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => salvarLegenda(rascunho.slug)}
                disabled={salvandoSlug === rascunho.slug || !legendaSuja}
              >
                {salvandoSlug === rascunho.slug ? 'Salvando...' : 'Salvar legenda'}
              </button>
            </div>
          </div>
        );
      })}
      </div>
      )}
    </div>
  );
}
