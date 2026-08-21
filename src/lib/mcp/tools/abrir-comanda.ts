import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "abrir_comanda",
  title: "Abrir comanda",
  description: "Abre uma nova comanda para um cliente da casa noturna.",
  inputSchema: {
    cliente_id: z.string().uuid().optional(),
    evento_id: z.string().uuid().optional(),
    mesa: z.string().optional().describe("Número ou nome da mesa/camarote."),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async ({ cliente_id, evento_id, mesa }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("comandas")
      .insert({ cliente_id, evento_id, mesa, status: "aberta", valor_total: 0, criado_por: ctx.getUserId() })
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { comanda: data?.[0] } };
  },
});
