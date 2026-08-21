import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listarClientesTool from "./tools/listar-clientes";
import criarClienteTool from "./tools/criar-cliente";
import atualizarClienteTool from "./tools/atualizar-cliente";
import historicoComandasClienteTool from "./tools/historico-comandas-cliente";
import listarEventosTool from "./tools/listar-eventos";
import criarEventoTool from "./tools/criar-evento";
import detalharEventoTool from "./tools/detalhar-evento";
import listarGuestListTool from "./tools/listar-guest-list";
import adicionarConvidadoTool from "./tools/adicionar-convidado";
import confirmarConvidadoTool from "./tools/confirmar-convidado";
import marcarEntradaTool from "./tools/marcar-entrada";
import listarComandasTool from "./tools/listar-comandas";
import abrirComandaTool from "./tools/abrir-comanda";
import adicionarItemTool from "./tools/adicionar-item";
import fecharComandaTool from "./tools/fechar-comanda";
import faturamentoPeriodoTool from "./tools/faturamento-periodo";
import topClientesTool from "./tools/top-clientes";
import comissoesPromoterTool from "./tools/comissoes-promoter";
import listarArtistasTool from "./tools/listar-artistas";
import criarArtistaTool from "./tools/criar-artista";
import atualizarArtistaTool from "./tools/atualizar-artista";
import adicionarArtistaEventoTool from "./tools/adicionar-artista-evento";
import programacaoEventoTool from "./tools/programacao-evento";
import listarIngressosTool from "./tools/listar-ingressos";
import venderIngressoTool from "./tools/vender-ingresso";
import lotacaoEventoTool from "./tools/lotacao-evento";

// Read via import.meta.env so Vite inlines the literal at build time.
// The fallback keeps the issuer well-formed if the literal is unset during
// the throwaway manifest-extract eval; the published build inlines the real ref.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "cabaret-da-cecilia-crm",
  title: "Cabaret da Cecília · CRM",
  version: "0.2.0",
  instructions:
    "CRM do Cabaret da Cecília. Gerencie fregueses/clientes, noites e atrações, comandas (consumo), " +
    "bilheteria e guest list. Use listar_clientes/criar_cliente para cadastros, listar_eventos/criar_evento " +
    "para a agenda, listar_artistas/adicionar_artista_evento/programacao_evento para a programação da noite, " +
    "listar_ingressos/vender_ingresso/lotacao_evento para bilheteria e lotação, " +
    "listar_guest_list/adicionar_convidado/marcar_entrada para a portaria, e as ferramentas de comanda " +
    "para abrir, adicionar itens e fechar contas. faturamento_periodo, top_clientes e comissoes_promoter " +
    "geram relatórios. As ações agem como o usuário autenticado, respeitando os papéis do CRM.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listarClientesTool,
    criarClienteTool,
    atualizarClienteTool,
    historicoComandasClienteTool,
    listarEventosTool,
    criarEventoTool,
    detalharEventoTool,
    listarArtistasTool,
    criarArtistaTool,
    atualizarArtistaTool,
    adicionarArtistaEventoTool,
    programacaoEventoTool,
    listarIngressosTool,
    venderIngressoTool,
    lotacaoEventoTool,
    listarGuestListTool,
    adicionarConvidadoTool,
    confirmarConvidadoTool,
    marcarEntradaTool,
    listarComandasTool,
    abrirComandaTool,
    adicionarItemTool,
    fecharComandaTool,
    faturamentoPeriodoTool,
    topClientesTool,
    comissoesPromoterTool,
  ],
});
