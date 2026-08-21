import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "vender_ingresso",
  title: "Vender ingresso",
  description: "Registra a venda de ingressos de um tipo para um evento, sem exceder a quantidade disponível.",
  inputSchema: {
    id: z.string().uuid(),
    qtd: z.number().int().min(1).default(1).describe("Quantidade de ingressos vendidos."),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: ing, error: err } = await supabase
      .from("ingressos")
      .select("*")
      .eq("id", input.id)
      .single();
    if (err) return { content: [{ type: "text", text: err.message }], isError: true };
    const novos = (ing?.vendidos ?? 0) + input.qtd;
    if (novos > (ing?.quantidade ?? 0)) {
      return { content: [{ type: "text", text: "Venda excede a quantidade disponível deste ingresso." }], isError: true };
    }
    const { data, error } = await supabase
      .from("ingressos")
      .update({ vendidos: novos })
      .eq("id", input.id)
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { ingresso: data?.[0] } };
  },
});
