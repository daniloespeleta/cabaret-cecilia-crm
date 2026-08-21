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

// Read via import.meta.env so Vite inlines the literal at build time.
// The fallback keeps the issuer well-formed if the literal is unset during
// the throwaway manifest-extract eval; the published build inlines the real ref.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "casa-noturna-crm",
  title: "CRM Casa Noturna",
  version: "0.1.0",
  instructions:
    "CRM da casa noturna. Gerencie clientes, eventos/atrações, comandas (consumo) e a guest list. " +
    "Use listar_clientes e criar_cliente para cadastros, listar_eventos e criar_evento para a agenda, " +
    "listar_guest_list / adicionar_convidado / marcar_entrada para a porta, e as ferramentas de comanda " +
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
