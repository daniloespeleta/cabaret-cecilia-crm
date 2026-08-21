import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_eventos",
  title: "Listar eventos",
  description: "Lista os eventos/atrações da casa noturna, com opção de filtrar por status ou por data.",
  inputSchema: {
    status: z.enum(["agendado", "acontecendo", "encerrado", "cancelado"]).optional(),
    proximos: z.boolean().optional().describe("Se true, retorna apenas eventos futuros."),
    limite: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, proximos, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase.from("eventos").select("*").order("data_hora").limit(limite ?? 50);
    if (status) query = query.eq("status", status);
    if (proximos) query = query.gte("data_hora", new Date().toISOString());
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { eventos: data } };
  },
});
