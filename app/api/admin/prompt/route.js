import { NextResponse } from 'next/server';
import { salvarPromptConfig } from '@/lib/promptConfig';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido.' }, { status: 400 });
  }

  try {
    const config = await salvarPromptConfig({ corpoPrompt: body?.corpoPrompt });
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Erro ao salvar configuração do prompt da Sofia:', error);
    return NextResponse.json({ success: false, error: 'Não foi possível salvar.' }, { status: 502 });
  }
}
