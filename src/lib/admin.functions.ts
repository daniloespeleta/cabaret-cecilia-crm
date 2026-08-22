import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Concede papel admin ao primeiro usuário que entrar no sistema, quando ainda
// não existe nenhum admin. Bootstrap legítimo e privilegiado (usa service_role).
export const grantFirstAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw countError;
    if ((count ?? 0) > 0) return { granted: false };
    const { error } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: context.userId, role: "admin" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
    if (error) throw error;
    return { granted: true };
  });

// Estado do onboarding: papéis do usuário atual e se a casa já tem uma direção.
export const statusOnboardingFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw error;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    return {
      roles: (roles ?? []).map((r) => r.role as string),
      temAdmin: (count ?? 0) > 0,
      email: (context.claims as { email?: string } | null)?.email ?? "",
    };
  });

// Atribui/remove papéis. Somente admin. Usa service_role para escrita segura
// (user_roles não tem política INSERT para o próprio usuário).
export const gerenciarRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; role: "admin" | "promoter" | "staff"; grant: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas admin pode gerenciar papéis.");
    if (data.grant) {
      const { error } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: data.user_id, role: data.role },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw error;
    }
    return { ok: true };
  });

// Lista usuários com seus papéis para a tela de administração (admin).
export const listarUsuariosRolesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas admin pode listar papéis.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: page, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const byUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    }
    return (page.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? u.phone ?? "",
      roles: byUser.get(u.id) ?? [],
    }));
  });
