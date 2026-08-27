import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listarUsuariosRolesFn, gerenciarRoleFn } from "@/lib/admin.functions";
import { listarConvitesFn, criarConviteFn, revogarConviteFn } from "@/lib/convites.functions";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe e permissões | Cabaret da Cecília" },
      {
        name: "description",
        content: "Gerencie papéis, permissões e convites da equipe do Cabaret da Cecília.",
      },
      { property: "og:title", content: "Equipe e permissões | Cabaret da Cecília" },
      { property: "og:description", content: "Papéis, permissões e convites da equipe da casa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EquipePage,
});

type Role = "admin" | "promoter" | "staff";

const ROLE_LABEL: Record<string, string> = {
  admin: "Direção",
  promoter: "Promoter",
  staff: "Operação",
};

const ROLE_DESC: Record<Role, string> = {
  admin: "Acesso total: equipe, convites, auditoria, faturamento e todos os módulos.",
  promoter: "Guest list própria, fregueses, noites e acompanhamento de comissões.",
  staff: "Portaria, comandas, bilheteria e cadastro de fregueses.",
};

function ConvitesSection() {
  const queryClient = useQueryClient();
  const fetchConvites = useServerFn(listarConvitesFn);
  const criar = useServerFn(criarConviteFn);
  const revogar = useServerFn(revogarConviteFn);

  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>(["staff"]);
  const [copiado, setCopiado] = useState<string | null>(null);

  const { data: convites = [] } = useQuery({ queryKey: ["convites"], queryFn: () => fetchConvites() });

  const criarMut = useMutation({
    mutationFn: () => criar({ data: { email, roles } }),
    onSuccess: () => {
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["convites"] });
    },
  });

  const revogarMut = useMutation({
    mutationFn: (id: string) => revogar({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["convites"] }),
  });

  function link(token: string) {
    return `${window.location.origin}/convite?token=${token}`;
  }

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-bold text-foreground">Convidar por e-mail</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Gere um convite com as permissões já definidas. A pessoa confirma ao entrar com o e-mail convidado.
      </p>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@daequipe.com"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => criarMut.mutate()}
            disabled={criarMut.isPending || !email}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {criarMut.isPending ? "Gerando..." : "Gerar convite"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["admin", "promoter", "staff"] as const).map((role) => {
            const on = roles.includes(role);
            return (
              <button
                key={role}
                title={ROLE_DESC[role]}
                onClick={() => setRoles((rs) => (on ? rs.filter((r) => r !== role) : [...rs, role]))}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "bg-primary text-primary-foreground"
                    : "border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {on ? "✓ " : "+ "}
                {ROLE_LABEL[role]}
              </button>
            );
          })}
        </div>

        {criarMut.error && (
          <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {(criarMut.error as Error).message}
          </p>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {convites.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum convite enviado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {convites.map((c: any) => (
              <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{c.email}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                    <span
                      className={`rounded px-2 py-0.5 font-medium ${
                        c.status === "aceito"
                          ? "bg-primary/15 text-primary"
                          : c.status === "revogado"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                    {(c.roles ?? []).map((r: string) => (
                      <span key={r} className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                        {ROLE_LABEL[r] ?? r}
                      </span>
                    ))}
                    <span className="text-muted-foreground">
                      expira {new Date(c.expira_em).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                {c.status === "pendente" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(link(c.token));
                        setCopiado(c.id);
                      }}
                      className="rounded-lg border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {copiado === c.id ? "Link copiado" : "Copiar link"}
                    </button>
                    <a
                      href={`mailto:${c.email}?subject=${encodeURIComponent("Convite — CRM Cabaret da Cecília")}&body=${encodeURIComponent(`Você foi convidado para o CRM do Cabaret da Cecília.\n\nAcesse: ${typeof window !== "undefined" ? link(c.token) : ""}`)}`}
                      className="rounded-lg border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Enviar por e-mail
                    </a>
                    <button
                      onClick={() => revogarMut.mutate(c.id)}
                      className="rounded-lg border border-input px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    >
                      Revogar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function EquipePage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listarUsuariosRolesFn);
  const gerenciar = useServerFn(gerenciarRoleFn);

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-roles"],
    queryFn: () => fetchUsers(),
  });

  const toggleMut = useMutation({
    mutationFn: ({ user_id, role, grant }: { user_id: string; role: Role; grant: boolean }) =>
      gerenciar({ data: { user_id, role, grant } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios-roles"] }),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Equipe & permissões</h1>
        <p className="mt-1 text-muted-foreground">
          Defina quem é direção, promoter ou operação e convide novas pessoas para a casa.
        </p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {(["admin", "promoter", "staff"] as const).map((r) => (
          <div key={r} className="rounded-2xl border border-border bg-card p-4">
            <div className="font-display text-sm font-bold text-foreground">{ROLE_LABEL[r]}</div>
            <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESC[r]}</p>
          </div>
        ))}
      </div>

      <ConvitesSection />

      <h2 className="font-display text-xl font-bold text-foreground">Pessoas com acesso</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {usuarios.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {usuarios.map((u: any) => (
              <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-foreground">{u.email}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {u.roles.length === 0 && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">sem papel</span>
                    )}
                    {u.roles.map((r: string) => (
                      <span key={r} className="rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        {ROLE_LABEL[r] ?? r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["admin", "promoter", "staff"] as const).map((role) => {
                    const has = u.roles.includes(role);
                    return (
                      <button
                        key={role}
                        title={ROLE_DESC[role]}
                        onClick={() => toggleMut.mutate({ user_id: u.id, role, grant: !has })}
                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          has
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {has ? "✓ " : "+ "}
                        {ROLE_LABEL[role]}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
