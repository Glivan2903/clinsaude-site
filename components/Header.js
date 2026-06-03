'use client';

import { useState } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={styles.header}>
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
          <Link href="/area-cliente" className={styles.navLink} style={{ fontSize: '0.925rem' }}>
            Área do Cliente
          </Link>
          <Link href="/agendamento" className="btn-primary">
            Agendar Consulta
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className={styles.hamburgerBtn} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className={`${styles.mobileMenu} glass`}>
          <div className={styles.mobileNav}>
            <Link 
              href="/#sobre" 
              className={styles.mobileNavLink} 
              onClick={() => setIsOpen(false)}
            >
              Sobre Nós
            </Link>
            <Link 
              href="/#especialidades" 
              className={styles.mobileNavLink} 
              onClick={() => setIsOpen(false)}
            >
              Especialidades
            </Link>
            <Link 
              href="/#contato" 
              className={styles.mobileNavLink} 
              onClick={() => setIsOpen(false)}
            >
              Contato
            </Link>
            <hr className={styles.divider} />
            <Link 
              href="/area-cliente" 
              className={styles.mobileNavLink} 
              onClick={() => setIsOpen(false)}
            >
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
        </div>
      )}
    </header>
  );
}
