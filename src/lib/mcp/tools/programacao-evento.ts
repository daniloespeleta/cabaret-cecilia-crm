import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "programacao_evento",
  title: "Programação de uma noite",
  description: "Lista a programação de atrações/artistas de um evento (noite), com horário e cachê.",
  inputSchema: {
    evento_id: z.string().uuid(),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("evento_artistas")
      .select("*, artista:artistas(*)")
      .eq("evento_id", input.evento_id)
      .order("ordem");
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { programacao: data } };
  },
});
