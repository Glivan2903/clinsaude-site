import { notFound } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import { listarProximasPostagens } from '@/lib/proximasPostagens';
import { FEATURE_CALENDARIO } from '@/lib/featureFlags';
import styles from '../page.module.css';
import calStyles from './calendario.module.css';

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
        <div className={styles.header}>
          <h1 className={styles.title}>Próximas datas e postagens</h1>
          <AdminLogoutButton />
        </div>
        <div className={styles.content}>
          {proximasPostagens.length === 0 ? (
            <p>Nenhuma data comemorativa nos próximos meses.</p>
          ) : (
            <div className={calStyles.lista}>
              {proximasPostagens.map((dia) => (
                <div key={dia.timestamp} className={calStyles.diaCard}>
                  <span className={calStyles.data}>{dia.data}</span>
                  <ul className={calStyles.temasList}>
                    {dia.temas.map((t) => (
                      <li key={t.slug} className={calStyles.temaItem}>
                        <span className={calStyles.temaTexto}>{t.tema}</span>
                        <span className={calStyles.badges}>
                          <span className={`${calStyles.badge} ${t.blogExiste ? calStyles.badgeOk : ''}`}>
                            Blog{t.blogExiste ? ' ✓' : ''}
                          </span>
                          <span className={`${calStyles.badge} ${t.instagramExiste ? calStyles.badgeOk : ''}`}>
                            Instagram{t.instagramExiste ? ' ✓' : ''}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
