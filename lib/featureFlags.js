// Liga/desliga funcionalidades inteiras (página pública, seção do admin, link
// de navegação, cron e/ou rota de API correspondentes) via .env. Por padrão
// tudo fica ativado; definir a variável como "false" (ou "0") desativa.
//
// Prefixo NEXT_PUBLIC_ é necessário porque algumas dessas flags também são
// lidas em componentes client-side (Header, Footer, AdminNav) para esconder
// links de navegação — sem o prefixo, o Next.js não inclui o valor no bundle
// do navegador. Não são segredos, então expor o valor (true/false) no
// cliente não é um problema.
function isEnabled(rawValue) {
  return rawValue !== 'false' && rawValue !== '0';
}

export const FEATURE_BLOG = isEnabled(process.env.NEXT_PUBLIC_FEATURE_BLOG);
export const FEATURE_INSTAGRAM = isEnabled(process.env.NEXT_PUBLIC_FEATURE_INSTAGRAM);
export const FEATURE_CALENDARIO = isEnabled(process.env.NEXT_PUBLIC_FEATURE_CALENDARIO);
export const FEATURE_WHATSAPP = isEnabled(process.env.NEXT_PUBLIC_FEATURE_WHATSAPP);
export const FEATURE_CHAT = isEnabled(process.env.NEXT_PUBLIC_FEATURE_CHAT);
export const FEATURE_PROFISSIONAIS = isEnabled(process.env.NEXT_PUBLIC_FEATURE_PROFISSIONAIS);

// Controla só a possibilidade de marcar uma consulta NOVA pelo site
// (wizard em /agendamento e no perfil do profissional) — não afeta o
// cancelamento/reagendamento de consultas já existentes na Área do Cliente,
// que usa a mesma rota de proxy do ClinVida para outra finalidade.
export const FEATURE_AGENDAMENTO = isEnabled(process.env.NEXT_PUBLIC_FEATURE_AGENDAMENTO);
