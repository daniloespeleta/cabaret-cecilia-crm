import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "top_clientes",
  title: "Top clientes por gasto",
  description: "Retorna os clientes que mais gastaram (soma de comandas fechadas), ordenados por valor.",
  inputSchema: {
    limite: z.number().int().min(1).max(50).optional().describe("Quantos clientes retornar (padrão 10)."),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limite }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("comandas")
      .select("cliente_id, valor_total, clientes(nome)")
      .eq("status", "fechada");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const porCliente: Record<string, { nome: string; total: number }> = {};
    for (const c of data ?? []) {
      if (!c.cliente_id) continue;
      const nome = (c.clientes as unknown as { nome?: string } | null)?.nome ?? "Cliente";
      if (!porCliente[c.cliente_id]) porCliente[c.cliente_id] = { nome, total: 0 };
      const entry = porCliente[c.cliente_id]!;
      entry.total += c.valor_total ?? 0;
    }
    const ranking = Object.values(porCliente).sort((a, b) => b.total - a.total).slice(0, limite ?? 10);
    return {
      content: [{ type: "text", text: JSON.stringify(ranking) }],
      structuredContent: { ranking },
    };
  },
});
