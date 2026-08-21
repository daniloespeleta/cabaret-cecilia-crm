import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "faturamento_periodo",
  title: "Faturamento do período",
  description: "Calcula o faturamento total de comandas fechadas em um período.",
  inputSchema: {
    data_inicio: z.string().datetime().describe("Início do período em ISO 8601."),
    data_fim: z.string().datetime().describe("Fim do período em ISO 8601."),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ data_inicio, data_fim }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("comandas")
      .select("valor_total, created_at")
      .eq("status", "fechada")
      .gte("created_at", data_inicio)
      .lte("created_at", data_fim);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const total = (data ?? []).reduce((acc, c) => acc + (c.valor_total ?? 0), 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ total, quantidade: data?.length ?? 0 }) }],
      structuredContent: { total, quantidade: data?.length ?? 0 },
    };
  },
});
