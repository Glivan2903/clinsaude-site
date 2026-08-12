import { notFound } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import AdminWhatsappPanel from '@/components/AdminWhatsappPanel';
import { UNIDADES_INFO } from '@/lib/unidadesInfo';
import { getStatus, getInstanciaUazapi } from '@/lib/uazapi';
import { FEATURE_WHATSAPP } from '@/lib/featureFlags';
import styles from '../page.module.css';
import wa from './whatsapp.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Whatsapp - Painel Clin+Saúde',
  robots: { index: false, follow: false },
};

async function getUnidadesComStatus() {
  return Promise.all(
    UNIDADES_INFO.map(async ({ id, nome }) => {
      if (!getInstanciaUazapi(id)) {
        return { id, nome, configurada: false };
      }
      try {
        const status = await getStatus(id);
        return { id, nome, configurada: true, ...status };
      } catch (error) {
        console.error(`Erro ao consultar status inicial da UAZAPI (${id}):`, error);
        return { id, nome, configurada: true, conectado: false, estado: 'erro' };
      }
    })
  );
}

export default async function AdminWhatsappPage() {
  if (!FEATURE_WHATSAPP) notFound();

  const unidades = await getUnidadesComStatus();

  return (
    <div className={styles.shell}>
      <AdminNav />
      <div className={styles.main}>
        <div className={wa.content}>
          <AdminWhatsappPanel unidadesIniciais={unidades} />
        </div>
      </div>
    </div>
  );
}
