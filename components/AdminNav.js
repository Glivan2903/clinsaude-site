'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Camera, CalendarDays, MessageCircle, Bot, Menu, X } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';
import AdminLogoutButton from './AdminLogoutButton';
import styles from './AdminNav.module.css';
import { FEATURE_INSTAGRAM, FEATURE_CALENDARIO, FEATURE_WHATSAPP } from '../lib/featureFlags';

const ITENS = [
  { href: '/admin', label: 'Profissionais', Icon: Users },
  ...(FEATURE_INSTAGRAM ? [{ href: '/admin/instagram', label: 'Instagram', Icon: Camera }] : []),
  ...(FEATURE_CALENDARIO ? [{ href: '/admin/calendario', label: 'Calendário', Icon: CalendarDays }] : []),
  ...(FEATURE_WHATSAPP ? [{ href: '/admin/whatsapp', label: 'Whatsapp', Icon: MessageCircle }] : []),
  { href: '/admin/prompt', label: 'IA da Sofia', Icon: Bot },
];

export default function AdminNav() {
  const pathname = usePathname();
  const rootRef = useRef(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.item}`, { opacity: 0, x: -10, stagger: 0.05, duration: 0.4 });
      });
    },
    { scope: rootRef }
  );

  useEffect(() => {
    if (!menuAberto) return;
    function aoTeclar(e) {
      if (e.key === 'Escape') setMenuAberto(false);
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  // Fecha o menu sozinho ao trocar de página (clique num item do drawer).
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop: sidebar fixa na lateral. */}
      <nav ref={rootRef} className={styles.sidebar}>
        <div className={styles.marca}>
          <img src="/logo.png" alt="Clin+Saúde" className={styles.marcaLogo} />
          <span className={styles.marcaSub}>Painel administrativo</span>
        </div>
        <div className={styles.itens}>
          {ITENS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`${styles.item} ${pathname === href ? styles.itemAtivo : ''}`}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
        <div className={styles.rodape}>
          <AdminLogoutButton />
        </div>
      </nav>

      {/* Mobile: barra fina com logo + hambúrguer, sem repetir o nome da
          página (o item ativo no menu já mostra onde você está). */}
      <div className={styles.barraMobile}>
        <img src="/logo.png" alt="Clin+Saúde" className={styles.marcaLogoMobile} />
        <button
          type="button"
          className={styles.hamburguerBtn}
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
        >
          <Menu size={20} />
        </button>
      </div>

      {menuAberto && (
        <div className={styles.overlay} role="presentation" onClick={() => setMenuAberto(false)}>
          <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Menu do painel" onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.marcaSub}>Painel administrativo</span>
              <button type="button" className={styles.fecharBtn} onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
                <X size={20} />
              </button>
            </div>
            <div className={styles.drawerItens}>
              {ITENS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.drawerItem} ${pathname === href ? styles.itemAtivo : ''}`}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
            <div className={styles.drawerRodape}>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
