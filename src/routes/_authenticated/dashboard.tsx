import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listarComandasFn } from "@/lib/comandas.functions";
import { listarEventosFn } from "@/lib/eventos.functions";
import { listarGuestListFn } from "@/lib/guest-list.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const fetchComandas = useServerFn(listarComandasFn);
  const fetchEventos = useServerFn(listarEventosFn);
  const fetchGuest = useServerFn(listarGuestListFn);

  const { data: comandas = [] } = useQuery({ queryKey: ["comandas"], queryFn: () => fetchComandas({ data: {} }) });
  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => fetchEventos({ data: {} }) });
  const { data: guest = [] } = useQuery({ queryKey: ["guest-list"], queryFn: () => fetchGuest({ data: {} }) });

  const abertas = comandas.filter((c: any) => c.status === "aberta");
  const faturado = comandas.filter((c: any) => c.status === "fechada")
    .reduce((s: number, c: any) => s + Number(c.valor_total || 0), 0);
  const proximos = eventos.filter((e: any) => new Date(e.data_hora) >= new Date());
  const confirmados = guest.filter((g: any) => g.status === "confirmado").length;

  const cards = [
    { label: "Comandas abertas", value: abertas.length, to: "/comandas" },
    { label: "Faturamento (fechadas)", value: `R$ ${faturado.toFixed(2)}`, to: "/comandas" },
    { label: "Próximos eventos", value: proximos.length, to: "/eventos" },
    { label: "Convidados confirmados", value: confirmados, to: "/guest-list" },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da operação da casa.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-ring"
          >
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-2 text-2xl font-bold text-foreground">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Comandas recentes</h2>
          {comandas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma comanda ainda.</p>
          ) : (
            <ul className="space-y-2">
              {comandas.slice(0, 5).map((c: any) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{c.clientes?.nome ?? "Avulsa"}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted-foreground">R$ {Number(c.valor_total || 0).toFixed(2)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === "aberta" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Próximos eventos</h2>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>
          ) : (
            <ul className="space-y-2">
              {proximos.slice(0, 5).map((e: any) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{e.nome}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.data_hora).toLocaleDateString("pt-BR")} · {new Date(e.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
