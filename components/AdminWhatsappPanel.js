'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import styles from './AdminWhatsappPanel.module.css';

const POLL_INTERVAL_MS = 4000;
const QR_TIMEOUT_MS = 90 * 1000;

function estadoLabel(unidade) {
  if (!unidade.configurada) return 'Não configurada';
  if (unidade.conectado) return 'Conectado';
  if (unidade.estado === 'connecting') return 'Aguardando leitura do QR code';
  if (unidade.estado === 'erro') return 'Erro ao consultar status';
  return 'Desconectado';
}

const AUTOR_LABEL = { paciente: 'Paciente', atendente: 'Atendente', sofia: 'Sofia' };

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

export default function AdminWhatsappPanel({ unidadesIniciais }) {
  const [unidades, setUnidades] = useState(unidadesIniciais);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState({});
  const [erroPorUnidade, setErroPorUnidade] = useState({});
  const [webhookOkPorUnidade, setWebhookOkPorUnidade] = useState({});
  const [qrExpiradoPorUnidade, setQrExpiradoPorUnidade] = useState({});
  const [unidadeModal, setUnidadeModal] = useState(null);
  const [contatosPorUnidade, setContatosPorUnidade] = useState({});
  const [carregandoContatos, setCarregandoContatos] = useState(null);
  const [erroContatos, setErroContatos] = useState({});
  const [alterandoContato, setAlterandoContato] = useState(null); // `${unidadeId}:${numero}`
  const timers = useRef({}); // { [unidadeId]: { intervalId, timeoutId } }

  useEffect(() => {
    if (!unidadeModal) return;
    function aoTeclar(e) {
      if (e.key === 'Escape') setUnidadeModal(null);
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [unidadeModal]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(({ intervalId, timeoutId }) => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      });
    };
  }, []);

  function pararPolling(unidadeId) {
    const t = timers.current[unidadeId];
    if (t) {
      clearInterval(t.intervalId);
      clearTimeout(t.timeoutId);
      delete timers.current[unidadeId];
    }
  }

  function atualizarUnidade(unidadeId, dados) {
    setUnidades((prev) => prev.map((u) => (u.id === unidadeId ? { ...u, ...dados } : u)));
  }

  function iniciarPolling(unidadeId) {
    pararPolling(unidadeId);
    setQrExpiradoPorUnidade((prev) => ({ ...prev, [unidadeId]: false }));

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/whatsapp/${unidadeId}/status`);
        const data = await res.json();
        if (data.success && data.conectado) {
          pararPolling(unidadeId);
          atualizarUnidade(unidadeId, data);
        }
      } catch {
        // Falha pontual de polling não interrompe as próximas tentativas.
      }
    }, POLL_INTERVAL_MS);

    const timeoutId = setTimeout(() => {
      pararPolling(unidadeId);
      setQrExpiradoPorUnidade((prev) => ({ ...prev, [unidadeId]: true }));
    }, QR_TIMEOUT_MS);

    timers.current[unidadeId] = { intervalId, timeoutId };
  }

  async function conectar(unidadeId) {
    setAcaoEmAndamento((prev) => ({ ...prev, [unidadeId]: 'conectando' }));
    setErroPorUnidade((prev) => ({ ...prev, [unidadeId]: null }));
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/connect`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        atualizarUnidade(unidadeId, data);
        if (!data.conectado) iniciarPolling(unidadeId);
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
    pararPolling(unidadeId);
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

  async function carregarContatos(unidadeId) {
    setCarregandoContatos(unidadeId);
    setErroContatos((prev) => ({ ...prev, [unidadeId]: null }));
    try {
      const res = await fetch(`/api/admin/whatsapp/${unidadeId}/contatos`);
      const data = await res.json();
      if (data.success) {
        setContatosPorUnidade((prev) => ({ ...prev, [unidadeId]: data.contatos }));
      } else {
        setErroContatos((prev) => ({ ...prev, [unidadeId]: data.error || 'Não foi possível carregar as conversas.' }));
      }
    } catch {
      setErroContatos((prev) => ({ ...prev, [unidadeId]: 'Falha ao carregar as conversas. Tente novamente.' }));
    } finally {
      setCarregandoContatos(null);
    }
  }

  function abrirModal(unidadeId) {
    setUnidadeModal(unidadeId);
    if (!contatosPorUnidade[unidadeId]) carregarContatos(unidadeId);
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
        setContatosPorUnidade((prev) => ({
          ...prev,
          [unidadeId]: (prev[unidadeId] || []).map((c) => (c.telefone === numero ? { ...c, iaAtiva: data.iaAtiva } : c)),
        }));
      }
    } finally {
      setAlterandoContato(null);
    }
  }

  const unidade = unidades.find((u) => u.id === unidadeModal) || null;
  const acao = unidade ? acaoEmAndamento[unidade.id] : null;
  const erro = unidade ? erroPorUnidade[unidade.id] : null;
  const webhookOk = unidade ? webhookOkPorUnidade[unidade.id] : null;
  const qrExpirado = unidade ? qrExpiradoPorUnidade[unidade.id] : false;
  const mostrarQr = unidade && Boolean(unidade.qrcode) && !unidade.conectado && !qrExpirado;
  const contatos = unidade ? contatosPorUnidade[unidade.id] : null;

  return (
    <>
      <div className={styles.grid}>
        {unidades.map((u) => (
          <button key={u.id} type="button" className={styles.card} onClick={() => abrirModal(u.id)}>
            <span className={styles.unidadeNome}>{u.nome}</span>
            <span className={`${styles.status} ${u.conectado ? styles.statusAtivo : ''}`}>
              {estadoLabel(u)}
              {u.conectado && u.numero ? ` · ${u.numero}` : ''}
            </span>
            <span className={styles.cardAcao}>Gerenciar →</span>
          </button>
        ))}
      </div>

      {unidade && (
        <div className={styles.overlay} role="presentation" onClick={() => setUnidadeModal(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`Gerenciar Whatsapp da unidade ${unidade.nome}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.unidadeNome}>{unidade.nome}</span>
                <span className={`${styles.status} ${unidade.conectado ? styles.statusAtivo : ''}`}>
                  {estadoLabel(unidade)}
                  {unidade.conectado && unidade.numero ? ` · ${unidade.numero}` : ''}
                </span>
              </div>
              <button type="button" className={styles.fechar} onClick={() => setUnidadeModal(null)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {!unidade.configurada ? (
                <p className={styles.aviso}>
                  Configure UAZAPI_BASE_URL_{unidade.id.toUpperCase()} e UAZAPI_TOKEN_{unidade.id.toUpperCase()} no
                  ambiente para gerenciar esta unidade.
                </p>
              ) : (
                <>
                  {mostrarQr && (
                    <div className={styles.qrBox}>
                      <img
                        src={unidade.qrcode}
                        alt={`QR code para conectar o Whatsapp da unidade ${unidade.nome}`}
                        className={styles.qrImg}
                      />
                      <p className={styles.qrAjuda}>Abra o Whatsapp no celular → Dispositivos conectados → Conectar um dispositivo.</p>
                    </div>
                  )}

                  {qrExpirado && !unidade.conectado && (
                    <p className={styles.aviso}>QR code expirado. Gere um novo para conectar.</p>
                  )}

                  {erro && <p className={styles.erro}>{erro}</p>}
                  {webhookOk && <p className={styles.aviso}>Webhook configurado: {webhookOk}</p>}

                  <div className={styles.acoes}>
                    {!unidade.conectado && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => conectar(unidade.id)}
                        disabled={acao === 'conectando'}
                      >
                        {acao === 'conectando' ? 'Gerando QR code...' : mostrarQr ? 'Gerar novo QR code' : 'Conectar / Gerar QR code'}
                      </button>
                    )}
                    {(unidade.conectado || unidade.estado === 'connecting') && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => desconectar(unidade.id)}
                        disabled={acao === 'desconectando'}
                      >
                        {acao === 'desconectando' ? 'Desconectando...' : 'Desconectar'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => configurarWebhook(unidade.id)}
                      disabled={acao === 'configurando_webhook'}
                    >
                      {acao === 'configurando_webhook' ? 'Configurando webhook...' : 'Configurar webhook'}
                    </button>
                  </div>

                  <div className={styles.contatosBox}>
                    <h2 className={styles.contatosTitulo}>Conversas</h2>
                    {carregandoContatos === unidade.id && <p className={styles.aviso}>Carregando conversas...</p>}
                    {erroContatos[unidade.id] && <p className={styles.erro}>{erroContatos[unidade.id]}</p>}
                    {carregandoContatos !== unidade.id &&
                      !erroContatos[unidade.id] &&
                      (!contatos || contatos.length === 0 ? (
                        <p className={styles.aviso}>Nenhuma conversa registrada ainda nesta unidade.</p>
                      ) : (
                        <div className={styles.tabelaWrapper}>
                          <table className={styles.tabela}>
                            <thead>
                              <tr>
                                <th>Contato</th>
                                <th>Última mensagem</th>
                                <th>Quem falou</th>
                                <th>Atividade</th>
                                <th>IA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {contatos.map((contato) => {
                                const chave = `${unidade.id}:${contato.telefone}`;
                                return (
                                  <tr key={contato.telefone}>
                                    <td>
                                      <span className={styles.contatoNome}>{contato.nome || contato.telefone}</span>
                                      {contato.nome && <span className={styles.contatoNumero}>{contato.telefone}</span>}
                                    </td>
                                    <td className={styles.mensagemPreview}>{contato.ultimaMensagem || '—'}</td>
                                    <td>{AUTOR_LABEL[contato.autor] || '—'}</td>
                                    <td>{tempoRelativo(contato.ultimaAtividade)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className={`${styles.toggleIa} ${contato.iaAtiva ? styles.toggleIaAtiva : ''}`}
                                        onClick={() => alternarIa(unidade.id, contato.telefone, contato.iaAtiva)}
                                        disabled={alterandoContato === chave}
                                        aria-pressed={contato.iaAtiva}
                                      >
                                        {contato.iaAtiva ? 'Ativa' : 'Pausada'}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
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
