import AdminNav from '@/components/AdminNav';
import AdminPromptForm from '@/components/AdminPromptForm';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import { getPromptConfig, TAMANHO_MAX_CAMPO } from '@/lib/promptConfig';
import { buildPromptHeader, DEFAULT_PROMPT_BODY, SECURITY_RULES_TEXT } from '@/lib/chatSystemPrompt';
import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'IA da Sofia - Painel Clin+Saúde',
  robots: { index: false, follow: false },
};

export default async function AdminPromptPage() {
  const config = await getPromptConfig();
  const corpoAtual = config.corpoPrompt?.trim() ? config.corpoPrompt : DEFAULT_PROMPT_BODY;

  return (
    <div className={styles.shell}>
      <AdminNav />
      <div className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>IA da Sofia</h1>
          <AdminLogoutButton />
        </div>
        <div className={styles.content}>
          <AdminPromptForm
            corpoInicial={corpoAtual}
            corpoPadrao={DEFAULT_PROMPT_BODY}
            atualizadoEmInicial={config.atualizadoEm}
            personalizado={Boolean(config.corpoPrompt?.trim())}
            tamanhoMaximo={TAMANHO_MAX_CAMPO}
            cabecalhoExemplo={buildPromptHeader({})}
            regrasSeguranca={SECURITY_RULES_TEXT}
          />
        </div>
      </div>
    </div>
  );
}
