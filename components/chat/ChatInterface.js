'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, RotateCcw } from 'lucide-react';
import styles from './ChatInterface.module.css';

const STORAGE_KEY = 'clinSaude_chatHistory';

const FALLBACK_TEXT =
  'Ops, tive um probleminha aqui. Pode tentar de novo? Se preferir, fala com a gente pelo WhatsApp (79) 99989-6288.';

function greetingMessage() {
  return {
    role: 'assistant',
    content: 'Oi! Eu sou a Sofia, da Clin+Saúde 😊 Posso agendar, remarcar ou cancelar uma consulta, ou tirar dúvidas. Como posso ajudar?',
  };
}

function loadHistory() {
  if (typeof window === 'undefined') return [greetingMessage()];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore corrupted storage
  }
  return [greetingMessage()];
}

export default function ChatInterface({ className }) {
  const [messages, setMessages] = useState(() => [greetingMessage()]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setMessages(loadHistory());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, loaded]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleReset = () => {
    const fresh = [greetingMessage()];
    setMessages(fresh);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const payload = nextMessages.filter((m) => !m._local);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([...nextMessages, { role: 'assistant', content: data.reply || FALLBACK_TEXT, _local: true }]);
      }
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: FALLBACK_TEXT, _local: true }]);
    } finally {
      setIsSending(false);
    }
  };

  const visibleMessages = messages.filter(
    (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0
  );

  return (
    <div className={`${styles.chat} ${className || ''}`}>
      <div className={styles.messageList} ref={listRef}>
        <AnimatePresence initial={false}>
          {visibleMessages.map((m, idx) => (
            <motion.div
              key={idx}
              className={`${styles.bubbleRow} ${m.role === 'user' ? styles.bubbleRowUser : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isSending && (
          <motion.div
            className={styles.bubbleRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.typingBubble}`}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </motion.div>
        )}
      </div>

      <form className={styles.inputBar} onSubmit={handleSend}>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          aria-label="Reiniciar conversa"
          title="Reiniciar conversa"
        >
          <RotateCcw size={16} />
        </button>
        <input
          type="text"
          className={styles.textInput}
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
        />
        <button type="submit" className={styles.sendBtn} disabled={isSending || !input.trim()} aria-label="Enviar">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
