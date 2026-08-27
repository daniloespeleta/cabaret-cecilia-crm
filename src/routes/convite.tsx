import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { verConviteFn, aceitarConviteFn } from "@/lib/convites.functions";

const ROLE_LABEL: Record<string, string> = {
  admin: "Direção (acesso total)",
  promoter: "Promoter (guest list e comissões)",
  staff: "Operação (portaria, comandas e bilheteria)",
};

export const Route = createFileRoute("/convite")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s["token"] === "string" ? s["token"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Convite da equipe | Cabaret da Cecília" },
      { name: "description", content: "Aceite seu convite e receba as permissões da equipe do Cabaret da Cecília." },
      { property: "og:title", content: "Convite da equipe | Cabaret da Cecília" },
      { property: "og:description", content: "Aceite seu convite para o CRM do Cabaret da Cecília." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConvitePage,
});

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground">
            🎭
          </div>
          <div>
            <div className="font-display text-lg font-bold text-foreground">Cabaret da Cecília</div>
            <div className="text-xs text-muted-foreground">Convite da equipe</div>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

function ConvitePage() {
  const { token } = Route.useSearch();
  const [logado, setLogado] = useState<boolean | null>(null);
  const ver = useServerFn(verConviteFn);
  const aceitar = useServerFn(aceitarConviteFn);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLogado(Boolean(data.user)));
  }, []);

  const { data: convite, isLoading } = useQuery({
    queryKey: ["convite", token],
    queryFn: () => ver({ data: { token } }),
    enabled: Boolean(token) && logado === true,
  });

  const aceitarMut = useMutation({
    mutationFn: () => aceitar({ data: { token } }),
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
  });

  if (!token) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">Link de convite inválido: falta o código do convite.</p>
      </Card>
    );
  }

  if (logado === null || (logado && isLoading)) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">Conferindo seu convite...</p>
      </Card>
    );
  }

  if (!logado) {
    return (
      <Card>
        <h1 className="font-display text-2xl font-bold text-foreground">Entre para aceitar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Faça login com o e-mail que recebeu o convite e você voltará para esta página.
        </p>
        <a
          href={`/auth?next=${encodeURIComponent(`/convite?token=${token}`)}`}
          className="mt-6 block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Entrar
        </a>
      </Card>
    );
  }

  if (!convite?.encontrado) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">Convite não encontrado. Peça um novo link à direção da casa.</p>
      </Card>
    );
  }

  const bloqueio =
    convite.status === "aceito"
      ? "Este convite já foi aceito."
      : convite.status === "revogado"
        ? "Este convite foi revogado pela direção."
        : convite.expirado
          ? "Este convite expirou."
          : !convite.emailConfere
            ? `Este convite é para ${convite.email}. Você está logado como ${convite.meuEmail}.`
            : null;

  return (
    <Card>
      <h1 className="font-display text-2xl font-bold text-foreground">Você foi convidado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Convite para <span className="text-foreground">{convite.email}</span>. Ao aceitar, você recebe as
        permissões abaixo no CRM da casa.
      </p>
      <ul className="mt-4 space-y-2">
        {convite.roles.map((r) => (
          <li key={r} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
            ★ {ROLE_LABEL[r] ?? r}
          </li>
        ))}
      </ul>

      {bloqueio ? (
        <p role="alert" className="mt-6 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {bloqueio}
        </p>
      ) : (
        <button
          onClick={() => aceitarMut.mutate()}
          disabled={aceitarMut.isPending}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {aceitarMut.isPending ? "Aceitando..." : "Aceitar convite e entrar"}
        </button>
      )}

      {aceitarMut.error && (
        <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(aceitarMut.error as Error).message}
        </p>
      )}
    </Card>
  );
}
