import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarIngressosFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { evento_id?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("ingressos").select("*");
    if (data.evento_id) q = q.eq("evento_id", data.evento_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows;
  });

export const criarIngressoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { evento_id: string; tipo: string; preco?: number; quantidade?: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ingressos")
      .insert({
        evento_id: data.evento_id,
        tipo: data.tipo,
        preco: data.preco ?? 0,
        quantidade: data.quantidade ?? 0,
        criado_por: context.userId,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const venderIngressoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; qtd?: number }) => d)
  .handler(async ({ data, context }) => {
    const qtd = data.qtd ?? 1;
    const { data: ing, error: err } = await context.supabase
      .from("ingressos")
      .select("*")
      .eq("id", data.id)
      .single();
    if (err) throw err;
    const novos = (ing?.vendidos ?? 0) + qtd;
    if (novos > (ing?.quantidade ?? 0)) {
      throw new Error("Venda excede a quantidade disponível deste ingresso.");
    }
    const { data: row, error } = await context.supabase
      .from("ingressos")
      .update({ vendidos: novos })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const lotacaoEventosFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ingressos, error } = await context.supabase
      .from("ingressos")
      .select("evento_id, vendidos");
    if (error) throw error;
    const porEvento: Record<string, number> = {};
    for (const i of ingressos ?? []) {
      porEvento[i.evento_id] = (porEvento[i.evento_id] ?? 0) + Number(i.vendidos ?? 0);
    }
    return porEvento;
  });
