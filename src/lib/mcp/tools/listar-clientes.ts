import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_clientes",
  title: "Listar clientes",
  description: "Lista os clientes cadastrados no CRM, com busca opcional por nome.",
  inputSchema: {
    busca: z.string().optional().describe("Texto para filtrar por nome."),
    limite: z.number().int().min(1).max(100).optional().describe("Máximo de registros (padrão 50)."),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ busca, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase.from("clientes").select("*").order("nome").limit(limite ?? 50);
    if (busca) query = query.ilike("nome", `%${busca}%`);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { clientes: data } };
  },
});
