import { notFound } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import AdminInstagramList from '@/components/AdminInstagramList';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import { listarRascunhos } from '@/lib/instagram';
import { existeImagemFundo } from '@/lib/instagramImagens';
import { FEATURE_INSTAGRAM } from '@/lib/featureFlags';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instagram - Painel Clin+Saúde',
  robots: { index: false, follow: false },
};

export default async function AdminInstagramPage() {
  if (!FEATURE_INSTAGRAM) notFound();

  const rascunhos = await listarRascunhos();
  const imagemGeradaInicial = Object.fromEntries(
    await Promise.all(rascunhos.map(async (r) => [r.slug, await existeImagemFundo(r.slug, 'feed')]))
  );

  return (
    <div className={styles.shell}>
      <AdminNav />
      <div className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Rascunhos do Instagram</h1>
          <AdminLogoutButton />
        </div>
        <div className={styles.content}>
          <AdminInstagramList rascunhosIniciais={rascunhos} imagemGeradaInicial={imagemGeradaInicial} />
        </div>
      </div>
    </div>
  );
}
