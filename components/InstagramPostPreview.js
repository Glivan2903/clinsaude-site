'use client';

import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import styles from './InstagramPostPreview.module.css';

export default function InstagramPostPreview({ imagemFeedSrc, imagemStoriesSrc, legenda }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bloco}>
        <span className={styles.rotulo}>Prévia — Feed</span>
        <div className={styles.postCard}>
          <div className={styles.postHeader}>
            <img src="/logo.png" alt="" className={styles.avatar} />
            <div className={styles.postHeaderTexto}>
              <span className={styles.username}>clinmaissaude_se</span>
              <span className={styles.local}>Aracaju, Sergipe</span>
            </div>
          </div>
          <img src={imagemFeedSrc} alt="Prévia da imagem do feed" className={styles.postImagem} />
          <div className={styles.postAcoes}>
            <div className={styles.postAcoesEsquerda}>
              <Heart size={22} />
              <MessageCircle size={22} />
              <Send size={22} />
            </div>
            <Bookmark size={22} />
          </div>
          <p className={styles.postLegenda}>
            <span className={styles.username}>clinmaissaude_se</span> {legenda}
          </p>
        </div>
      </div>

      <div className={styles.bloco}>
        <span className={styles.rotulo}>Prévia — Stories</span>
        <div className={styles.storiesFrame}>
          <div className={styles.storiesBarra} />
          <div className={styles.storiesHeader}>
            <img src="/logo.png" alt="" className={styles.storiesAvatar} />
            <span className={styles.storiesUsername}>clinmaissaude_se</span>
          </div>
          <img src={imagemStoriesSrc} alt="Prévia da imagem do stories" className={styles.storiesImagem} />
        </div>
      </div>
    </div>
  );
}
