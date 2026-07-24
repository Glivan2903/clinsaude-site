'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import ChatInterface from './ChatInterface';
import styles from './ChatWidget.module.css';

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const hidden = pathname === '/chat';

  return (
    <>
      <AnimatePresence>
        {!hidden && !isOpen && (
          <motion.button
            key="fab"
            className={styles.fab}
            onClick={() => setIsOpen(true)}
            aria-label="Abrir chat com a Sofia"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <MessageCircle size={26} />
            <span className={styles.fabPulse} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hidden && isOpen && (
          <motion.div
            key="panel"
            className={`${styles.panel} glass`}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderInfo}>
                <div className={styles.avatar}>S</div>
                <div>
                  <span className={styles.panelTitle}>Sofia</span>
                  <span className={styles.panelSubtitle}>
                    <span className={styles.onlineDot} /> Clin+Saúde
                  </span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Fechar chat">
                <X size={20} />
              </button>
            </div>
            <ChatInterface className={styles.panelChat} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
