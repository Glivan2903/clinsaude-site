import AdminLogoutButton from './AdminLogoutButton';
import styles from './AdminHeader.module.css';

// Cabeçalho compartilhado por toda página do admin — antes cada page.js
// remontava o mesmo <h1>+botão Sair na mão; centralizado aqui pra manter a
// tipografia (fonte de heading) e o selo do ícone consistentes em todo lugar.
export default function AdminHeader({ icon: Icon, title }) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        {Icon && (
          <span className={styles.iconBadge}>
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
      <AdminLogoutButton />
    </div>
  );
}
