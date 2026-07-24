'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './Header.module.css';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logo}>
          <Link href="/">
            <img
              src="/logo.png"
              alt="ClinSaúde"
              className={styles.logoImg}
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className={styles.desktopNav}>
          <Link href="/#sobre" className={styles.navLink}>Sobre Nós</Link>
          <Link href="/#especialidades" className={styles.navLink}>Especialidades</Link>
          <Link href="/#contato" className={styles.navLink}>Contato</Link>
        </nav>

        {/* Desktop Actions */}
        <div className={styles.desktopActions}>
          <Link href="/area-cliente" className={styles.navLink} style={{ fontSize: '0.9rem' }}>
            Área do Cliente
          </Link>
          <Link href="/agendamento" className="btn-primary">
            Agendar Consulta
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <motion.button
          className={styles.hamburgerBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <X size={24} />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Menu size={24} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`${styles.mobileMenu} glass`}
            initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top' }}
          >
            <div className={styles.mobileNav}>
              <Link href="/#sobre" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
                Sobre Nós
              </Link>
              <Link href="/#especialidades" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
                Especialidades
              </Link>
              <Link href="/#contato" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
                Contato
              </Link>
              <hr className={styles.divider} />
              <Link href="/area-cliente" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
                Área do Cliente
              </Link>
              <Link
                href="/agendamento"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={() => setIsOpen(false)}
              >
                Agendar Consulta
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
