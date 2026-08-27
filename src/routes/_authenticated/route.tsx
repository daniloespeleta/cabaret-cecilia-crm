import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { grantFirstAdminFn, statusOnboardingFn } from "@/lib/admin.functions";

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
  { to: "/auditoria", label: "Auditoria", icon: "◎" },
];

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/auth";
}

function Onboarding({
  temAdmin,
  email,
  onAssumir,
  carregando,
  erro,
}: {
  temAdmin: boolean;
  email: string;
  onAssumir: () => void;
  carregando: boolean;
  erro: string | null;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground">
            🎭
          </div>
          <div>
            <div className="font-display text-lg font-bold text-foreground">Cabaret da Cecília</div>
            <div className="text-xs text-muted-foreground">Primeiro acesso · {email}</div>
          </div>
        </div>

        {temAdmin ? (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground">Aguardando liberação</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A direção da casa já foi definida. Peça a quem administra o CRM para liberar seu papel
              (direção, promoter ou operação) na tela de Equipe.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground">Assuma a direção da casa</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ninguém administra este CRM ainda. Ao confirmar, sua conta vira a direção do Cabaret da
              Cecília, com acesso a fregueses, comandas, noites, portaria, bilheteria e liberação da
              equipe.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>★ Acesso total ao painel e às ferramentas de IA</li>
              <li>★ Permissão para cadastrar promoters e operação</li>
              <li>★ Relatórios de faturamento, lotação e comissões</li>
            </ul>
            <button
              onClick={onAssumir}
              disabled={carregando}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {carregando ? "Configurando..." : "Assumir como direção"}
            </button>
          </>
        )}

        {erro && (
          <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </p>
        )}

        <button
          onClick={signOut}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Sair
        </button>
      </div>
    </main>
  );
}

function Layout() {
  const { user } = Route.useRouteContext();
  const fetchStatus = useServerFn(statusOnboardingFn);
  const grantAdmin = useServerFn(grantFirstAdminFn);
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => fetchStatus(),
  });
  const roles = status?.roles ?? [];
  const isAdmin = roles.includes("admin");

  const bootstrapMut = useMutation({
    mutationFn: () => grantAdmin(),
    onSuccess: () => refetch(),
  });

  if (isLoading || !status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Abrindo as cortinas...
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <Onboarding
        temAdmin={status.temAdmin}
        email={status.email || (user.email ?? "")}
        onAssumir={() => bootstrapMut.mutate()}
        carregando={bootstrapMut.isPending}
        erro={bootstrapMut.error ? (bootstrapMut.error as Error).message : null}
      />
    );
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
