import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "marcar_entrada",
  title: "Marcar entrada de convidado",
  description: "Marca um convidado da guest list como presente (entrou) na porta.",
  inputSchema: {
    convidado_id: z.string().uuid(),
  },
  annotations: { readOnlyHint: false },
  handler: async ({ convidado_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("guest_list").update({ status: "entrou" }).eq("id", convidado_id).select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { convidado: data?.[0] } };
  },
});
