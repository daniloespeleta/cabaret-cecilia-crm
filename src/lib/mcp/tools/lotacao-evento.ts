import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "lotacao_evento",
  title: "Lotação de um evento",
  description: "Informa a lotação de um evento: ingressos vendidos vs. quantidade e capacidade da casa.",
  inputSchema: {
    evento_id: z.string().uuid(),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: ingressos, error } = await supabase
      .from("ingressos")
      .select("tipo, preco, quantidade, vendidos")
      .eq("evento_id", input.evento_id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const { data: evento, error: evErr } = await supabase
      .from("eventos")
      .select("nome, capacidade")
      .eq("id", input.evento_id)
      .single();
    if (evErr) return { content: [{ type: "text", text: evErr.message }], isError: true };
    const vendidos = (ingressos ?? []).reduce((s, i) => s + Number(i.vendidos ?? 0), 0);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ evento: evento?.nome, capacidade: evento?.capacidade ?? null, vendidos, ingressos }),
      }],
      structuredContent: { evento: evento?.nome, capacidade: evento?.capacidade ?? null, vendidos, ingressos },
    };
  },
});
