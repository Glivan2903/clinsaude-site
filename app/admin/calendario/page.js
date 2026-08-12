import { notFound } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import AdminNav from '@/components/AdminNav';
import AdminHeader from '@/components/AdminHeader';
import AdminCalendarioLista from '@/components/AdminCalendarioLista';
import { listarProximasPostagens } from '@/lib/proximasPostagens';
import { FEATURE_CALENDARIO } from '@/lib/featureFlags';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Calendário - Painel Clin+Saúde',
  robots: { index: false, follow: false },
};

export default async function AdminCalendarioPage() {
  if (!FEATURE_CALENDARIO) notFound();

  const proximasPostagens = await listarProximasPostagens();

  return (
    <div className={styles.shell}>
      <AdminNav />
      <div className={styles.main}>
        <AdminHeader icon={CalendarDays} title="Próximas datas e postagens" />
        <div className={styles.content}>
          <AdminCalendarioLista proximasPostagens={proximasPostagens} />
        </div>
      </div>
    </div>
  );
}
