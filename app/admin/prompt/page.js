import { Bot } from 'lucide-react';
import AdminNav from '@/components/AdminNav';
import AdminHeader from '@/components/AdminHeader';
import AdminPromptForm from '@/components/AdminPromptForm';
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
        <AdminHeader icon={Bot} title="IA da Sofia" />
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
