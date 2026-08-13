import { NextResponse } from 'next/server';
import { FEATURE_WHATSAPP } from '../../../../lib/featureFlags';
import { getInstanciasConfiguradas, getStatus, configurarWebhook, montarWebhookUrl, resolverOrigemWebhook } from '../../../../lib/uazapi';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Reforça a configuração do webhook de cada unidade conectada, mesmo sem
// ninguém com o painel /admin/whatsapp aberto — a automação em
// components/AdminWhatsappPanel.js (iniciarQrPolling/conectar) só reconfigura
// enquanto o admin está com o modal de conexão aberto; se a instância cair e
// voltar sozinha depois disso, nada mais reconfigura o webhook na UAZAPI.
// Idempotente: reconfigurar mesmo já correto não tem efeito colateral.
export async function GET(request) {
  if (!FEATURE_WHATSAPP) {
    return NextResponse.json({ error: 'Feature Whatsapp desativada (NEXT_PUBLIC_FEATURE_WHATSAPP=false).' }, { status: 404 });
  }

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
  }

  const origem = resolverOrigemWebhook(request.url);

  const reconfigurados = [];
  const falhas = [];

  for (const { id } of getInstanciasConfiguradas()) {
    try {
      const status = await getStatus(id);
      if (!status.conectado) continue;

      const webhookUrl = montarWebhookUrl(origem, id);
      if (!webhookUrl) {
        falhas.push({ id, erro: 'UAZAPI_WEBHOOK_SECRET não configurado.' });
        continue;
      }

      await configurarWebhook(id, webhookUrl);
      reconfigurados.push(id);
    } catch (error) {
      console.error(`Erro ao reconfigurar webhook do Whatsapp (${id}):`, error);
      falhas.push({ id, erro: error.message });
    }
  }

  return NextResponse.json({ reconfigurados, falhas });
}
