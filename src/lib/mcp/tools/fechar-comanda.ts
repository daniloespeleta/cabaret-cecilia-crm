import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "fechar_comanda",
  title: "Fechar comanda",
  description: "Fecha uma comanda aberta, registrando o valor total consumido.",
  inputSchema: {
    comanda_id: z.string().uuid(),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async ({ comanda_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("comandas").update({ status: "fechada" }).eq("id", comanda_id).select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { comanda: data?.[0] } };
  },
});
