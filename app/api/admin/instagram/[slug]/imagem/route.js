import { NextResponse } from 'next/server';
import { getRascunho } from '@/lib/instagram';
import { gerarImagemFundoIA, salvarImagemFundo, PROVEDORES_IMAGEM } from '@/lib/instagramImagens';

// Gera (ou regenera) as duas imagens de fundo por IA para um rascunho, sob
// clique do admin em /admin/instagram — nada é gerado automaticamente pelo
// cron, exatamente para controlar quando o custo/tempo de geração acontece.
export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const provedor = PROVEDORES_IMAGEM.includes(body.provedor) ? body.provedor : 'gemini';

  const rascunho = await getRascunho(slug);
  if (!rascunho) {
    return NextResponse.json({ success: false, error: 'Rascunho não encontrado.' }, { status: 404 });
  }

  try {
    const [imagemFeed, imagemStories] = await Promise.all([
      gerarImagemFundoIA(rascunho.tema, 'feed', provedor),
      gerarImagemFundoIA(rascunho.tema, 'stories', provedor),
    ]);

    await Promise.all([
      salvarImagemFundo(slug, 'feed', imagemFeed),
      salvarImagemFundo(slug, 'stories', imagemStories),
    ]);

    return NextResponse.json({ success: true, geradoEm: Date.now(), provedor });
  } catch (err) {
    console.error(`Falha ao gerar imagem de Instagram (${provedor}) para "${rascunho.tema}":`, err);
    const mensagem = err?.error?.message || err?.message || 'Falha ao gerar imagem.';
    return NextResponse.json({ success: false, error: mensagem }, { status: 502 });
  }
}
