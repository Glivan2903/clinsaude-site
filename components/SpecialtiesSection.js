import styles from './SpecialtiesSection.module.css';
import { Heart, Brain, Baby, Activity, Eye, Stethoscope } from 'lucide-react';

const specialties = [
  { id: 1, name: 'Clínica Geral', icon: Stethoscope },
  { id: 2, name: 'Cardiologia', icon: Heart },
  { id: 3, name: 'Pediatria', icon: Baby },
  { id: 4, name: 'Psiquiatria & Psicologia', icon: Brain },
  { id: 5, name: 'Exames de Imagem', icon: Activity },
  { id: 6, name: 'Dermatologia', icon: Eye }, // just an icon placeholder
];

export default function SpecialtiesSection() {
  return (
    <section id="especialidades" className={`section ${styles.sectionBg}`}>
      <div className="container">
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <h2>Nossas <span className="gradient-text">Especialidades</span></h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Ampla variedade de serviços médicos e exames para atender sua família.</p>
        </div>
        
        <div className={styles.grid}>
          {specialties.map((spec) => (
            <div key={spec.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                <spec.icon size={32} />
              </div>
              <h3 className={styles.cardTitle}>{spec.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
