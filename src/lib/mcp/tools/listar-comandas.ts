import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_comandas",
  title: "Listar comandas",
  description: "Lista comandas da casa, com opção de filtrar por status (aberta/fechada).",
  inputSchema: {
    status: z.enum(["aberta", "fechada"]).optional(),
    cliente_id: z.string().uuid().optional(),
    limite: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, cliente_id, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase.from("comandas").select("*").order("created_at", { ascending: false }).limit(limite ?? 50);
    if (status) query = query.eq("status", status);
    if (cliente_id) query = query.eq("cliente_id", cliente_id);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { comandas: data } };
  },
});
