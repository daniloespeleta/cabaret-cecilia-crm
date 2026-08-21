import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
    return {};
  },
  component: Landing,
});

function Landing() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 20%, rgba(139,92,246,0.20), transparent 60%), radial-gradient(50% 45% at 85% 80%, rgba(236,72,153,0.16), transparent 60%)",
        }}
      />
      <div className="relative max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-2xl">
          ♫
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Casa Noturna <span className="text-primary">CRM</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Gerencie clientes, comandas, eventos e a guest list — tudo em um só lugar para a equipe da casa.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            href="/auth?next=/dashboard"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar no painel
          </a>
          <a
            href="/auth?next=/dashboard"
            className="rounded-lg border border-input bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Criar acesso
          </a>
        </div>
      </div>
    </main>
  );
}
