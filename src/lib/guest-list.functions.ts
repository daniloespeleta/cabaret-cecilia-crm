import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarGuestListFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { evento_id?: string }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("guest_list")
      .select("*, promoters(nome), eventos(nome, data_hora)")
      .order("created_at");
    if (data.evento_id) q = q.eq("evento_id", data.evento_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows;
  });

export const adicionarConvidadoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { evento_id: string; nome: string; telefone?: string | null; promoter_id?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guest_list")
      .insert({ ...data, status: "pendente", criado_por: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const atualizarConvidadoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    patch: {
      status?: "pendente" | "confirmado" | "entrou" | "nao_compareceu";
      telefone?: string | null; nome?: string; promoter_id?: string | null;
    };
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guest_list").update(data.patch).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });
