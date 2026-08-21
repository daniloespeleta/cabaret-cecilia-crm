import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "criar_artista",
  title: "Criar artista",
  description: "Cadastra uma nova atração/artista do cabaret (drag, burlesca, DJ, músico, MC).",
  inputSchema: {
    nome: z.string().trim().min(1),
    tipo: z.string().default("outro").describe("drag, burlesca, mc, danca, musica, teatro, outro"),
    contato: z.string().optional(),
    instagram: z.string().optional(),
    descricao: z.string().optional(),
    ativo: z.boolean().default(true),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("artistas")
      .insert({ ...input, criado_por: ctx.getUserId() })
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { artista: data?.[0] } };
  },
});
