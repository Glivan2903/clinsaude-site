# Redesign Visual — Clin+Saúde (clinsaude-web)

Documento de instruções para reformular o visual do projeto para um padrão
moderno, profissional e responsivo, **sem aparência de site gerado por IA**,
usando **GSAP** como motor de animação de todos os componentes.

> Escopo: apenas visual e animação. Nenhuma lógica de negócio muda — fluxo de
> agendamento (BookingWizard/ClinVida), chat, admin, slugs e rotas permanecem
> intactos.

---

## 1. Diagnóstico — por que o visual atual "parece IA"

O projeto hoje acumula exatamente os clichês que denunciam design gerado por
IA. Cada item abaixo deve ser **removido ou substituído**:

| Clichê presente hoje | Onde está | O que fazer |
|---|---|---|
| Texto com gradiente verde→lima (`.gradient-text`) | `globals.css:174`, `HeroSection.js` | Remover a classe. Títulos em cor sólida (`--ink` ou verde-marca). |
| Badge "pill" com bolinha pulsante no hero | `HeroSection.js` (`.badge` + `.badgeDot`) | Substituir por eyebrow tipográfico (ver §4.2). |
| Glassmorphism genérico (`.glass`, blur 12px) | `globals.css:101` | Remover. Superfícies sólidas com borda de 1px e sombra curta. |
| Cards com tilt 3D no hover | `TiltCard.js` (usado em Specialties) | Deletar o componente. Hover = elevação sutil de 2–4px via GSAP. |
| Stagger fade-up idêntico em toda seção | Todos os componentes com `motion` | Cada seção ganha coreografia própria (ver §5). |
| Botões 100% pill (`--radius-full`) | `.btn-primary`, `.btn-secondary` | Raio moderado de 8px (`--radius-md`). Pill só em tags/filtros. |
| Sombra colorida da marca (`--shadow-brand`) | `globals.css:23` | Remover. Sombras neutras e curtas. |
| Verde esmeralda + lima como dupla de destaque | `--primary` + `--primary-light` | Lima (`#8cc63f`) rebaixado a papel mínimo (ver §3.1). |
| Números animados "50+ / 10k+" no hero | `HeroSection.js` + `AnimatedNumber.js` | Manter só se forem dados reais da clínica; reapresentar como linha de fatos discreta abaixo da dobra, não como troféu no hero. |

**Regra geral:** o novo visual gasta ousadia em UM lugar (o elemento-assinatura,
§4.1) e mantém todo o resto disciplinado e quieto.

---

## 2. Nova direção de design

**Conceito:** "clínica de bairro com padrão de hospital" — precisão editorial
suíça (grid rígido, tipografia forte, muito respiro) aquecida por detalhes
humanos. Nada de cara de startup; cara de instituição de saúde que existe
desde 2015 em Aracaju.

O verde permanece (é a marca da clínica), mas passa de "decoração espalhada"
para "assinatura pontual": aparece no elemento-assinatura, em links/ações e em
pequenos marcadores — nunca em gradientes, glows ou fundos grandes.

---

## 3. Design tokens (reescrever `app/globals.css`)

### 3.1 Paleta

```css
:root {
  /* Marca */
  --green-900: #17402209;  /* usar #174022 — verde profundo, títulos sobre claro */
  --green-700: #2b7a3e;   /* verde-marca (mantido, é a cor do logo) */
  --green-600: #33914a;   /* hover de ações */
  --leaf:      #8cc63f;   /* SOMENTE: traço do ECG e micro-marcadores. Nunca em texto, nunca em gradiente. */

  /* Neutros quentes (fundo atual #f4f8f5 é frio/genérico — trocar) */
  --paper:     #fbfaf7;   /* fundo geral, branco-papel quente */
  --surface:   #ffffff;
  --ink:       #1c2420;   /* texto principal */
  --ink-soft:  #566158;   /* texto secundário */
  --line:      #e3e1da;   /* bordas hairline */
  --line-strong: #c9c6bc;

  /* Feedback */
  --error: #b3261e;  --error-bg: #fcefee;
  --success: #2b7a3e; --success-bg: #eef5ef;
}
```

Proibido: gradientes de marca, sombras coloridas, mais de um tom de verde
visível por viewport (exceto o ECG).

### 3.2 Tipografia

Trocar `Inter + Outfit` (par mais comum da web em 2024–25) por:

- **Display / títulos:** `Bricolage Grotesque` (Google Fonts) — grotesca com
  personalidade, ainda séria. Pesos 600 e 800. Usar `font-optical-sizing`.
- **Corpo / UI:** `Figtree` — humanista, ótima em telas, neutra sem ser Inter.
  Pesos 400, 500, 600.

Carregar via `next/font/google` em `app/layout.js` (substituir os imports
atuais de Inter/Outfit, mantendo as mesmas variáveis `--font-heading` e
`--font-sans` para não quebrar os CSS Modules).

Escala (mobile → desktop, usar `clamp()`):

```css
--text-hero:  clamp(2.4rem, 6vw, 4.2rem);   /* peso 800, tracking -0.03em, line-height 1.05 */
--text-h2:    clamp(1.7rem, 3.5vw, 2.4rem); /* peso 700 */
--text-h3:    1.25rem;
--text-body:  1rem;      /* line-height 1.65 */
--text-small: 0.875rem;
--text-eyebrow: 0.78rem; /* uppercase, tracking 0.12em, peso 600, cor --green-700 */
```

### 3.3 Forma e profundidade

```css
--radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;  --radius-full: 999px; /* só tags */
--shadow-sm: 0 1px 2px rgb(28 36 32 / 0.06);
--shadow-md: 0 2px 8px rgb(28 36 32 / 0.08);
/* NÃO criar shadow-lg/xl/brand — profundidade máxima é a md */
```

Cartões: fundo `--surface`, borda `1px solid var(--line)`, sombra `sm`;
no hover a sombra vai a `md` e o cartão sobe 2px (GSAP, §5.4).

### 3.4 Grid e respiro

- Container: manter `max-width: 1200px`, padding lateral `1.5rem` (mobile) /
  `2rem` (≥768px).
- Seções: `padding-block: clamp(4rem, 9vw, 7.5rem)` — mais respiro que os
  `5rem` fixos atuais.
- Breakpoints: 640 / 768 / 1024 / 1280px. Mobile-first em todos os módulos CSS.

---

## 4. Assinatura visual

### 4.1 A linha de vida (ECG)

O único elemento "ousado" do site: um **traçado de eletrocardiograma em SVG**,
desenhado progressivamente com GSAP. É específico do assunto (saúde), não
existe em template nenhum, e costura as páginas:

1. **Hero:** o ECG atravessa horizontalmente a base do hero (stroke
   `--leaf`, 2px). No load, GSAP anima `strokeDashoffset` de 100%→0 em ~1.4s
   com `ease: 'power2.inOut'`, terminando com um pico de batimento alinhado ao
   CTA "Agendar Consulta".
2. **Divisor de seções:** versão mínima (um único batimento, ~120px de
   largura) substitui qualquer divisor decorativo, animada por ScrollTrigger
   quando entra na viewport.
3. **Loading states:** o mesmo batimento em loop curto vira o spinner do
   BookingWizard e do chat (substituindo spinners genéricos).

Implementar como componente `components/EcgLine.js` (client) que recebe
`variant: 'hero' | 'divider' | 'spinner'`. Técnica: `getTotalLength()` do
path + `stroke-dasharray/offset` animados com `gsap.to()` — **não** usar
DrawSVGPlugin (plugin pago).

### 4.2 Eyebrow institucional

Toda seção abre com eyebrow no padrão:
`CLIN+SAÚDE · ARACAJU — DESDE 2015` ou o rótulo da seção
(`ESPECIALIDADES`, `NOSSA EQUIPE`). Tipografia da §3.2. Isso substitui
badges, pills e bolinhas pulsantes.

---

## 5. GSAP — setup e padrões obrigatórios

### 5.1 Instalação e remoção da lib atual

```bash
npm install gsap @gsap/react
npm uninstall motion
```

A lib `motion` é usada em 12 arquivos — **todos** migram para GSAP:

```
components/HeroSection.js        components/AboutSection.js
components/SpecialtiesSection.js components/CTASection.js
components/Header.js             components/Footer.js
components/AnimatedNumber.js     components/TiltCard.js (deletar)
components/BookingWizard.js      components/chat/ChatWidget.js
components/chat/ChatInterface.js app/area-cliente/page.js
```

Ao final da migração, `grep -r "motion/react"` no projeto deve retornar vazio.

### 5.2 Infraestrutura central

Criar `lib/gsap.js` — ponto único de registro:

```js
'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Defaults do projeto: nada de bounce/elastic — easing sóbrio
gsap.defaults({ ease: 'power2.out', duration: 0.7 });

export { gsap, ScrollTrigger, useGSAP };
```

Todos os componentes importam **deste módulo**, nunca de `gsap` direto.

Regras de uso (Next.js App Router):

- Todo componente animado é `'use client'`.
- Animações sempre dentro de `useGSAP(() => {...}, { scope: containerRef })` —
  garante cleanup automático e seletores escopados (`gsap.utils.toArray('.card', ...)`).
- Nunca animar `width/height/top/left`; só `transform` e `opacity`
  (exceção: `strokeDashoffset` do ECG).

### 5.3 Acessibilidade e responsividade da animação

Obrigatório em todo componente com animação:

```js
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('.reveal', { opacity: 1, y: 0 }); // estado final, sem animação
  });
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // animações aqui
  });
}, { scope: ref });
```

Remover do `globals.css` o hack atual de `prefers-reduced-motion` que zera
`animation-duration` globalmente (linhas 181–187) — o controle passa a ser do
`gsap.matchMedia()`.

Em telas < 768px: reduzir distâncias de deslocamento (y: 24 → y: 12) e
desativar efeitos de parallax/pin.

### 5.4 Vocabulário de animação (usar SÓ estes 6 padrões)

Coreografia limitada e consistente é o que separa site profissional de demo
de IA. Nenhuma animação fora deste vocabulário:

1. **`reveal`** — entrada de blocos por ScrollTrigger:
   `from { opacity: 0, y: 24 }`, `duration: 0.7`, `start: 'top 82%'`,
   `once: true`. Stagger máximo de `0.08` entre irmãos.
2. **`heroTimeline`** — única animação de load do site (só na home):
   timeline com eyebrow → título (por linha, com `overflow: hidden` no
   wrapper) → parágrafo → CTAs → ECG. Total ≤ 1.6s.
3. **`lift`** — hover de cartões e botões:
   `gsap.quickTo(el, 'y', { duration: 0.25 })` para −2px e sombra via classe
   CSS. Sem tilt, sem scale > 1.02.
4. **`count`** — números (reescrever `AnimatedNumber.js`):
   `gsap.to(obj, { value, duration: 1.2, snap: { value: 1 }, scrollTrigger: {...} })`.
5. **`ecg`** — traçado do §4.1 (`strokeDashoffset`).
6. **`swap`** — transição entre passos do BookingWizard e mensagens do chat:
   saída `opacity: 0, y: -8` (0.2s) → entrada `opacity: 0, y: 8 → 0` (0.3s).

Proibido: parallax em imagem de fundo, pin de seção inteira, texto que se
monta letra por letra, cursores customizados, partículas, blobs animados,
marquees.

---

## 6. Instruções por página/componente

### 6.1 `components/Header.js`
- Fundo `--paper` sólido com borda inferior `1px var(--line)` (sem blur/glass).
- Ao rolar > 8px, GSAP adiciona sombra `sm` e reduz o padding vertical
  (ScrollTrigger com `toggleClass`).
- Link ativo marcado com sublinhado de 2px `--green-700` (não pill de fundo).
- Menu mobile: painel que desliza da direita com `swap`; itens com `reveal`
  stagger 0.05. Botão hambúrguer com transição para "X" via GSAP timeline.

### 6.2 `components/HeroSection.js`
- Layout: grid 2 colunas (≥1024px) — texto à esquerda, foto real da clínica à
  direita com corte reto e `--radius-lg`; empilha no mobile com a foto depois
  do CTA.
- Remover: badge com bolinha, `gradient-text`, estatísticas infladas no topo.
- Conteúdo: eyebrow (§4.2) → H1 sólido em `--green-900` → parágrafo →
  2 CTAs (`Agendar consulta` primário, `Falar no WhatsApp` secundário) →
  linha ECG (§4.1) cruzando a base.
- Animação: `heroTimeline` (padrão 2). Foto entra com `clip-path: inset()`
  animado de `inset(0 100% 0 0)` para `inset(0)`.

### 6.3 `components/CTASection.js`
- Faixa horizontal `--green-900` com texto claro; um único CTA.
- Entrada com `reveal`. Nada de gradiente ou padrão de fundo.

### 6.4 `components/AboutSection.js`
- Duas colunas: texto institucional + coluna de fatos (anos de atuação,
  especialidades, convênios) usando `count` (padrão 4) — aqui é o lugar dos
  números, com rótulos completos e fonte de dado real.
- Divisor ECG antes da seção.

### 6.5 `components/SpecialtiesSection.js`
- **Deletar `TiltCard.js`** e todo uso.
- Cards em grid `repeat(auto-fill, minmax(240px, 1fr))`: ícone lucide 20px em
  `--green-700`, nome, uma linha de descrição. Borda 1px, hover `lift`.
- Entrada: `reveal` com stagger 0.06 por linha visível (usar
  `ScrollTrigger.batch`).

### 6.6 `components/Footer.js`
- Fundo `--green-900`, texto `--paper` com opacidade 0.85, links sublinhados
  no hover. Grid de 3 colunas (contato, navegação, horários) + linha final
  com CNPJ/endereço. Sem animação além de um `reveal` único no bloco.

### 6.7 `components/MedicosDirectory.js` + `app/medicos/page.js`
- Barra de busca/filtro por especialidade no topo (visual apenas — a lógica
  de filtro que já existir permanece).
- Lista de profissionais em cartões horizontais: avatar com inicial em
  `--green-700` sobre `--success-bg`, nome, especialidade, conselho.
- Entrada com `ScrollTrigger.batch` + `reveal`; hover `lift`.

### 6.8 `app/medicos/[slug]/page.js` (página do profissional)
- Cabeçalho tipo "cartão de consultório": nome grande (display), conselho e
  especialidade em eyebrow, ECG divisor, e o BookingWizard logo abaixo.
- Página de link inativo: mesma estrutura, mensagem objetiva, CTA para o
  WhatsApp da clínica. Sem ilustração genérica.

### 6.9 `components/BookingWizard.js`
- Manter TODA a lógica. Reestilizar: stepper superior com etapas nomeadas
  (Especialidade → Profissional → Data → Confirmação), etapa atual em
  `--green-700`, concluídas com check.
- Transição entre passos com `swap` (padrão 6). Barra de progresso fina de
  2px animada com `gsap.to(scaleX)`.
- Inputs: borda 1px `--line`, foco com borda `--green-700` (sem glow).
- Loading: ECG spinner (§4.1).

### 6.10 `components/chat/ChatWidget.js` e `ChatInterface.js`
- Botão flutuante circular `--green-700` com sombra `md`; abre/fecha com
  `gsap.fromTo(scale/opacity, transformOrigin: 'bottom right')`.
- Mensagens entram com `swap`. Indicador "digitando" = ECG spinner mini.

### 6.11 `app/area-cliente/page.js`, `app/chat/page.js`
- Aplicar tokens novos + `reveal` nas entradas de bloco. Sem coreografia extra.

### 6.12 `app/admin/**` (painel e login)
- Ferramenta interna: zero animação decorativa (só `swap` no feedback
  "Copiado!" e transições de 0.15s em hover). Aplicar tokens novos, layout de
  tabela limpa, densidade maior que o site público.

---

## 7. Conteúdo e microcopy (parte do "não parecer IA")

- Voz ativa e concreta: "Agendar consulta", não "Comece agora sua jornada".
- Proibido no copy: "descubra", "experiência única", "cuidado que transforma",
  emojis em texto institucional, títulos com reticências.
- Estados vazios e erros dizem o que aconteceu e o que fazer:
  "Não encontramos horários nesta data. Tente outra data ou fale conosco no
  WhatsApp."
- Manter todos os dados reais da clínica (telefone `(79) 99989-6288`,
  WhatsApp, endereço) — ver `lib/config.js`, que não muda.

---

## 8. Ordem de execução

1. **Fundação:** `npm i gsap @gsap/react` → criar `lib/gsap.js` → reescrever
   tokens do `globals.css` → trocar fontes no `layout.js`.
2. **Assinatura:** criar `components/EcgLine.js` (3 variantes).
3. **Home:** Header → Hero → CTA → About → Specialties → Footer (migrando
   `motion`→GSAP componente a componente; deletar `TiltCard.js`).
4. **Médicos:** MedicosDirectory → página de slug.
5. **Fluxos:** BookingWizard → chat (widget + interface) → area-cliente.
6. **Admin:** tokens + densidade.
7. **Limpeza:** `npm uninstall motion`; `grep -r "motion/react"` deve retornar
   vazio; remover `.glass`, `.gradient-text`, `--shadow-brand`, `TiltCard` de
   todos os CSS.

## 9. Verificação (critérios de aceite)

- [ ] `npm run build` sem erros; nenhuma importação de `motion/react` restante.
- [ ] Testar em 360px, 768px, 1024px e 1440px — sem scroll horizontal, hero
      legível na primeira dobra do mobile.
- [ ] Com `prefers-reduced-motion: reduce` (emular no DevTools): todo conteúdo
      visível imediatamente, nada "preso" em `opacity: 0`.
- [ ] Navegação completa por teclado com `focus-visible` visível.
- [ ] Contraste AA: `--ink` sobre `--paper` e branco sobre `--green-700`/`--green-900`.
- [ ] Fluxo de agendamento completo funciona igual ao anterior (nenhuma
      regressão funcional).
- [ ] Teste do espelho: abrir cada página e remover um enfeite que não
      esteja servindo ao conteúdo. Se sobrar dúvida se algo "parece IA",
      remova.
