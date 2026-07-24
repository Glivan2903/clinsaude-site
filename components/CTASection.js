'use client';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section
      id="agendamento"
      className="section container"
      style={{ marginTop: '-3rem', position: 'relative', zIndex: 10 }}
    >
      <motion.div
        className="glass text-center"
        style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.h2
          style={{ marginBottom: '0.875rem', color: 'var(--primary-color)', fontSize: '1.75rem', letterSpacing: '-0.01em' }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Agende sua Consulta ou Exame Online
        </motion.h2>
        <motion.p
          style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '560px', margin: '0 auto 2rem', lineHeight: '1.65' }}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Marque seu atendimento de forma rápida e segura. Escolha o especialista, convênio e horário que melhor se adaptam à sua rotina.
        </motion.p>
        <motion.div
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'inline-block' }}
        >
          <Link href="/agendamento" className="btn-primary">
            Agendar Agora
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
