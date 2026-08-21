import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "adicionar_artista_evento",
  title: "Adicionar artista a uma noite",
  description: "Vincula uma atração/artista a um evento (noite), com horário de apresentação e cachê.",
  inputSchema: {
    evento_id: z.string().uuid(),
    artista_id: z.string().uuid(),
    horario: z.string().datetime().optional().describe("Início da apresentação em ISO 8601."),
    cache: z.number().optional().describe("Cachê em reais."),
    ordem: z.number().int().optional(),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("evento_artistas")
      .insert({
        evento_id: input.evento_id,
        artista_id: input.artista_id,
        horario: input.horario ?? null,
        cache: input.cache ?? 0,
        ordem: input.ordem ?? 0,
      })
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { vinculo: data?.[0] } };
  },
});
