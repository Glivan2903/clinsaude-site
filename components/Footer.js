'use client';
import { motion } from 'motion/react';
import styles from './Footer.module.css';
import { MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

const colContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const colVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const instagramPath = 'M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.25-2.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2z';
const whatsappPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';

export default function Footer() {
  return (
    <footer id="contato" className={styles.footer}>
      <motion.div
        className={`container ${styles.footerGrid}`}
        variants={colContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={colVariant}>
          <img
            src="/logo.png"
            alt="Clin+Saúde"
            style={{ height: '38px', objectFit: 'contain', marginBottom: '1.25rem', display: 'block', filter: 'brightness(0) invert(1)' }}
          />
          <p className={styles.description}>
            Cuidando da sua saúde com excelência e profissionalismo desde 2015.
          </p>
          <div className={styles.socials}>
            <motion.a
              href="https://www.instagram.com/clinmaissaude_se/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Instagram da Clin+Saúde"
              whileHover={{ y: -3, scale: 1.1 }}
              transition={{ duration: 0.18 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d={instagramPath} />
              </svg>
            </motion.a>
            <motion.a
              href="https://wa.me/5579999896288"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="WhatsApp da Clin+Saúde"
              whileHover={{ y: -3, scale: 1.1 }}
              transition={{ duration: 0.18 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d={whatsappPath} />
              </svg>
            </motion.a>
          </div>
        </motion.div>

        <motion.div variants={colVariant}>
          <h4 className={styles.heading}>Links Úteis</h4>
          <ul className={styles.linksList}>
            <li><Link href="#sobre">Sobre Nós</Link></li>
            <li><Link href="#especialidades">Especialidades</Link></li>
            <li><Link href="/agendamento">Agendar Consulta</Link></li>
            <li><Link href="/area-cliente">Área do Cliente</Link></li>
          </ul>
        </motion.div>

        <motion.div variants={colVariant}>
          <h4 className={styles.heading}>Contato</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <MapPin size={18} className={styles.icon} />
              <div>
                <strong style={{ color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '0.2rem' }}>Unidade Matriz</strong>
                Rua Bahia, 998 — Siqueira Campos
              </div>
            </li>
            <li className={styles.contactItem}>
              <MapPin size={18} className={styles.icon} />
              <div>
                <strong style={{ color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '0.2rem' }}>Unidade Filial</strong>
                Rua Bahia, 928 — Siqueira Campos
              </div>
            </li>
            <li className={styles.contactItem}>
              <Phone size={18} className={styles.icon} />
              <span>(79) 99989-6288</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>

      <motion.div
        className={`container ${styles.bottom}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <p className={styles.bottomText}>
          &copy; {new Date().getFullYear()} Clin+Saúde. Todos os direitos reservados.
        </p>
        <motion.a
          href="https://wa.me/5579999896288"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappLink}
          whileHover={{ y: -2, scale: 1.04 }}
          transition={{ duration: 0.18 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d={whatsappPath} />
          </svg>
          Fale pelo WhatsApp
        </motion.a>
      </motion.div>
    </footer>
  );
}
