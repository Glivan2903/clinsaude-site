'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Camera, CalendarDays, MessageCircle, Bot } from 'lucide-react';
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

  return (
    <nav className={styles.sidebar}>
      <div className={styles.marca}>
        <span className={styles.marcaNome}>Clin+Saúde</span>
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
    </nav>
  );
}
