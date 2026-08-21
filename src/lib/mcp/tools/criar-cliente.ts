import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "criar_cliente",
  title: "Criar cliente",
  description: "Cadastra um novo cliente no CRM da casa noturna.",
  inputSchema: {
    nome: z.string().trim().min(1),
    telefone: z.string().optional(),
    email: z.string().email().optional(),
    preferencias: z.string().optional().describe("Preferências do cliente (bebidas, música, mesa etc)."),
    tags: z.array(z.string()).optional().describe("Etiquetas: vip, regular, primeira_vez etc."),
    observacoes: z.string().optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async ({ nome, telefone, email, preferencias, tags, observacoes }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nome, telefone, email, preferencias, tags, observacoes, criado_por: ctx.getUserId() })
      .select();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { cliente: data?.[0] } };
  },
});
