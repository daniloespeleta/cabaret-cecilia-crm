import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarAuditoriaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entidade?: string; limite?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas a direção pode consultar a auditoria.");

    let q = context.supabase
      .from("auditoria")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limite ?? 100, 300));
    if (data.entidade) q = q.eq("entidade", data.entidade);
    const { data: rows, error } = await q;
    if (error) throw error;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: page } = await supabaseAdmin.auth.admin.listUsers();
    const emails = new Map((page?.users ?? []).map((u) => [u.id, u.email ?? u.phone ?? ""]));

    const eventoIds = new Set<string>();
    const artistaIds = new Set<string>();
    for (const r of rows ?? []) {
      const det = (r.detalhes ?? {}) as Record<string, unknown>;
      if (typeof det["evento_id"] === "string") eventoIds.add(det["evento_id"]);
      if (typeof det["artista_id"] === "string") artistaIds.add(det["artista_id"]);
    }
    const [{ data: eventos }, { data: artistas }] = await Promise.all([
      eventoIds.size
        ? context.supabase.from("eventos").select("id, nome").in("id", [...eventoIds])
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
      artistaIds.size
        ? context.supabase.from("artistas").select("id, nome").in("id", [...artistaIds])
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    ]);
    const nomeEvento = new Map((eventos ?? []).map((e: { id: string; nome: string }) => [e.id, e.nome]));
    const nomeArtista = new Map((artistas ?? []).map((a: { id: string; nome: string }) => [a.id, a.nome]));

    return (rows ?? []).map((r) => {
      const det = (r.detalhes ?? {}) as Record<string, unknown>;
      return {
        id: r.id as string,
        acao: r.acao as string,
        entidade: r.entidade as string,
        entidade_id: r.entidade_id as string | null,
        created_at: r.created_at as string,
        ator: r.ator_id ? emails.get(r.ator_id as string) ?? "sistema" : "sistema",
        evento: typeof det["evento_id"] === "string" ? nomeEvento.get(det["evento_id"]) ?? null : null,
        artista: typeof det["artista_id"] === "string" ? nomeArtista.get(det["artista_id"]) ?? null : null,
        detalhes: det as Record<string, string | number | boolean | null | string[]>,
      };
    });
  });
