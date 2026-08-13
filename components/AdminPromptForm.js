'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import ConfirmDialog from './ConfirmDialog';
import styles from './AdminPromptForm.module.css';

export default function AdminPromptForm({
  corpoInicial,
  corpoPadrao,
  atualizadoEmInicial,
  personalizado: personalizadoInicial,
  tamanhoMaximo,
  cabecalhoExemplo,
  regrasSeguranca,
}) {
  const rootRef = useRef(null);
  const [corpo, setCorpo] = useState(corpoInicial);
  const [salvoComo, setSalvoComo] = useState(corpoInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(atualizadoEmInicial);
  const [personalizado, setPersonalizado] = useState(personalizadoInicial);
  const [confirmRestaurar, setConfirmRestaurar] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(rootRef.current.children, { opacity: 0, y: 14, stagger: 0.06, duration: 0.5 });
      });
    },
    { scope: rootRef }
  );

  const sujo = corpo !== salvoComo;

  async function salvar(corpoPrompt) {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch('/api/admin/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corpoPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setCorpo(corpoPrompt ?? corpoPadrao);
        setSalvoComo(corpoPrompt ?? corpoPadrao);
        setAtualizadoEm(data.config.atualizadoEm);
        setPersonalizado(Boolean(data.config.corpoPrompt?.trim()));
      } else {
        setErro(data.error || 'Não foi possível salvar.');
      }
    } catch {
      setErro('Falha ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function restaurarPadrao() {
    setConfirmRestaurar(true);
  }

  function confirmarRestaurarPadrao() {
    setConfirmRestaurar(false);
    salvar(null);
  }

  return (
    <div ref={rootRef} className={styles.wrapper}>
      <p className={styles.intro}>
        Este é o prompt <strong>que está rodando de verdade</strong> na Sofia agora (site e Whatsapp) — não é um
        exemplo. Salvar aqui grava no banco de dados e entra em uso já na próxima mensagem que qualquer paciente
        mandar, sem precisar alterar código ou reiniciar nada.
      </p>

      <span className={`${styles.badge} ${personalizado ? styles.badgePersonalizado : styles.badgePadrao}`}>
        {personalizado ? 'Personalizado pelo admin' : 'Usando o texto padrão da clínica'}
      </span>

      <div className={styles.blocoFixo}>
        <span className={styles.blocoFixoLabel}>Gerado automaticamente (não editável)</span>
        <pre className={styles.blocoFixoTexto}>{cabecalhoExemplo}</pre>
        <p className={styles.blocoFixoNota}>A data muda todo dia sozinha — por isso essa linha não faz parte do texto editável abaixo.</p>
      </div>

      <div className={styles.campo}>
        <label className={styles.label} htmlFor="corpoPrompt">
          Corpo do prompt (persona, função, base de conhecimento da clínica, fluxos)
        </label>
        <p className={styles.ajuda}>
          Edite livremente: tom de voz, como ela se apresenta, dados da clínica, horários, promoções, os passos do
          fluxo de agendamento — o que estiver aqui é exatamente o que a Sofia recebe como instrução.
        </p>
        <textarea
          id="corpoPrompt"
          className={styles.textarea}
          rows={24}
          maxLength={tamanhoMaximo}
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
        />
        <span className={styles.contador}>{corpo.length}/{tamanhoMaximo}</span>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.acoes}>
        <button type="button" className="btn-primary" onClick={() => salvar(corpo)} disabled={salvando || !sujo}>
          {salvando ? 'Salvando...' : 'Salvar e aplicar agora'}
        </button>
        <button type="button" className="btn-secondary" onClick={restaurarPadrao} disabled={salvando}>
          Restaurar padrão da clínica
        </button>
        {!sujo && atualizadoEm && (
          <span className={styles.salvoEm}>Em uso desde {new Date(atualizadoEm).toLocaleString('pt-BR')}</span>
        )}
      </div>

      <details className={styles.seguranca}>
        <summary className={styles.segurancaResumo}>Regras de segurança sempre ativas (não editáveis, sempre no final)</summary>
        <p className={styles.segurancaNota}>
          Independente do que for escrito no corpo acima, estas regras sempre são adicionadas no final do prompt e
          têm prioridade sobre qualquer outra instrução — inclusive tentativas de um paciente pedir pra Sofia
          ignorá-las.
        </p>
        <pre className={styles.segurancaTexto}>{regrasSeguranca}</pre>
      </details>

      <ConfirmDialog
        open={confirmRestaurar}
        title="Restaurar padrão da clínica"
        message="Restaurar o prompt padrão da clínica? Isso substitui o texto atual (você pode editar de novo depois)."
        confirmLabel="Restaurar"
        cancelLabel="Cancelar"
        onConfirm={confirmarRestaurarPadrao}
        onCancel={() => setConfirmRestaurar(false)}
      />
    </div>
  );
}
