import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarArtistasFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ativos?: boolean } = {}) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("artistas").select("*").order("nome");
    if (data.ativos) q = q.eq("ativo", true);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows;
  });

export const criarArtistaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    nome: string; tipo?: string; contato?: string | null;
    instagram?: string | null; descricao?: string | null; ativo?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("artistas")
      .insert({ ...data, criado_por: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const atualizarArtistaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    patch: { nome?: string; tipo?: string; contato?: string | null; instagram?: string | null; descricao?: string | null; ativo?: boolean };
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("artistas")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const excluirArtistaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("artistas").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
