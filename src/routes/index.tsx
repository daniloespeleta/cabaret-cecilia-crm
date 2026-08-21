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
  head: () => ({
    meta: [
      { title: "Cabaret da Cecília — CRM" },
      { name: "description", content: "Painel da operação do Cabaret da Cecília: clientes, comandas, atrações, bilheteria e guest list." },
      { property: "og:title", content: "Cabaret da Cecília — CRM" },
      { property: "og:description", content: "Painel da operação do Cabaret da Cecília." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Landing() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 15% 18%, oklch(0.516 0.202 25.9 / 0.22), transparent 60%), radial-gradient(45% 40% at 88% 82%, oklch(0.767 0.139 91.1 / 0.16), transparent 62%)",
        }}
      />
      <div className="relative max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-ring/40 bg-card text-3xl shadow-2xl">
          🎭
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Cabaret da Cecília
          <span className="block text-2xl font-semibold text-primary sm:text-3xl">CRM da casa</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Gerencie fregueses, comandas, atrações, bilheteria e a guest list — tudo em um só
          lugar para a equipe da casa.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <a
            href="/auth?next=/dashboard"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar no painel
          </a>
          <a
            href="/auth?next=/dashboard"
            className="rounded-lg border border-input bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Criar acesso
          </a>
        </div>
      </div>
    </main>
  );
}
