import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listarUsuariosRolesFn, gerenciarRoleFn } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/equipe")({
  component: EquipePage,
});

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  promoter: "Promoter",
  staff: "Operação",
};

function EquipePage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listarUsuariosRolesFn);
  const gerenciar = useServerFn(gerenciarRoleFn);

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-roles"],
    queryFn: () => fetchUsers(),
  });

  const toggleMut = useMutation({
    mutationFn: ({ user_id, role, grant }: { user_id: string; role: "admin" | "promoter" | "staff"; grant: boolean }) =>
      gerenciar({ data: { user_id, role, grant } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios-roles"] }),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Equipe</h1>
        <p className="mt-1 text-muted-foreground">Atribua papéis (admin, promoter, operação) aos usuários do sistema.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
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
