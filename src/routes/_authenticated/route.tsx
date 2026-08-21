import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { meusRolesFn } from "@/lib/promoters.functions";
import { grantFirstAdminFn } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { next: "/dashboard" } });
    return { user: data.user };
  },
  component: Layout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/clientes", label: "Fregueses", icon: "◈" },
  { to: "/comandas", label: "Comandas", icon: "▤" },
  { to: "/eventos", label: "Noites & Atrações", icon: "♫" },
  { to: "/atracoes", label: "Atrações", icon: "★" },
  { to: "/guest-list", label: "Portaria", icon: "◉" },
  { to: "/promoters", label: "Promoters", icon: "✦" },
  { to: "/equipe", label: "Equipe", icon: "☰" },
];

function Layout() {
  const { user } = Route.useRouteContext();
  const fetchRoles = useServerFn(meusRolesFn);
  const grantAdmin = useServerFn(grantFirstAdminFn);
  const { data: roles = [], refetch } = useQuery({ queryKey: ["meus-roles"], queryFn: () => fetchRoles() });
  const isAdmin = roles.includes("admin");

  const bootstrapMut = useMutation({
    mutationFn: () => grantAdmin(),
    onSuccess: () => refetch(),
  });
  useEffect(() => {
    if (!isAdmin) bootstrapMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground">
            🎭
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-sidebar-foreground">Cabaret da Cecília</div>
            <div className="text-xs text-sidebar-foreground/60">CRM</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 truncate text-sm font-medium text-sidebar-foreground">
            {user.email}
            {isAdmin && (
              <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={signOut}
            className="w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
