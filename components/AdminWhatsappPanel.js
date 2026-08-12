'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Settings, Search, Send, MessageCircleMore } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';
import styles from './AdminWhatsappPanel.module.css';
import { FEATURE_WHATSAPP_INBOX } from '../lib/featureFlags';

const CORES_AVATAR = ['#2b7a3e', '#8a5a2b', '#2b5f7a', '#7a2b5f', '#5f7a2b', '#7a3e2b'];

function corAvatar(texto) {
  const chave = String(texto || '');
  let soma = 0;
  for (let i = 0; i < chave.length; i++) soma += chave.charCodeAt(i);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

const POLL_INTERVAL_MS = 4000; // status da conexão (QR/pairing) enquanto aguarda leitura
const QR_TIMEOUT_MS = 90 * 1000;
const CONVERSAS_POLL_MS = 15000; // lista lateral
const HISTORICO_POLL_MS = 5000; // chat aberto, pra simular atualização ao vivo

const AUTOR_PREFIXO = { atendente: 'Você: ', sofia: '' };

function estadoLabel(unidade) {
  if (!unidade.configurada) return 'Não configurada';
  if (unidade.conectado) return 'Conectado';
  if (unidade.estado === 'connecting') return 'Aguardando leitura do QR code';
  if (unidade.estado === 'erro') return 'Erro ao consultar status';
  return 'Desconectado';
}

function tempoRelativo(timestamp) {
  if (!timestamp) return '—';
  const diffMs = Date.now() - timestamp;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function inicialDe(texto) {
  const limpo = (texto || '').trim();
  return limpo ? limpo.charAt(0).toUpperCase() : '?';
}

export default function AdminWhatsappPanel({ unidadesIniciais }) {
  const [unidades, setUnidades] = useState(unidadesIniciais);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState({});
  const [erroPorUnidade, setErroPorUnidade] = useState({});
  const [webhookOkPorUnidade, setWebhookOkPorUnidade] = useState({});
  const [qrExpiradoPorUnidade, setQrExpiradoPorUnidade] = useState({});
  const [unidadeConfigModal, setUnidadeConfigModal] = useState(null);
  const [modoConexao, setModoConexao] = useState('qrcode'); // 'qrcode' | 'paircode'
  const [telefonePareamento, setTelefonePareamento] = useState('');
  const qrTimers = useRef({}); // { [unidadeId]: { intervalId, timeoutId } }

  const [conversas, setConversas] = useState([]);
  const [carregandoConversas, setCarregandoConversas] = useState(true);
  const [erroConversas, setErroConversas] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('todos'); // 'todos' | id da unidade
  const [filtroStatus, setFiltroStatus] = useState('geral'); // 'geral' | 'atendente' | 'sofia'
  const [alterandoContato, setAlterandoContato] = useState(null); // `${unidadeId}:${numero}`

  const [conversaSelecionada, setConversaSelecionada] = useState(null); // { unidadeId, numero }
  const [historicoSelecionado, setHistoricoSelecionado] = useState(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState(null);
  const [mensagemInput, setMensagemInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const mensagensFimRef = useRef(null);
  const listaConversasRef = useRef(null);

  useGSAP(
    () => {
      if (!FEATURE_WHATSAPP_INBOX || carregandoConversas) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.itemConversa}`, { opacity: 0, y: 10, stagger: 0.04, duration: 0.4 });
      });
    },
    { scope: listaConversasRef, dependencies: [carregandoConversas] }
  );

  // Escape fecha o modal de configuração da unidade, quando aberto.
  useEffect(() => {
    if (!unidadeConfigModal) return;
    function aoTeclar(e) {
      if (e.key === 'Escape') setUnidadeConfigModal(null);
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [unidadeConfigModal]);

  useEffect(() => {
    return () => {
      Object.values(qrTimers.current).forEach(({ intervalId, timeoutId }) => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      });
    };
  }, []);

  async function carregarConversas({ silencioso = false } = {}) {
    if (!silencioso) setCarregandoConversas(true);
    try {
      const res = await fetch('/api/admin/whatsapp/conversas');
      const data = await res.json();
      if (data.success) {
        setConversas(data.conversas);
        setErroConversas(null);
      } else if (!silencioso) {
        setErroConversas(data.error || 'Não foi possível carregar as conversas.');
      }
    } catch {
      if (!silencioso) setErroConversas('Falha ao carregar as conversas. Tente novamente.');
    } finally {
      if (!silencioso) setCarregandoConversas(false);
    }
  }

  // Feed principal: carrega na entrada e mantém atualizado sozinho. Só faz
  // sentido com o inbox ligado — com a flag off, a página só mostra a
  // configuração de conexão das unidades.
  useEffect(() => {
    if (!FEATURE_WHATSAPP_INBOX) return;
    carregarConversas();
    const intervalId = setInterval(() => carregarConversas({ silencioso: true }), CONVERSAS_POLL_MS);
    return () => clearInterval(intervalId);
  }, []);

  async function carregarHistorico(unidadeId, numero, { silencioso = false } = {}) {
    if (!silencioso) {
      setCarregandoHistorico(true);
      setErroHistorico(null);
    }
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/contatos/${encodeURIComponent(numero)}/historico`);
      const data = await res.json();
      if (data.success) {
        setHistoricoSelecionado(data.historico);
      } else if (!silencioso) {
        setErroHistorico(data.error || 'Não foi possível carregar o histórico.');
      }
    } catch {
      if (!silencioso) setErroHistorico('Falha ao carregar o histórico. Tente novamente.');
    } finally {
      if (!silencioso) setCarregandoHistorico(false);
    }
  }

  // Chat aberto: recarrega ao trocar de conversa e faz polling leve enquanto
  // ela continuar selecionada, pra simular uma ferramenta de conversa viva.
  useEffect(() => {
    if (!conversaSelecionada) return;
    setHistoricoSelecionado(null);
    carregarHistorico(conversaSelecionada.unidadeId, conversaSelecionada.numero);
    const intervalId = setInterval(
      () => carregarHistorico(conversaSelecionada.unidadeId, conversaSelecionada.numero, { silencioso: true }),
      HISTORICO_POLL_MS
    );
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaSelecionada?.unidadeId, conversaSelecionada?.numero]);

  useEffect(() => {
    mensagensFimRef.current?.scrollIntoView({ block: 'end' });
  }, [historicoSelecionado]);

  function selecionarConversa(conversa) {
    setConversaSelecionada({ unidadeId: conversa.unidadeId, numero: conversa.telefone });
    setMensagemInput('');
    setErroEnvio(null);
  }

  async function alternarIa(unidadeId, numero, iaAtivaAtual) {
    const chave = `${unidadeId}:${numero}`;
    setAlterandoContato(chave);
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/contatos/${encodeURIComponent(numero)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iaAtiva: !iaAtivaAtual }),
      });
      const data = await res.json();
      if (data.success) {
        setConversas((prev) =>
          prev.map((c) => (c.unidadeId === unidadeId && c.telefone === numero ? { ...c, iaAtiva: data.iaAtiva } : c))
        );
      }
    } finally {
      setAlterandoContato(null);
    }
  }

  async function enviarMensagem(e) {
    e.preventDefault();
    const texto = mensagemInput.trim();
    if (!texto || !conversaSelecionada) return;
    const { unidadeId, numero } = conversaSelecionada;

    setEnviando(true);
    setErroEnvio(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/contatos/${encodeURIComponent(numero)}/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (data.success) {
        setMensagemInput('');
        setHistoricoSelecionado((prev) => [...(prev || []), { role: 'assistant', content: texto }]);
        setConversas((prev) =>
          prev.map((c) =>
            c.unidadeId === unidadeId && c.telefone === numero
              ? { ...c, ultimaMensagem: texto, autor: 'atendente', ultimaAtividade: Date.now() }
              : c
          )
        );
      } else {
        setErroEnvio(data.error || 'Não foi possível enviar a mensagem.');
      }
    } catch {
      setErroEnvio('Falha ao enviar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  // --- Configuração de conexão por unidade (QR / pairing code / webhook) ---

  function pararQrPolling(unidadeId) {
    const t = qrTimers.current[unidadeId];
    if (t) {
      clearInterval(t.intervalId);
      clearTimeout(t.timeoutId);
      delete qrTimers.current[unidadeId];
    }
  }

  function atualizarUnidade(unidadeId, dados) {
    setUnidades((prev) => prev.map((u) => (u.id === unidadeId ? { ...u, ...dados } : u)));
  }

  function iniciarQrPolling(unidadeId) {
    pararQrPolling(unidadeId);
    setQrExpiradoPorUnidade((prev) => ({ ...prev, [unidadeId]: false }));

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/whatsapp/${unidadeId}/status`);
        const data = await res.json();
        if (data.success && data.conectado) {
          pararQrPolling(unidadeId);
          atualizarUnidade(unidadeId, data);
        }
      } catch {
        // Falha pontual de polling não interrompe as próximas tentativas.
      }
    }, POLL_INTERVAL_MS);

    const timeoutId = setTimeout(() => {
      pararQrPolling(unidadeId);
      setQrExpiradoPorUnidade((prev) => ({ ...prev, [unidadeId]: true }));
    }, QR_TIMEOUT_MS);

    qrTimers.current[unidadeId] = { intervalId, timeoutId };
  }

  async function conectar(unidadeId, phone) {
    setAcaoEmAndamento((prev) => ({ ...prev, [unidadeId]: 'conectando' }));
    setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: null }));
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        atualizarUnidade(unidadeId, data);
        if (!data.conectado) iniciarQrPolling(unidadeId);
      } else {
        setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: data.error || 'Não foi possível gerar o QR code.' }));
      }
    } catch {
      setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: 'Falha ao conectar. Tente novamente.' }));
    } finally {
      setAcaoEmAndamento((prev) => ({ ...prev, [unidadeId]: null }));
    }
  }

  async function desconectar(unidadeId) {
    if (!window.confirm('Desconectar este número do WhatsApp? Será preciso escanear o QR code de novo para reconectar.')) {
      return;
    }
    pararQrPolling(unidadeId);
    setAcaoEmAndamento((prev) => ({ ...prev, [unidadeId]: 'desconectando' }));
    setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: null }));
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/disconnect`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        atualizarUnidade(unidadeId, data);
      } else {
        setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: data.error || 'Não foi possível desconectar.' }));
      }
    } catch {
      setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: 'Falha ao desconectar. Tente novamente.' }));
    } finally {
      setAcaoEmAndamento((prev) => ({ ...prev, [unidadeId]: null }));
    }
  }

  async function configurarWebhook(unidadeId) {
    setAcaoEmAndamento((prev) => ({ ...prev, [unidadeId]: 'configurando_webhook' }));
    setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: null }));
    setWebhookOkPorUnidade((prev) => ({ ...prev, [unidadeId]: null }));
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/webhook`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWebhookOkPorUnidade((prev) => ({ ...prev, [unidadeId]: data.webhookUrl }));
      } else {
        setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: data.error || 'Não foi possível configurar o webhook.' }));
      }
    } catch {
      setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: 'Falha ao configurar o webhook. Tente novamente.' }));
    } finally {
      setAcaoEmAndamento((prev) => ({ ...prev, [unidadeId]: null }));
    }
  }

  function abrirConfigModal(unidadeId) {
    setUnidadeConfigModal(unidadeId);
    setModoConexao('qrcode');
    setTelefonePareamento('');
  }

  const unidadeConfig = unidades.find((u) => u.id === unidadeConfigModal) || null;
  const acao = unidadeConfig ? acaoEmAndamento[unidadeConfig.id] : null;
  const erroConfig = unidadeConfig ? erroPorUnidade[unidadeConfig.id] : null;
  const webhookOk = unidadeConfig ? webhookOkPorUnidade[unidadeConfig.id] : null;
  const qrExpirado = unidadeConfig ? qrExpiradoPorUnidade[unidadeConfig.id] : false;
  const mostrarQr = unidadeConfig && Boolean(unidadeConfig.qrcode) && !unidadeConfig.conectado && !qrExpirado;
  const mostrarPaircode = unidadeConfig && Boolean(unidadeConfig.paircode) && !unidadeConfig.conectado && !qrExpirado;
  const telefoneValido = telefonePareamento.replace(/\D/g, '').length >= 10;

  const conversasComAtendente = useMemo(() => conversas.filter((c) => c.iaAtiva === false), [conversas]);
  const conversasComSofia = useMemo(() => conversas.filter((c) => c.iaAtiva !== false), [conversas]);

  const conversasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return conversas.filter((c) => {
      if (filtroUnidade !== 'todos' && c.unidadeId !== filtroUnidade) return false;
      if (filtroStatus === 'atendente' && c.iaAtiva !== false) return false;
      if (filtroStatus === 'sofia' && c.iaAtiva === false) return false;
      if (termo && !(c.nome || '').toLowerCase().includes(termo) && !c.telefone.includes(termo)) return false;
      return true;
    });
  }, [conversas, busca, filtroUnidade, filtroStatus]);

  const conversaAtual = conversaSelecionada
    ? conversas.find((c) => c.unidadeId === conversaSelecionada.unidadeId && c.telefone === conversaSelecionada.numero)
    : null;

  return (
    <>
      {!FEATURE_WHATSAPP_INBOX ? (
        <div className={styles.unidadesSimples}>
          {unidades.map((u) => (
            <button key={u.id} type="button" className={styles.unidadeCard} onClick={() => abrirConfigModal(u.id)}>
              <span className={styles.unidadeNome}>{u.nome}</span>
              <span className={`${styles.status} ${u.conectado ? styles.statusAtivo : ''}`}>
                {estadoLabel(u)}
                {u.conectado && u.numero ? ` · ${u.numero}` : ''}
              </span>
              <span className={styles.unidadeCardAcao}>Gerenciar →</span>
            </button>
          ))}
        </div>
      ) : (
      <div className={styles.inbox}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTopo}>
            <h2 className={styles.sidebarTitulo}>Conversas</h2>

            <div className={styles.unidadesBar}>
              <button
                type="button"
                className={`${styles.unidadePill} ${filtroUnidade === 'todos' ? styles.unidadePillAtivo : ''}`}
                onClick={() => setFiltroUnidade('todos')}
              >
                Todos
              </button>
              {unidades.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`${styles.unidadePill} ${filtroUnidade === u.id ? styles.unidadePillAtivo : ''}`}
                  onClick={() => setFiltroUnidade(u.id)}
                  title={`Filtrar por ${u.nome}`}
                >
                  <span className={`${styles.unidadeDot} ${u.conectado ? styles.unidadeDotAtivo : ''}`} />
                  {u.nome}
                  <span
                    className={styles.unidadeConfigBtn}
                    role="button"
                    tabIndex={0}
                    title={`Configurar Whatsapp da unidade ${u.nome}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirConfigModal(u.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        abrirConfigModal(u.id);
                      }
                    }}
                  >
                    <Settings size={12} />
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.statusTabs}>
              <button
                type="button"
                className={`${styles.statusTab} ${filtroStatus === 'geral' ? styles.statusTabAtivo : ''}`}
                onClick={() => setFiltroStatus('geral')}
              >
                Geral <span className={styles.statusTabCount}>{conversas.length}</span>
              </button>
              <button
                type="button"
                className={`${styles.statusTab} ${filtroStatus === 'atendente' ? styles.statusTabAtivo : ''}`}
                onClick={() => setFiltroStatus('atendente')}
              >
                Atendente <span className={styles.statusTabCount}>{conversasComAtendente.length}</span>
              </button>
              <button
                type="button"
                className={`${styles.statusTab} ${filtroStatus === 'sofia' ? styles.statusTabAtivo : ''}`}
                onClick={() => setFiltroStatus('sofia')}
              >
                Sofia (IA) <span className={styles.statusTabCount}>{conversasComSofia.length}</span>
              </button>
            </div>

            <div className={styles.buscaBox}>
              <Search size={15} className={styles.buscaIcone} />
              <input
                type="text"
                className={styles.buscaInput}
                placeholder="Buscar por nome ou número"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div ref={listaConversasRef} className={styles.listaConversas}>
            {carregandoConversas && <p className={styles.aviso}>Carregando conversas...</p>}
            {erroConversas && <p className={styles.erro}>{erroConversas}</p>}
            {!carregandoConversas && !erroConversas && conversasFiltradas.length === 0 && (
              <p className={styles.aviso}>
                {conversas.length === 0 ? 'Nenhuma conversa nas últimas 48h.' : 'Nenhuma conversa encontrada com esse filtro.'}
              </p>
            )}
            {conversasFiltradas.map((c) => {
              const selecionada =
                conversaSelecionada?.unidadeId === c.unidadeId && conversaSelecionada?.numero === c.telefone;
              const nomeOuNumero = c.nome || c.telefone;
              return (
                <button
                  key={`${c.unidadeId}:${c.telefone}`}
                  type="button"
                  className={`${styles.itemConversa} ${selecionada ? styles.itemConversaAtivo : ''}`}
                  onClick={() => selecionarConversa(c)}
                >
                  <span className={styles.avatar} style={{ background: corAvatar(nomeOuNumero) }}>
                    {inicialDe(nomeOuNumero)}
                  </span>
                  <span className={styles.itemInfo}>
                    <span className={styles.itemLinha1}>
                      <span className={styles.itemNome}>{nomeOuNumero}</span>
                      <span className={styles.itemHora}>{tempoRelativo(c.ultimaAtividade)}</span>
                    </span>
                    <span className={styles.itemLinha2}>
                      <span className={styles.itemPreview}>
                        {AUTOR_PREFIXO[c.autor] || ''}
                        {c.ultimaMensagem || '—'}
                      </span>
                      <span className={styles.itemBadges}>
                        <span className={`${styles.itemUnidade} ${selecionada ? styles.itemUnidadeAtiva : ''}`}>
                          {c.unidadeNome}
                        </span>
                        {c.iaAtiva === false && <span className={styles.pausadaBadge}>IA pausada</span>}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className={styles.chatPane}>
          {!conversaSelecionada ? (
            <div className={styles.chatVazio}>
              <MessageCircleMore size={40} strokeWidth={1.3} />
              <p>Selecione uma conversa à esquerda para ver o histórico e responder.</p>
            </div>
          ) : (
            <>
              <header className={styles.chatHeader}>
                <span className={styles.avatar} style={{ background: corAvatar(conversaAtual?.nome || conversaSelecionada.numero) }}>
                  {inicialDe(conversaAtual?.nome || conversaSelecionada.numero)}
                </span>
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatNome}>{conversaAtual?.nome || conversaSelecionada.numero}</span>
                  <span className={styles.chatSub}>
                    {conversaAtual?.unidadeNome} · {conversaSelecionada.numero}
                  </span>
                </div>
                {conversaAtual && (
                  <button
                    type="button"
                    className={`${styles.toggleIa} ${conversaAtual.iaAtiva ? styles.toggleIaAtiva : ''}`}
                    onClick={() => alternarIa(conversaAtual.unidadeId, conversaAtual.telefone, conversaAtual.iaAtiva)}
                    disabled={alterandoContato === `${conversaAtual.unidadeId}:${conversaAtual.telefone}`}
                  >
                    IA {conversaAtual.iaAtiva ? 'Ativa' : 'Pausada'}
                  </button>
                )}
              </header>

              <div className={styles.chatBody}>
                {carregandoHistorico && <p className={styles.aviso}>Carregando conversa...</p>}
                {erroHistorico && <p className={styles.erro}>{erroHistorico}</p>}
                {!carregandoHistorico && !erroHistorico && historicoSelecionado?.length === 0 && (
                  <p className={styles.aviso}>Nenhuma mensagem registrada nesta conversa.</p>
                )}
                {!carregandoHistorico &&
                  !erroHistorico &&
                  historicoSelecionado?.map((msg, i) => (
                    <div
                      key={i}
                      className={`${styles.bolha} ${msg.role === 'user' ? styles.bolhaPaciente : styles.bolhaSofia}`}
                    >
                      {msg.content}
                    </div>
                  ))}
                <div ref={mensagensFimRef} />
              </div>

              <div className={styles.composerWrapper}>
                {erroEnvio && <p className={styles.erro}>{erroEnvio}</p>}
                <form className={styles.composer} onSubmit={enviarMensagem}>
                  <input
                    type="text"
                    className={styles.composerInput}
                    placeholder="Digite uma mensagem para o paciente..."
                    value={mensagemInput}
                    onChange={(e) => setMensagemInput(e.target.value)}
                    disabled={enviando}
                  />
                  <button
                    type="submit"
                    className={styles.composerEnviar}
                    disabled={enviando || !mensagemInput.trim()}
                    aria-label="Enviar mensagem"
                  >
                    <Send size={17} />
                  </button>
                </form>
                <p className={styles.composerAjuda}>Enviar uma mensagem por aqui pausa a Sofia nesta conversa por 60min.</p>
              </div>
            </>
          )}
        </section>
      </div>
      )}

      {unidadeConfig && (
        <div className={styles.overlay} role="presentation" onClick={() => setUnidadeConfigModal(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`Configurar Whatsapp da unidade ${unidadeConfig.nome}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.unidadeNome}>{unidadeConfig.nome}</span>
                <span className={`${styles.status} ${unidadeConfig.conectado ? styles.statusAtivo : ''}`}>
                  {estadoLabel(unidadeConfig)}
                  {unidadeConfig.conectado && unidadeConfig.numero ? ` · ${unidadeConfig.numero}` : ''}
                </span>
              </div>
              <button type="button" className={styles.fechar} onClick={() => setUnidadeConfigModal(null)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {!unidadeConfig.configurada ? (
                <p className={styles.aviso}>
                  Configure UAZAPI_BASE_URL_{unidadeConfig.id.toUpperCase()} e UAZAPI_TOKEN_{unidadeConfig.id.toUpperCase()} no
                  ambiente para gerenciar esta unidade.
                </p>
              ) : (
                <>
                  {!unidadeConfig.conectado && unidadeConfig.estado !== 'connecting' && (
                    <div className={styles.modoTabs}>
                      <button
                        type="button"
                        className={`${styles.modoTab} ${modoConexao === 'qrcode' ? styles.modoTabAtivo : ''}`}
                        onClick={() => setModoConexao('qrcode')}
                      >
                        QR code
                      </button>
                      <button
                        type="button"
                        className={`${styles.modoTab} ${modoConexao === 'paircode' ? styles.modoTabAtivo : ''}`}
                        onClick={() => setModoConexao('paircode')}
                      >
                        Código de pareamento
                      </button>
                    </div>
                  )}

                  {!unidadeConfig.conectado && unidadeConfig.estado !== 'connecting' && modoConexao === 'paircode' && !mostrarPaircode && (
                    <div className={styles.paircodeForm}>
                      <input
                        type="tel"
                        inputMode="numeric"
                        className={styles.telefoneInput}
                        placeholder="Ex: 5579912345678 (DDI + DDD + número)"
                        value={telefonePareamento}
                        onChange={(e) => setTelefonePareamento(e.target.value)}
                      />
                      <p className={styles.qrAjuda}>
                        Número do Whatsapp que vai ser conectado, com código do país e DDD, só dígitos.
                      </p>
                    </div>
                  )}

                  {mostrarQr && modoConexao === 'qrcode' && (
                    <div className={styles.qrBox}>
                      <img
                        src={unidadeConfig.qrcode}
                        alt={`QR code para conectar o Whatsapp da unidade ${unidadeConfig.nome}`}
                        className={styles.qrImg}
                      />
                      <p className={styles.qrAjuda}>Abra o Whatsapp no celular → Dispositivos conectados → Conectar um dispositivo.</p>
                    </div>
                  )}

                  {mostrarPaircode && (
                    <div className={styles.qrBox}>
                      <span className={styles.paircodeValor}>{unidadeConfig.paircode}</span>
                      <p className={styles.qrAjuda}>
                        No celular: Whatsapp → Aparelhos conectados → Conectar um aparelho → Conectar com número de
                        telefone, e digite esse código.
                      </p>
                    </div>
                  )}

                  {qrExpirado && !unidadeConfig.conectado && (
                    <p className={styles.aviso}>
                      {modoConexao === 'paircode' ? 'Código de pareamento expirado.' : 'QR code expirado.'} Gere um novo para conectar.
                    </p>
                  )}

                  {erroConfig && <p className={styles.erro}>{erroConfig}</p>}
                  {webhookOk && <p className={styles.aviso}>Webhook configurado: {webhookOk}</p>}

                  <div className={styles.acoes}>
                    {!unidadeConfig.conectado && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                          conectar(unidadeConfig.id, modoConexao === 'paircode' ? telefonePareamento.replace(/\D/g, '') : undefined)
                        }
                        disabled={acao === 'conectando' || (modoConexao === 'paircode' && !telefoneValido)}
                      >
                        {acao === 'conectando'
                          ? modoConexao === 'paircode' ? 'Gerando código...' : 'Gerando QR code...'
                          : modoConexao === 'paircode'
                            ? mostrarPaircode ? 'Gerar novo código' : 'Gerar código de pareamento'
                            : mostrarQr ? 'Gerar novo QR code' : 'Conectar / Gerar QR code'}
                      </button>
                    )}
                    {(unidadeConfig.conectado || unidadeConfig.estado === 'connecting') && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => desconectar(unidadeConfig.id)}
                        disabled={acao === 'desconectando'}
                      >
                        {acao === 'desconectando' ? 'Desconectando...' : 'Desconectar'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => configurarWebhook(unidadeConfig.id)}
                      disabled={acao === 'configurando_webhook'}
                    >
                      {acao === 'configurando_webhook' ? 'Configurando webhook...' : 'Configurar webhook'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
