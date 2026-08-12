import OpenAI from 'openai';
import { buildSystemPrompt } from './chatSystemPrompt';
import { executeTool, toolDefinitions } from './chatTools';
import { OPENAI_MODEL, MAX_TOOL_ROUNDS } from './config';

export const SOFIA_FALLBACK_REPLY =
  'Ops, tive um probleminha aqui. Pode tentar de novo? Se preferir, fala com a gente pelo WhatsApp (79) 99989-6288.';

// historico: mensagens já sanitizadas (role user/assistant/tool), SEM a
// mensagem system — esta função monta e injeta a dela própria, com `today`.
// Nunca lança: erros de OpenAI/tool sempre resolvem para um reply de fallback
// (ok:false), para que tanto o chat do site quanto o webhook do WhatsApp
// possam confiar que sempre recebem algo para mostrar/enviar ao usuário.
export async function runSofiaTurn(historico, { today = new Date() } = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY não configurada.');
    return { reply: SOFIA_FALLBACK_REPLY, historico: [], ok: false };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const systemMessage = { role: 'system', content: await buildSystemPrompt({ today }) };
    const conversation = [systemMessage, ...(historico || [])];

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
        return { reply: message.content || '', historico: conversation.slice(1), ok: true };
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

    // Tool-round budget exhausted: força uma resposta final sem tools.
    const finalCompletion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: conversation,
      tool_choice: 'none',
      max_tokens: 300,
    });
    const finalMessage = finalCompletion.choices[0].message;
    conversation.push(finalMessage);

    return { reply: finalMessage.content || SOFIA_FALLBACK_REPLY, historico: conversation.slice(1), ok: true };
  } catch (error) {
    console.error('Erro no motor da Sofia:', error);
    return { reply: SOFIA_FALLBACK_REPLY, historico: historico || [], ok: false };
  }
}
