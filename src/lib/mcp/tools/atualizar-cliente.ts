import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "atualizar_cliente",
  title: "Atualizar cliente",
  description: "Atualiza os dados de um cliente existente no CRM.",
  inputSchema: {
    cliente_id: z.string().uuid(),
    nome: z.string().trim().min(1).optional(),
    telefone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    preferencias: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    observacoes: z.string().nullable().optional(),
  },
  outputSchema: {},
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const patch: Record<string, unknown> = {};
    for (const k of ["nome", "telefone", "email", "preferencias", "tags", "observacoes"] as const) {
      if (k in input) patch[k] = input[k];
    }
    const { data, error } = await supabase.from("clientes").update(patch).eq("id", input.cliente_id).select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { cliente: data?.[0] } };
  },
});
