import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarEventosFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { apenasProximos?: boolean }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("eventos").select("*").order("data_hora");
    if (data.apenasProximos) q = q.gte("data_hora", new Date().toISOString());
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows;
  });

export const criarEventoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    nome: string; data_hora: string; tipo?: string; artista?: string | null;
    local?: string | null; capacidade?: number | null; status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("eventos")
      .insert({ ...data, criado_por: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const atualizarEventoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    patch: {
      nome?: string; data_hora?: string; tipo?: string; artista?: string | null;
      local?: string | null; capacidade?: number | null; status?: string;
    };
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("eventos")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const excluirEventoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("eventos").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
