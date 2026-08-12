import { NextResponse } from 'next/server';
import { UNIDADES_INFO } from '../../../../../../lib/unidadesInfo';
import { configurarWebhook, getInstanciaUazapi } from '../../../../../../lib/uazapi';

export async function POST(request, { params }) {
  const { unidade } = await params;
  if (!UNIDADES_INFO.some((u) => u.id === unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade inválida.' }, { status: 404 });
  }
  if (!getInstanciaUazapi(unidade)) {
    return NextResponse.json({ success: false, error: 'Unidade sem instância UAZAPI configurada.' }, { status: 400 });
  }

  const secret = process.env.UAZAPI_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'Configure UAZAPI_WEBHOOK_SECRET no ambiente antes de configurar o webhook.' },
      { status: 400 }
    );
  }

  // Mesma origem que serviu esta requisição — funciona tanto no domínio de
  // produção quanto em previews da Vercel, sem precisar de env extra.
  const origem = new URL(request.url).origin;
  const webhookUrl = `${origem}/api/whatsapp/${unidade}/webhook?secret=${encodeURIComponent(secret)}`;

  try {
    await configurarWebhook(unidade, webhookUrl);
    return NextResponse.json({ success: true, webhookUrl });
  } catch (error) {
    console.error(`Erro ao configurar webhook da UAZAPI (${unidade}):`, error);
    return NextResponse.json({ success: false, error: 'Não foi possível configurar o webhook.' }, { status: 502 });
  }
}
