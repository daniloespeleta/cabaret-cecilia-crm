import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_guest_list",
  title: "Listar guest list",
  description: "Lista a guest list de um evento, com opção de filtrar por status.",
  inputSchema: {
    evento_id: z.string().uuid(),
    status: z.enum(["pendente", "confirmado", "entrou", "nao_compareceu"]).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ evento_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase.from("guest_list").select("*").eq("evento_id", evento_id).order("created_at");
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { convidados: data } };
  },
});
