import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "historico_comandas_cliente",
  title: "Histórico de comandas do cliente",
  description: "Retorna o histórico de comandas e gastos de um cliente no CRM.",
  inputSchema: {
    cliente_id: z.string().uuid(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ cliente_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("comandas")
      .select("*")
      .eq("cliente_id", cliente_id)
      .order("created_at", { ascending: false });
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { comandas: data } };
  },
});
