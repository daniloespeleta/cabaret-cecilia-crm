import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarClientesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { busca?: string }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("clientes").select("*").order("nome").limit(200);
    if (data.busca) q = q.ilike("nome", `%${data.busca}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows;
  });

export const criarClienteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    nome: string; telefone?: string | null; email?: string | null;
    preferencias?: string | null; tags?: string[] | null; observacoes?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("clientes")
      .insert({ ...data, criado_por: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const atualizarClienteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("clientes")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const excluirClienteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clientes").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
