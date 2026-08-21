import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_artistas",
  title: "Listar artistas",
  description: "Lista as atrações/artistas do cabaret (drag, burlescas, DJs, músicos, MCs).",
  inputSchema: {
    ativos: z.boolean().optional().describe("Se true, retorna apenas artistas ativos."),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let q = supabase.from("artistas").select("*").order("nome");
    if (input.ativos) q = q.eq("ativo", true);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { artistas: data } };
  },
});
