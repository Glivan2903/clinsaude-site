import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ChatInterface from '../../components/chat/ChatInterface';
import { FEATURE_CHAT } from '../../lib/featureFlags';
import styles from './chat.module.css';

export const metadata = {
  title: 'Fale com a Sofia - Clínica Clin+Saúde',
  description: 'Converse com a Sofia, atendente virtual da Clin+Saúde, e agende, remarque ou cancele consultas.',
};

export default function ChatPage() {
  if (!FEATURE_CHAT) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.backLink} aria-label="Voltar para a home">
          <ArrowLeft size={20} />
        </Link>
        <div className={styles.topBarInfo}>
          <div className={styles.avatar}>S</div>
          <div>
            <span className={styles.title}>Sofia</span>
            <span className={styles.subtitle}>
              <span className={styles.onlineDot} /> Clin+Saúde
            </span>
          </div>
        </div>
        <span className={styles.topBarSpacer} />
      </header>

      <ChatInterface className={styles.chatArea} />
    </main>
  );
}
