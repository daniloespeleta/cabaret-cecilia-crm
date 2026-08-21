import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "adicionar_item",
  title: "Adicionar item à comanda",
  description: "Adiciona um item (bebida, consumo) a uma comanda aberta e recalcula o total.",
  inputSchema: {
    comanda_id: z.string().uuid(),
    descricao: z.string().trim().min(1),
    quantidade: z.number().int().min(1).default(1),
    valor_unitario: z.number().min(0),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async ({ comanda_id, descricao, quantidade, valor_unitario }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: comanda, error: ce } = await supabase.from("comandas").select("*").eq("id", comanda_id).single();
    if (ce) return { content: [{ type: "text", text: ce.message }], isError: true };
    if (comanda.status !== "aberta") {
      return { content: [{ type: "text", text: "Comanda não está aberta" }], isError: true };
    }
    const novoTotal = comanda.valor_total + quantidade * valor_unitario;
    const { error: ie } = await supabase
      .from("itens_comanda")
      .insert({ comanda_id, descricao, quantidade, valor_unitario });
    if (ie) return { content: [{ type: "text", text: ie.message }], isError: true };
    const { data: atualizada, error: ue } = await supabase
      .from("comandas")
      .update({ valor_total: novoTotal })
      .eq("id", comanda_id)
      .select();
    if (ue) return { content: [{ type: "text", text: ue.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(atualizada) }],
      structuredContent: { comanda: atualizada?.[0] },
    };
  },
});
