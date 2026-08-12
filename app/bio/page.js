import Link from "next/link";
import { Globe, CalendarDays, Users, MessageCircle } from "lucide-react";
import {
  CLINIC_WHATSAPP_URL_MATRIZ,
  CLINIC_WHATSAPP_URL_FILIAL,
} from "../../lib/config";
import { FEATURE_PROFISSIONAIS, FEATURE_AGENDAMENTO } from "../../lib/featureFlags";
import styles from "./page.module.css";

export const metadata = {
  title: "Clin+Saúde | Links",
  description: "Site, agendamento, profissionais e WhatsApp da Clin+Saúde em um só lugar.",
};

const links = [
  { href: "/", label: "Conheça o site", icon: Globe },
  ...(FEATURE_AGENDAMENTO ? [{ href: "/agendamento", label: "Agendar consulta", icon: CalendarDays }] : []),
  ...(FEATURE_PROFISSIONAIS ? [{ href: "/medicos", label: "Nossos profissionais", icon: Users }] : []),
  {
    href: CLINIC_WHATSAPP_URL_MATRIZ,
    label: "WhatsApp — Unidade Matriz",
    icon: MessageCircle,
    external: true,
  },
  {
    href: CLINIC_WHATSAPP_URL_FILIAL,
    label: "WhatsApp — Unidade Filial",
    icon: MessageCircle,
    external: true,
  },
];

export default function BioPage() {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <img src="/logo.png" alt="Clin+Saúde" className={styles.logo} />
        <h1 className={styles.title}>Sua saúde em boas mãos.</h1>

        <nav className={styles.links}>
          {links.map(({ href, label, icon: Icon, external }) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkButton}
              >
                <Icon size={20} className={styles.linkIcon} />
                <span>{label}</span>
              </a>
            ) : (
              <Link key={label} href={href} className={styles.linkButton}>
                <Icon size={20} className={styles.linkIcon} />
                <span>{label}</span>
              </Link>
            )
          )}
        </nav>

        <p className={styles.footer}>@clinmaissaude_se</p>
      </div>
    </main>
  );
}
