import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "admin" | "promoter" | "staff";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Apenas a direção pode gerenciar convites.");
}

export const listarConvitesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("convites")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const criarConviteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; roles: Role[] }) => {
    const email = d.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Informe um e-mail válido.");
    if (!d.roles.length) throw new Error("Escolha ao menos um papel para o convite.");
    return { email, roles: d.roles };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("convites")
      .insert({ email: data.email, roles: data.roles, convidado_por: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const revogarConviteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("convites")
      .update({ status: "revogado" })
      .eq("id", data.id)
      .eq("status", "pendente");
    if (error) throw error;
    return { ok: true };
  });

// Consulta pública para o convidado logado: usa service_role porque o convidado
// ainda não tem papel algum e não enxerga a tabela por RLS.
export const verConviteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: convite } = await supabaseAdmin
      .from("convites")
      .select("id, email, roles, status, expira_em")
      .eq("token", data.token)
      .maybeSingle();
    if (!convite) return { encontrado: false as const };
    const meuEmail = ((context.claims as { email?: string } | null)?.email ?? "").toLowerCase();
    return {
      encontrado: true as const,
      email: convite.email,
      roles: convite.roles as Role[],
      status: convite.status,
      expirado: new Date(convite.expira_em).getTime() < Date.now(),
      emailConfere: meuEmail === convite.email.toLowerCase(),
      meuEmail,
    };
  });

export const aceitarConviteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: convite } = await supabaseAdmin
      .from("convites")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!convite) throw new Error("Convite não encontrado.");
    if (convite.status !== "pendente") throw new Error("Este convite já foi usado ou revogado.");
    if (new Date(convite.expira_em).getTime() < Date.now()) throw new Error("Este convite expirou.");
    const meuEmail = ((context.claims as { email?: string } | null)?.email ?? "").toLowerCase();
    if (meuEmail !== convite.email.toLowerCase()) {
      throw new Error("Este convite foi enviado para outro e-mail. Entre com a conta convidada.");
    }
    const roles = (convite.roles ?? []) as Role[];
    if (roles.length) {
      const { error } = await supabaseAdmin.from("user_roles").upsert(
        roles.map((role) => ({ user_id: context.userId, role })),
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
      if (error) throw error;
    }
    await supabaseAdmin
      .from("convites")
      .update({ status: "aceito", aceito_por: context.userId, aceito_em: new Date().toISOString() })
      .eq("id", convite.id);
    await supabaseAdmin.from("auditoria").insert({
      ator_id: context.userId,
      acao: "convite_aceito",
      entidade: "convites",
      entidade_id: convite.id,
      detalhes: { email: convite.email, roles },
    });
    return { ok: true, roles };
  });
