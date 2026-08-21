import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listarPromotersFn } from "@/lib/promoters.functions";
import { listarComandasFn } from "@/lib/comandas.functions";
import { listarGuestListFn } from "@/lib/guest-list.functions";

export const Route = createFileRoute("/_authenticated/promoters")({
  component: PromotersPage,
});

function PromotersPage() {
  const fetchPromoters = useServerFn(listarPromotersFn);
  const fetchComandas = useServerFn(listarComandasFn);
  const fetchGuest = useServerFn(listarGuestListFn);

  const { data: promoters = [] } = useQuery({ queryKey: ["promoters"], queryFn: () => fetchPromoters() });
  const { data: comandas = [] } = useQuery({ queryKey: ["comandas"], queryFn: () => fetchComandas() });
  const { data: guest = [] } = useQuery({ queryKey: ["guest-list"], queryFn: () => fetchGuest() });

  const promotersById = new Map(promoters.map((p: any) => [p.id, p]));

  const stats = promoters.map((p: any) => {
    const trazidos = guest.filter((g: any) => g.promoter_id === p.id && g.status === "entrou").length;
    const comissoes = comandas
      .filter((c: any) => c.promoter_id === p.id && c.status === "fechada")
      .reduce((s: number, c: any) => s + Number(c.valor_total || 0) * Number(p.taxa_comissao || 0) / 100, 0);
    return { ...p, trazidos, comissoes };
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Promoters</h1>
        <p className="mt-1 text-muted-foreground">Desempenho: convidados trazidos e comissões estimadas.</p>
      </header>

      {promoters.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Nenhum promoter cadastrado. Eles são criados via ferramentas MCP ou pelo banco de dados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{p.nome}</h3>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {p.taxa_comissao ?? 0}%
                </span>
              </div>
              {p.telefone && <div className="mt-1 text-sm text-muted-foreground">{p.telefone}</div>}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Convidados (entraram)</div>
                  <div className="text-xl font-bold text-foreground">{p.trazidos}</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Comissões estimadas</div>
                  <div className="text-xl font-bold text-foreground">R$ {p.comissoes.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {promotersById.size ? `${promotersById.size} promoters ativos` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
