import { Users } from 'lucide-react';
import AdminNav from '@/components/AdminNav';
import AdminHeader from '@/components/AdminHeader';
import AdminProfissionaisList from '@/components/AdminProfissionaisList';
import { getProfissionaisUnificados } from '@/lib/profissionais';
import { getStatusParaSlugs } from '@/lib/profissionaisStatus';
import { getAliasParaSlugs } from '@/lib/profissionaisAlias';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel - Clin+Saúde',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const profissionais = await getProfissionaisUnificados();
  const slugs = profissionais.map((p) => p.slug);
  const [statusInicial, aliasInicial] = await Promise.all([
    getStatusParaSlugs(slugs),
    getAliasParaSlugs(slugs),
  ]);

  return (
    <div className={styles.shell}>
      <AdminNav />
      <div className={styles.main}>
        <AdminHeader icon={Users} title="Links de agendamento por profissional" />
        <div className={styles.content}>
          <AdminProfissionaisList
            profissionais={profissionais}
            statusInicial={statusInicial}
            aliasInicial={aliasInicial}
          />
        </div>
      </div>
    </div>
  );
}
