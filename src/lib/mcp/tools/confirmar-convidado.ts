import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "confirmar_convidado",
  title: "Confirmar convidado",
  description: "Altera o status de um convidado da guest list (pendente, confirmado, entrou, nao_compareceu).",
  inputSchema: {
    convidado_id: z.string().uuid(),
    status: z.enum(["pendente", "confirmado", "entrou", "nao_compareceu"]),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async ({ convidado_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("guest_list").update({ status }).eq("id", convidado_id).select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { convidado: data?.[0] } };
  },
});
