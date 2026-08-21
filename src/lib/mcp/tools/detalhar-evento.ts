import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "detalhar_evento",
  title: "Detalhar evento",
  description: "Retorna os detalhes de um evento e sua guest list.",
  inputSchema: {
    evento_id: z.string().uuid(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ evento_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: evento, error: e1 } = await supabase.from("eventos").select("*").eq("id", evento_id).single();
    if (e1) return { content: [{ type: "text", text: e1.message }], isError: true };
    const { data: convidados, error: e2 } = await supabase
      .from("guest_list")
      .select("*")
      .eq("evento_id", evento_id)
      .order("created_at");
    if (e2) return { content: [{ type: "text", text: e2.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify({ evento, convidados }) }],
      structuredContent: { evento, convidados },
    };
  },
});
