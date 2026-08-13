import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { listarPosts } from "../../lib/blog";
import { FEATURE_BLOG } from "../../lib/featureFlags";
import { getUnidadesFooterProps } from "../../lib/unidades";
import styles from "./blog.module.css";

// Novos posts são gerados automaticamente todo dia (ver app/api/cron/blog),
// então a página não pode ser servida a partir de um cache estático.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Blog - Clínica ClinSaúde",
  description: "Conteúdos sobre datas e campanhas de saúde, com dicas de prevenção e cuidado da Clin+Saúde.",
};

function formatarData(timestamp) {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPage() {
  if (!FEATURE_BLOG) notFound();

  const posts = await listarPosts();

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <section className="pageSection container">
        <span className="eyebrow" style={{ marginBottom: "0.75rem" }}>Blog</span>
        <h1 className="responsiveTitle" style={{ marginBottom: "1.5rem" }}>
          Saúde em dia: datas e cuidados
        </h1>

        {posts.length === 0 ? (
          <p className={styles.vazio}>
            Ainda não há posts publicados. Volte em breve — todo dia com uma
            data de saúde relevante, um novo conteúdo aparece por aqui.
          </p>
        ) : (
          <div className={styles.grid}>
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
                <span className={styles.data}>{formatarData(post.publicadoEm)}</span>
                <h2 className={styles.titulo}>{post.titulo}</h2>
                {post.resumo && <p className={styles.resumo}>{post.resumo}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer {...getUnidadesFooterProps()} />
    </main>
  );
}
