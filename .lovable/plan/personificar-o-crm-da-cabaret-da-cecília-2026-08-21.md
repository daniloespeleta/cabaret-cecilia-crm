# Personificar o CRM da Cabaret da Cecília

Re-brandar o CRM existente com a identidade do **Cabaret da Cecília** (dark glam) e
estender a operação com dois módulos específicos de cabaret: **Atrações/Artistas**
e **Bilheteria/Lotação**.

## Contexto do negócio

- Espaço multicultural de arte transgressora em São Paulo (Santa Cecília).
- Burlesco, strip-tease, drag, música, teatro e drinks.
- Aberto de quarta a sábado, 21h–4h. Novo endereço: Rua Nestor Pestana, 189.
- Site: https://www.cabaretdacecilia.com.br/
- Público-alvo de uso: gerência/direção, promoters e equipe de operação (portaria, bar).

## Objetivos

1. Aplicar a identidade da casa (nome, paleta dark glam, tipografia) em todo o painel.
2. Adaptar a linguagem das telas ao universo do cabaret, sem quebrar a usabilidade.
3. Novo módulo de **Atrações/Artistas**: agenda de shows, artistas (drag/burlescas),
   cachês e programação por noite.
4. Novo módulo de **Bilheteria/Lotação**: ingressos por evento e controle de lotação
   (ingressos vendidos vs. capacidade, com trava contra excesso de venda).
5. Estender o servidor MCP (protegido por OAuth) com as ferramentas dos dois módulos.

## Escopo fora

- Não muda autenticação (Google + senha já existem) nem as tabelas/RLS existentes.
- Não cria páginas públicas; o painel continua autenticado.
- Não altera o modelo de papéis (admin / promoter / staff).

## Direção visual (bloqueada)

Dark glam: preto profundo, dourado e vermelho neon. Cabeçalhos **Syne**, corpo
**Plus Jakarta Sans**.

- Cores: `#0a0908` (fundo), `#1a1714` (superfície), `#d4af37` (dourado), `#c1121f` (vermelho), `#3a3329` (borda).
- Converter as cores para `oklch` em `src/styles.css` como tokens semânticos
  (`--background`, `--primary`, `--accent`, etc.) para manter theming/dark mode.
- Carregar Syne e Plus Jakarta Sans via `<link>` no `head()` de `src/routes/__root.tsx`
  (nunca `@import` de URL no CSS).

## Mudanças de código

### 1. Marca e linguagem

- `src/routes/_authenticated/route.tsx`: logo e título "Cabaret da Cecília · CRM";
  item de nav "Atrações"; icones afinados.
- Copiar textos das telas para a linguagem da casa (ex.: "bafos", "noite", "montação da
  drag", "portaria") mantendo clareza para a equipe.
- `src/routes/index.tsx` (rota pública de redirecionamento) e telas `_authenticated`
  ganham `head()` próprio com `title`, `description`, `og:title`, `og:description`
  (meta por rota, nunca no `__root`).

### 2. Schema (migração nova)

Nova tabela **artistas**:

- `id`, `nome`, `tipo` (drag, burlesca, mc, danca, musica, teatro, outro), `contato`,
  `instagram`, `descricao`, `ativo`, timestamps.
- `GRANT` para `authenticated` + `service_role`, RLS habilitada, políticas por papel
  (admin/staff/promoter gerenciam; leitura para equipe).

Nova tabela **evento_artistas** (programação por noite, muitos-para-muitos):

- `id`, `evento_id`, `artista_id`, `horario`, `cache numeric`, `ordem`.
- `GRANT` + RLS + políticas, seguindo o mesmo padrão das demais tabelas.

Nova tabela **ingressos** (bilheteria):

- `id`, `evento_id`, `tipo` (pista, camarote, inteira, meia, cortesia), `preco`,
  `quantidade`, `vendidos`, timestamps.
- `GRANT` + RLS + políticas por papel.

Função de lotação:

- `SELECT` agregando `SUM(vendidos)` por evento; a UI compara com `eventos.capacidade`.
- Trava de excesso de venda na camada de escrita (server fn e/ou trigger) — nunca
  ultrapassar `quantidade` nem `capacidade`.

Toda nova tabela segue a ordem obrigatória: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY`.

### 3. Server functions

- `src/lib/artistas.functions.ts`: listar, criar, atualizar, excluir artistas.
- `src/lib/atracoes.functions.ts`: `adicionarArtistaEvento` (vincula artista a evento
  com cachê e horário), `programacaoEvento`, remover da programação.
- `src/lib/bilheteria.functions.ts`: `listarIngressos`, `criarIngresso`,
  `venderIngresso` (decrementa disponível, incrementa vendidos, valida capacidade),
  `lotacaoEventos`.
- Todas com `.middleware([requireSupabaseAuth])` (padrão atual).

### 4. Web UI

- Nova página `src/routes/_authenticated/atracoes.tsx`: cadastro de artistas e agenda
  (vinculação com cachê/horário por evento).
- `src/routes/_authenticated/eventos.tsx`: programação da noite (slots de artistas)
  e bloco de bilheteria/lotação por evento.
- `src/routes/_authenticated/dashboard.tsx`: card de lotação atual e próximas atrações.

### 5. Servidor MCP (extensão das 18 ferramentas atuais)

- Artistas: `listar_artistas`, `criar_artista`, `atualizar_artista`,
  `adicionar_artista_evento`, `programacao_evento`.
- Bilheteria: `listar_ingressos`, `vender_ingresso`, `lotacao_evento`.
- Seguem o padrão existente (`src/lib/mcp/tools/*`, factory `supabaseForUser`, RLS como
  usuário logado, `outputSchema: {}`).
- Registrar cada nova tool em `src/lib/mcp/index.ts`.
- Ao final, rodar o extrator do manifesto MCP para validar.

## Passos

1. Converter paleta dark glam para tokens `oklch` em `src/styles.css`; carregar fontes no `__root`.
2. Aplicar marca e linguagem no layout e nas telas existentes; `head()` por rota.
3. Criar a migração (artistas, evento_artistas, ingressos + lotação) e aplicar.
4. Implementar server functions dos novos módulos.
5. Construir telas `atracoes`, bilheteria/lotação em `eventos`, card no `dashboard`.
6. Adicionar ferramentas MCP e revalidar o manifesto.
7. Rodar o ritual de direções visuais (3 variações do dark glam) para a equipe escolher
   a composição final antes de implementar o layout de tela cheia.

## Detalhes técnicos

- Nunca editar `src/integrations/supabase/client.ts` (auto-gerado) nem `routeTree.gen.ts`.
- `head()` de rota: `title`, `description`, `og:title`, `og:description` por página;
  `canonical`/`og:url` apenas em rotas-folha, apontando para a própria rota.
- `createServerFn` importado de `@tanstack/react-start`; `requireSupabaseAuth` da
  integração existente.
- Sem `og:image` até existir um hero relevante em URL absoluta (hosting injeta preview).
