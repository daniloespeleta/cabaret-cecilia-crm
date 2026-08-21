import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "criar_evento",
  title: "Criar evento",
  description: "Cria um novo evento/atração (festa, DJ, artista) na casa noturna.",
  inputSchema: {
    nome: z.string().trim().min(1),
    data_hora: z.string().datetime().describe("Data e hora do evento em ISO 8601."),
    tipo: z.string().default("festa"),
    artista: z.string().optional(),
    local: z.string().optional(),
    capacidade: z.number().int().optional(),
    status: z.string().default("agendado"),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("eventos")
      .insert({ ...input, criado_por: ctx.getUserId() })
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { evento: data?.[0] } };
  },
});
