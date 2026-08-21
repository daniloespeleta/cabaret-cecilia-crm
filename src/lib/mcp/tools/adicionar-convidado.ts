import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "adicionar_convidado",
  title: "Adicionar convidado",
  description: "Adiciona um convidado à guest list de um evento.",
  inputSchema: {
    evento_id: z.string().uuid(),
    nome: z.string().trim().min(1),
    telefone: z.string().optional(),
    promoter_id: z.string().uuid().optional().describe("ID do promoter responsável pelo convidado."),
  },
  annotations: { readOnlyHint: false },
  handler: async ({ evento_id, nome, telefone, promoter_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("guest_list")
      .insert({ evento_id, nome, telefone, promoter_id, status: "pendente", criado_por: ctx.getUserId() })
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { convidado: data?.[0] } };
  },
});
