import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const programacaoEventoFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { evento_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("evento_artistas")
      .select("*, artista:artistas(*)")
      .eq("evento_id", data.evento_id)
      .order("ordem");
    if (error) throw error;
    return rows;
  });

export const adicionarArtistaEventoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    evento_id: string; artista_id: string;
    horario?: string | null; cache?: number; ordem?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("evento_artistas")
      .insert({
        evento_id: data.evento_id,
        artista_id: data.artista_id,
        horario: data.horario ?? null,
        cache: data.cache ?? 0,
        ordem: data.ordem ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const removerArtistaEventoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("evento_artistas").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
