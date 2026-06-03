import styles from './Footer.module.css';
import { MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="contato" className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        <div>
          <img src="/logo.png" alt="Clin+Saúde" style={{ height: "42px", objectFit: "contain", marginBottom: "1.25rem", display: "block" }} />
          <p className={styles.description}>
            Cuidando da sua saúde com excelência e profissionalismo desde 2015.
          </p>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/clinmaissaude_se/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          </div>
        </div>
        
        <div>
          <h4 className={styles.heading}>Links Úteis</h4>
          <ul className={styles.linksList}>
            <li><Link href="#sobre">Sobre Nós</Link></li>
            <li><Link href="#especialidades">Especialidades</Link></li>
            <li><Link href="/agendamento">Agendar Consulta</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className={styles.heading}>Contato</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <MapPin size={20} className={styles.icon} />
              <div>
                <span style={{ fontWeight: "600", color: "var(--foreground)" }}>Unidade Matriz:</span><br />
                <span>Rua Bahia, 998 - Siqueira Campos, Aracaju - SE</span>
              </div>
            </li>
            <li className={styles.contactItem}>
              <MapPin size={20} className={styles.icon} />
              <div>
                <span style={{ fontWeight: "600", color: "var(--foreground)" }}>Unidade Filial:</span><br />
                <span>Rua Bahia, 928 - Siqueira Campos, Aracaju - SE</span>
              </div>
            </li>
            <li className={styles.contactItem}>
              <Phone size={20} className={styles.icon} />
              <span>(79) 99989-6288</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className={styles.bottom}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Clin+Saúde. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
