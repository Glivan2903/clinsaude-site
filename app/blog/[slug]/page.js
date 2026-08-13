import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { getPost } from "../../../lib/blog";
import { FEATURE_BLOG, FEATURE_AGENDAMENTO } from "../../../lib/featureFlags";
import { getUnidadesFooterProps } from "../../../lib/unidades";
import styles from "./page.module.css";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: `${post.titulo} - Blog Clin+Saúde`,
    description: post.resumo || post.titulo,
  };
}

function formatarData(timestamp) {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPostPage({ params }) {
  if (!FEATURE_BLOG) notFound();

  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const paragrafos = post.corpo.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <main className={styles.page}>
      <Header />

      <article className={`container ${styles.wrapper}`}>
        <span className={styles.tema}>{post.tema}</span>
        <h1 className={styles.titulo}>{post.titulo}</h1>
        <span className={styles.data}>{formatarData(post.publicadoEm)}</span>

        <div className={styles.corpo}>
          {paragrafos.map((paragrafo, i) => (
            <p key={i}>{paragrafo}</p>
          ))}
        </div>

        {FEATURE_AGENDAMENTO && (
          <Link href="/agendamento" className="btn-primary" style={{ marginTop: '2rem' }}>
            Agendar consulta
          </Link>
        )}
      </article>

      <Footer {...getUnidadesFooterProps()} />
    </main>
  );
}
