import styles from './AboutSection.module.css';
import { MapPin, Clock, Phone } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="sobre" className="section container">
      <div className={styles.grid}>
        <div className={styles.imageContainer}>
          <div className={styles.imagePlaceholder}>
            {/* Generate Image Placeholder */}
            <div className={styles.imageText}>Clínica Moderna e Equipada</div>
          </div>
        </div>
        <div className={styles.content}>
          <h2 className={styles.title}>Tradição e Cuidado em <span className="gradient-text">Aracaju</span></h2>
          <p className={styles.description}>
            A Clin+Saúde nasceu com o propósito de oferecer medicina de qualidade com atendimento humanizado. Cuidando da sua saúde com excelência e profissionalismo desde 2015.
          </p>
          
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <MapPin size={24} />
              </div>
              <div>
                <h4 className={styles.infoTitle}>Unidade Matriz</h4>
                <p className={styles.infoText}>
                  Rua Bahia, 998 - Siqueira Campos, Aracaju - SE<br />
                  <strong>Contato:</strong> (79) 99989-6288
                </p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <MapPin size={24} />
              </div>
              <div>
                <h4 className={styles.infoTitle}>Unidade Filial</h4>
                <p className={styles.infoText}>
                  Rua Bahia, 928 - Siqueira Campos, Aracaju - SE<br />
                  <strong>Contato:</strong> (79) 99989-6288
                </p>
              </div>
            </div>
            
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <Clock size={24} />
              </div>
              <div>
                <h4 className={styles.infoTitle}>Horário de Funcionamento</h4>
                <p className={styles.infoText}>
                  Segunda a Sexta: 06h às 16h<br />
                  Sábado: 06h às 12h<br />
                  Domingo e Feriados: Fechado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
