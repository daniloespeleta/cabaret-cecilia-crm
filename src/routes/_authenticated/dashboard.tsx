import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listarComandasFn } from "@/lib/comandas.functions";
import { listarEventosFn } from "@/lib/eventos.functions";
import { listarGuestListFn } from "@/lib/guest-list.functions";
import { lotacaoEventosFn } from "@/lib/bilheteria.functions";
import { programacaoEventoFn } from "@/lib/atracoes.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const fetchComandas = useServerFn(listarComandasFn);
  const fetchEventos = useServerFn(listarEventosFn);
  const fetchGuest = useServerFn(listarGuestListFn);
  const fetchLotacao = useServerFn(lotacaoEventosFn);
  const fetchProg = useServerFn(programacaoEventoFn);

  const { data: comandas = [] } = useQuery({ queryKey: ["comandas"], queryFn: () => fetchComandas({ data: {} }) });
  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => fetchEventos({ data: {} }) });
  const { data: guest = [] } = useQuery({ queryKey: ["guest-list"], queryFn: () => fetchGuest({ data: {} }) });
  const { data: lotacao = {} } = useQuery({ queryKey: ["lotacao"], queryFn: () => fetchLotacao() });

  const proximos = eventos.filter((e: any) => new Date(e.data_hora) >= new Date())
    .sort((a: any, b: any) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  const proximo = proximos[0];
  const { data: progProximo = [] } = useQuery({
    queryKey: ["programacao", proximo?.id],
    queryFn: () => (proximo ? fetchProg({ data: { evento_id: proximo.id } }) : Promise.resolve([])),
    enabled: !!proximo,
  });

  const abertas = comandas.filter((c: any) => c.status === "aberta");
  const faturado = comandas.filter((c: any) => c.status === "fechada")
    .reduce((s: number, c: any) => s + Number(c.valor_total || 0), 0);
  const confirmados = guest.filter((g: any) => g.status === "confirmado").length;

  const totalVendidos = proximos.reduce((s: number, e: any) => s + Number(lotacao[e.id] ?? 0), 0);
  const totalCapacidade = proximos.reduce((s: number, e: any) => s + Number(e.capacidade ?? 0), 0);
  const lotacaoPct = totalCapacidade ? Math.round((totalVendidos / totalCapacidade) * 100) : null;

  const cards = [
    { label: "Comandas abertas", value: abertas.length, to: "/comandas" },
    { label: "Faturamento (fechadas)", value: `R$ ${faturado.toFixed(2)}`, to: "/comandas" },
    { label: "Próximas noites", value: proximos.length, to: "/eventos" },
    { label: "Convidados confirmados", value: confirmados, to: "/guest-list" },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da operação do cabaret.</p>
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
          <h2 className="mb-3 text-lg font-semibold text-foreground">Lotação das próximas noites</h2>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma noite agendada.</p>
          ) : (
            <>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">{totalVendidos} de {totalCapacidade} ingressos vendidos</span>
                <span className="font-semibold text-foreground">{lotacaoPct !== null ? `${lotacaoPct}%` : "—"}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${lotacaoPct !== null && lotacaoPct >= 90 ? "bg-destructive" : lotacaoPct !== null && lotacaoPct >= 70 ? "bg-primary" : "bg-secondary"}`}
                  style={{ width: `${Math.min(lotacaoPct ?? 0, 100)}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {proximos.slice(0, 5).map((e: any) => {
                  const v = Number(lotacao[e.id] ?? 0);
                  const cap = e.capacidade ?? null;
                  const p = cap ? Math.round((v / cap) * 100) : null;
                  return (
                    <li key={e.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{e.nome}</span>
                      <span className="text-muted-foreground">{v}{cap ? `/${cap}` : ""}{p !== null ? ` · ${p}%` : ""}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Próximas noites</h2>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma noite agendada.</p>
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

          <h3 className="mt-6 mb-3 text-lg font-semibold text-foreground">Próxima atração</h3>
          {!proximo ? (
            <p className="text-sm text-muted-foreground">Sem agenda definida.</p>
          ) : progProximo.length === 0 ? (
            <p className="text-sm text-muted-foreground">{proximo.nome} ainda sem atrações escaladas.</p>
          ) : (
            <ul className="space-y-2">
              {progProximo.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{s.artista?.nome ?? "Artista"}</span>
                  <span className="text-muted-foreground">
                    {s.horario ? new Date(s.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    {Number(s.cache) > 0 ? ` · R$ ${Number(s.cache).toFixed(2)}` : ""}
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
