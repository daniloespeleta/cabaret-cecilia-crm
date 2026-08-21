import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_ingressos",
  title: "Listar ingressos",
  description: "Lista os tipos de ingresso (pista, camarote, inteira, meia, cortesia) de um evento.",
  inputSchema: {
    evento_id: z.string().uuid().optional(),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let q = supabase.from("ingressos").select("*");
    if (input.evento_id) q = q.eq("evento_id", input.evento_id);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { ingressos: data } };
  },
});
