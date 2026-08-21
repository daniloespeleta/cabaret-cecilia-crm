import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarComandasFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("comandas")
      .select("*, clientes(nome), eventos(nome)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows;
  });

export const listarItensComandaFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { comanda_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("itens_comanda")
      .select("*")
      .eq("comanda_id", data.comanda_id)
      .order("created_at");
    if (error) throw error;
    return rows;
  });

export const abrirComandaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { cliente_id?: string | null; evento_id?: string | null; mesa?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("comandas")
      .insert({ ...data, status: "aberta", valor_total: 0, criado_por: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const adicionarItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { comanda_id: string; descricao: string; quantidade: number; valor_unitario: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: comanda, error: ce } = await context.supabase
      .from("comandas").select("*").eq("id", data.comanda_id).single();
    if (ce) throw ce;
    if (comanda.status !== "aberta") throw new Error("Comanda não está aberta");
    const novoTotal = comanda.valor_total + data.quantidade * data.valor_unitario;
    const { error: ie } = await context.supabase.from("itens_comanda").insert({
      comanda_id: data.comanda_id, descricao: data.descricao,
      quantidade: data.quantidade, valor_unitario: data.valor_unitario,
    });
    if (ie) throw ie;
    const { data: atualizada, error: ue } = await context.supabase
      .from("comandas").update({ valor_total: novoTotal }).eq("id", data.comanda_id).select().single();
    if (ue) throw ue;
    return atualizada;
  });

export const fecharComandaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("comandas").update({ status: "fechada" }).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });
