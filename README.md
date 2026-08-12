Site institucional e painel administrativo da Clin+Saúde (Next.js). Inclui chat com IA (Sofia) no site e no WhatsApp (via UAZAPI), agendamento online, blog e Instagram automatizados.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O painel admin fica em `/admin` (senha em `ADMIN_PASSWORD`, ver abaixo).

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha o que for necessário para a área que for testar — o projeto liga cada integração de forma independente; sem a env var, aquela feature específica só fica desativada (não quebra o resto do site):

| Variável | Para quê |
| --- | --- |
| `API_BASE_URL_MATRIZ` / `API_BASE_URL_FILIAL` | Backend ClinVida de cada unidade (agendamento real) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Chat da Sofia (site e WhatsApp) e geração de conteúdo do blog/Instagram |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | Login do painel `/admin` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Persistência (blog, Instagram, conversas do WhatsApp). Obrigatório em produção para o WhatsApp funcionar corretamente entre múltiplas invocações serverless |
| `GEMINI_API_KEY` | Geração de imagem do Instagram (alternativa à OpenAI) |
| `CRON_SECRET` | Protege as rotas `/api/cron/*` (chamadas só pelo Vercel Cron) |
| `UAZAPI_BASE_URL_<UNIDADE>` / `UAZAPI_TOKEN_<UNIDADE>` | Instância WhatsApp de cada unidade (Matriz/Filial), já criada na UAZAPI |
| `UAZAPI_WEBHOOK_SECRET` | Segredo compartilhado que valida o webhook do WhatsApp (qualquer string aleatória) |
| `NEXT_PUBLIC_FEATURE_BLOG` / `NEXT_PUBLIC_FEATURE_INSTAGRAM` / `NEXT_PUBLIC_FEATURE_CALENDARIO` / `NEXT_PUBLIC_FEATURE_WHATSAPP` / `NEXT_PUBLIC_FEATURE_CHAT` / `NEXT_PUBLIC_FEATURE_PROFISSIONAIS` / `NEXT_PUBLIC_FEATURE_AGENDAMENTO` | Liga (`true`, padrão) ou desliga (`false`) cada funcionalidade por completo — página pública, seção do admin, link de navegação e cron/rota correspondentes (ver `lib/featureFlags.js`). `AGENDAMENTO` desliga só a marcação de consulta NOVA pelo site; não afeta a Área do Cliente |
| `NEXT_PUBLIC_FEATURE_WHATSAPP_INBOX` | Com `false`, `/admin/whatsapp` mostra só a configuração de conexão de cada unidade (QR code/pairing code/webhook) — sem o inbox de conversas (lista, chat, envio manual, filtros) |

## Testando o WhatsApp (Sofia) localmente

O fluxo de mensagens do WhatsApp depende de a UAZAPI conseguir chamar de volta um webhook (`/api/whatsapp/<unidade>/webhook`). Em produção isso é o domínio público normal; em desenvolvimento local, `localhost:3000` não é alcançável pela internet — é preciso expor a porta com um túnel.

### 1. Expor o localhost com um túnel

Não precisa instalar nada fixo: use `npx` para rodar um túnel temporário (ex.: [localtunnel](https://github.com/localtunnel/localtunnel)):

```bash
npx --yes localtunnel --port 3000
```

Isso imprime uma URL pública temporária, ex.: `https://algo-aleatorio.loca.lt`. **Ela muda a cada execução** e o processo pode cair sozinho de tempos em tempos (é um serviço gratuito) — se o webhook parar de chegar, rode o comando de novo e repita o passo 2 com a nova URL.

> Se preferir, use [ngrok](https://ngrok.com/) (precisa de conta/authtoken) no lugar do localtunnel — o restante do fluxo é igual, só troca a URL gerada.

### 2. Apontar o webhook da UAZAPI para o túnel

Mais fácil: em `/admin/whatsapp`, abra a unidade e clique em **Configurar webhook** — o próprio painel monta a URL certa (usando o endereço pelo qual você está acessando o admin, seja o túnel local ou o domínio de produção) e registra na UAZAPI. Repita sempre que a URL do túnel mudar.

Se preferir registrar manualmente (ou pra debugar), para cada unidade com instância conectada, registre a URL do túnel + o `UAZAPI_WEBHOOK_SECRET` do seu `.env`:

```bash
curl -X POST \
  -H "token: SEU_UAZAPI_TOKEN_DA_UNIDADE" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "https://SUA-URL-DO-TUNEL.loca.lt/api/whatsapp/matriz/webhook?secret=SEU_UAZAPI_WEBHOOK_SECRET",
    "events": [],
    "excludeMessages": [],
    "addUrlEvents": false,
    "addUrlTypesMessages": false
  }' \
  https://SUA_BASE_URL_DA_UAZAPI/webhook
```

Troque `matriz` pelo id da unidade (`matriz` ou `filial`) e ajuste a URL base/token para a instância certa.

### 3. Conectar o número

Acesse `/admin/whatsapp` (logado no painel), clique em **Conectar / Gerar QR code** e escaneie com o WhatsApp que vai representar a clínica naquela unidade. O status na tela atualiza automaticamente quando conectar.

### 4. Testar

Mande uma mensagem de **outro número** (não o que escaneou o QR) para o WhatsApp conectado. A Sofia deve responder normalmente — funciona com texto e com áudio (nota de voz, transcrita automaticamente via Whisper). Mensagens em grupo são sempre ignoradas.

Se um atendente humano responder manualmente pelo mesmo número (direto no app/WhatsApp Web conectado), a Sofia fica em silêncio naquela conversa por ~60 minutos.

### Observações do ambiente de desenvolvimento

- Depois de reiniciar o `npm run dev`, o túnel anterior costuma cair — repita os passos 1 e 2.
- Se alguma rota da UAZAPI parecer travar por muito tempo (>20s) sem resposta, é um comportamento conhecido da API deles em paths desconhecidos — evite adivinhar endpoints novos sem antes checar a documentação/Swagger da própria conta.
- Se o `next dev` (Turbopack) parecer lento ou travado sem motivo aparente, apague a pasta `.next` e rode `npm run dev` novamente — o cache local às vezes fica inconsistente.

## Deploy

Deploy padrão via [Vercel](https://vercel.com). Configure todas as variáveis de ambiente do `.env.example` no painel do projeto antes de publicar. Os cron jobs (`/api/cron/*`) já estão declarados em `vercel.json`.
