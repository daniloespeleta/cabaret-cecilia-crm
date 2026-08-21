# CRM para Casa Noturna — Painel Web + MCP

## Objetivo

Construir um CRM completo para uma casa noturna, com duas superfícies:

1. **Painel web** acessível no navegador para gerência, promoters e equipe de operação.
2. **Servidor MCP** que expõe as ferramentas do CRM a assistentes de IA (ChatGPT, Claude etc.), **protegido por login (OAuth)** — cada cliente se conecta como um usuário real do sistema.

Dados centrais: **clientes + comandas**, **eventos/atrações** e **guest list + promoções**.

## Estado atual

- Template TanStack Start v1 limpo (React 19, Tailwind v4, shadcn). Sem backend, sem auth, sem integrações.
- `src/routes/index.tsx` é placeholder e será substituído pelo painel.

## 1. Habilitar backend (Lovable Cloud)

- Habilitar Lovable Cloud (PostgreSQL + Auth + storage). Nenhum dado será guardado em `localStorage`.
- Habilitar **Sign In com Google** (via broker) e **Sign In com Apple** + e-mail/senha para a equipe do clube.
- Ativar o **servidor de autorização OAuth 2.1** do Supabase para o MCP (registro dinâmico de clientes).

## 2. Modelo de dados (migração SQL)

Papéis em tabela separada (`user_roles`), nunca no profile — evita escalada de privilégio. Enum de papéis: `admin` (gerência/direção), `promoter`, `staff` (operação). Função `has_role()` security-definer + políticas RLS por papel.

Tabelas (todas com GRANT, RLS e políticas):

| Tabela | Campos principais |
|---|---|
| `clientes` | nome, telefone, email, preferencias, tags, observações, criado_por |
| `eventos` | nome, data/hora, tipo (festa/DJ/artista/temática), local/área, capacidade, status, criado_por |
| `comandas` | cliente_id, evento_id?, mesa/camarote, status (aberta/fechada), valor_total, criado_por |
| `itens_comanda` | comanda_id, descricao, quantidade, valor_unitario |
| `guest_list` | evento_id, nome, telefone, promoter_id, status (pendente/confirmado/entrou/nao_compareceu), criado_por |
| `promoters` | user_id, nome, taxa_comissao, ativo |

RLS:
- `admin` lê/escreve tudo.
- `promoter` gerencia a própria guest list e clientes; vê comissões próprias.
- `staff` abre/fecha comandas, cadastra clientes e marca entradas na guest list.

## 3. Painel web (rotas autenticadas)

Todas as telas sob `_authenticated/` (layout gerenciado pela integração). Nav lateral com seções por papel.

- **Dashboard** (`/`) — relatórios: faturamento de comandas, comandas abertas, próximos eventos, tamanho da guest list, top clientes. Gráficos com recharts.
- **Clientes** (`/clientes`) — listar, cadastrar, editar, ver histórico de comandas.
- **Comandas** (`/comandas`) — abrir/fechar comanda, adicionar itens, ver valor total, filtro por status.
- **Eventos** (`/eventos`) — criar/editar próximas festas, DJs e artistas; ver guest list de cada evento.
- **Guest list & promoções** (`/guest-list`) — adicionar convidados, confirmar entrada, vínculo com promoter.
- **Promoters** (`/promoters`, só admin) — cadastrar promoters, taxas de comissão, comissões por evento.

Acesso via `createServerFn` + `requireSupabaseAuth`; leituras do autenticado respeitam RLS. `head()` por rota com título/descrição/OG próprios do CRM.

## 4. Servidor MCP (OAuth)

Usar `@lovable.dev/mcp-js` em `src/lib/mcp/`:

- `supabase.ts` — factory `supabaseForUser(ctx)` que encaminha o token verificado (RLS roda como o usuário).
- Ferramentas (uma por arquivo em `tools/`), todas protegidas e agindo como o usuário logado:
  - **Clientes:** `listar_clientes`, `criar_cliente`, `atualizar_cliente`, `historico_comandas_cliente`.
  - **Eventos:** `listar_eventos`, `criar_evento`, `detalhar_evento`.
  - **Guest list:** `listar_guest_list`, `adicionar_convidado`, `confirmar_convidado`, `marcar_entrada`.
  - **Comandas:** `listar_comandas`, `abrir_comanda`, `fechar_comanda`, `adicionar_item`.
  - **Relatórios:** `faturamento_periodo`, `top_clientes`, `comissoes_promoter`.
- `defineMcp` com `auth: auth.oauth.issuer(...)` — emissor via `import.meta.env['VITE_SUPABASE_PROJECT_ID']` (host direto `supabase.co`, nunca proxy).
- Rota de consentimento OAuth em `src/routes/[.]lovable.oauth.consent.tsx`, consumindo o redirect preservado no login/Google.
- Plugin `mcpPlugin()` no `vite.config.ts` montando o servidor em `/mcp`.
- Favicon próprio (substitui o genérico do template).

## 5. Metadados

- `head()` com título, descrição e tags OG/Twitter por rota.
- `favicon.ico` de marca da casa noturna.

## Entrega

- **Não publicado** inicialmente: os clientes MCP (ChatGPT/Claude) só poderão conectar após o publish. Fluxo OAuth ativado antes do publish.
- Validação: manifesto MCP regenerado após cada mudança; build sem erros; fluxo de login + OAuth testado.
