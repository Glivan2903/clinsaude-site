import AdminProfissionaisList from '@/components/AdminProfissionaisList';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import { getTodosProfissionais } from '@/lib/profissionais';
import { getStatusParaSlugs } from '@/lib/profissionaisStatus';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel - Clin+Saúde',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const profissionais = await getTodosProfissionais();
  const statusInicial = await getStatusParaSlugs(profissionais.map((p) => p.slug));

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Links de agendamento por profissional</h1>
        <AdminLogoutButton />
      </div>
      <div className={styles.content}>
        <AdminProfissionaisList profissionais={profissionais} statusInicial={statusInicial} />
      </div>
    </div>
  );
}
