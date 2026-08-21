import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    // data is OAuthAuthorizationDetails | OAuthRedirect; when it's an OAuthRedirect
    // the user already consented and we can bounce immediately.
    if (data && "redirect_url" in data) throw redirect({ href: data.redirect_url });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Não foi possível carregar a autorização</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "o aplicativo";
  const email = details?.user?.email ?? "";

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error: err } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorization_id)
      : await supabase.auth.oauth.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url;
    if (!target) {
      setBusy(false);
      setError("Nenhum redirecionamento retornado pelo servidor de autorização.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <div className="mb-2 h-2 w-16 rounded-full bg-primary" />
          <h1 className="text-2xl font-bold text-foreground">Conectar {clientName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Isso permite que {clientName} use o CRM da casa noturna como você.
          </p>
        </div>

        {email && (
          <div className="mb-4 rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
            Conta conectada: <span className="font-medium">{email}</span>
          </div>
        )}

        <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
          <li>• Compartilhar seu perfil básico</li>
          <li>• Compartilhar seu e-mail</li>
          <li>• Chamar as ferramentas do CRM enquanto você estiver conectado</li>
        </ul>

        <p className="mb-6 text-xs text-muted-foreground">
          Isso não ignora as permissões do app nem as políticas do banco de dados.
        </p>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancelar conexão
          </button>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Processando…" : "Aprovar"}
          </button>
        </div>
      </div>
    </main>
  );
}
