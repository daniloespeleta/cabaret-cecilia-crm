import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "atualizar_artista",
  title: "Atualizar artista",
  description: "Atualiza os dados de uma atração/artista do cabaret.",
  inputSchema: {
    id: z.string().uuid(),
    patch: z.object({
      nome: z.string().min(1).optional(),
      tipo: z.string().optional(),
      contato: z.string().nullable().optional(),
      instagram: z.string().nullable().optional(),
      descricao: z.string().nullable().optional(),
      ativo: z.boolean().optional(),
    }),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("artistas")
      .update(input.patch)
      .eq("id", input.id)
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { artista: data?.[0] } };
  },
});
