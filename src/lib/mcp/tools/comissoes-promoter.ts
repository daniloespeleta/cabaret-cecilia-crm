import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "comissoes_promoter",
  title: "Comissões de promoter",
  description: "Calcula comissões de promoters com base na guest list e na taxa de cada promoter.",
  inputSchema: {
    evento_id: z.string().uuid().optional().describe("Se informado, filtra por evento."),
  },
  outputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ evento_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let gl = supabase.from("guest_list").select("promoter_id, status, promoters(nome, taxa_comissao)");
    if (evento_id) gl = gl.eq("evento_id", evento_id);
    const { data: convidados, error } = await gl;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const porPromoter: Record<string, { nome: string; taxa: number; presentes: number; total: number }> = {};
    for (const c of convidados ?? []) {
      if (!c.promoter_id) continue;
      const p = c.promoters as unknown as { nome?: string; taxa_comissao?: number } | null;
      porPromoter[c.promoter_id] = porPromoter[c.promoter_id] ?? {
        nome: p?.nome ?? "Promoter",
        taxa: p?.taxa_comissao ?? 0,
        presentes: 0,
        total: 0,
      };
      if (c.status === "entrou") {
        const entry = porPromoter[c.promoter_id];
        entry.presentes += 1;
        entry.total += entry.taxa;
      }
    }
    const resultado = Object.values(porPromoter);
    return {
      content: [{ type: "text", text: JSON.stringify(resultado) }],
      structuredContent: { comissoes: resultado },
    };
  },
});
