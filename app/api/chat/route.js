import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../../../lib/chatSystemPrompt';
import { executeTool, toolDefinitions } from '../../../lib/chatTools';
import { OPENAI_MODEL, MAX_TOOL_ROUNDS } from '../../../lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const FALLBACK_REPLY =
  'Ops, tive um probleminha aqui. Pode tentar de novo? Se preferir, fala com a gente pelo WhatsApp (79) 99989-6288.';

function sanitizeIncomingMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m === 'object' && m.role !== 'system')
    .map((m) => {
      // Only forward fields OpenAI's Chat Completions API actually accepts.
      const { role, content, tool_calls, tool_call_id, name } = m;
      const out = { role, content: content ?? null };
      if (tool_calls) out.tool_calls = tool_calls;
      if (tool_call_id) out.tool_call_id = tool_call_id;
      if (name) out.name = name;
      return out;
    });
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY não configurada.');
    return NextResponse.json({ reply: FALLBACK_REPLY, messages: [] }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const incoming = sanitizeIncomingMessages(body?.messages);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemMessage = { role: 'system', content: buildSystemPrompt({ today: new Date() }) };
  const conversation = [systemMessage, ...incoming];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: conversation,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_tokens: 300,
      });

      const message = completion.choices[0].message;
      conversation.push(message);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json({
          reply: message.content || '',
          messages: conversation.slice(1),
        });
      }

      for (const toolCall of message.tool_calls) {
        let result;
        try {
          const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
          result = await executeTool(toolCall.function.name, args);
        } catch (err) {
          result = { erro: err.message || 'Falha ao executar a ferramenta.' };
        }
        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Tool-round budget exhausted: force a final, tool-free answer.
    const finalCompletion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: conversation,
      tool_choice: 'none',
      max_tokens: 300,
    });
    const finalMessage = finalCompletion.choices[0].message;
    conversation.push(finalMessage);

    return NextResponse.json({
      reply: finalMessage.content || FALLBACK_REPLY,
      messages: conversation.slice(1),
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    return NextResponse.json({ reply: FALLBACK_REPLY, messages: incoming }, { status: 500 });
  }
}
