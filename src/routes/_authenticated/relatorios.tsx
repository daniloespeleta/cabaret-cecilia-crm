import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listarEventosFn } from "@/lib/eventos.functions";
import { relatorioNoiteFn } from "@/lib/relatorios.functions";
import { brl, exportarCSV, exportarPDF, type Coluna } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios por noite | Cabaret da Cecília" },
      {
        name: "description",
        content:
          "Lotação, receita por lote e taxa de conversão por canal de cada noite do Cabaret da Cecília, com gráficos e exportação em CSV e PDF.",
      },
      { property: "og:title", content: "Relatórios por noite | Cabaret da Cecília" },
      { property: "og:description", content: "Performance de lotação, receita e conversão de cada noite da casa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RelatoriosPage,
});

const CORES = ["#d4af37", "#c1121f", "#f5e6c8", "#8d6e2f", "#7a1220", "#b9a06a"];

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function RelatoriosPage() {
  const fetchEventos = useServerFn(listarEventosFn);
  const fetchRelatorio = useServerFn(relatorioNoiteFn);
  const [eventoId, setEventoId] = useState("");

  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => fetchEventos({ data: {} }) });
  const evId = eventoId || (eventos[0]?.id ?? "");

  const { data: rel } = useQuery({
    queryKey: ["relatorio-noite", evId],
    queryFn: () => fetchRelatorio({ data: { evento_id: evId } }),
    enabled: !!evId,
  });

  const colsLotes: Coluna<NonNullable<typeof rel>["lotes"][number]>[] = [
    { header: "Lote", get: (l) => l.tipo },
    { header: "Preço", get: (l) => l.preco.toFixed(2) },
    { header: "Disponível", get: (l) => l.quantidade },
    { header: "Vendidos", get: (l) => l.vendidos },
    { header: "Receita", get: (l) => l.receita.toFixed(2) },
  ];

  const colsCanais: Coluna<NonNullable<typeof rel>["canais"][number]>[] = [
    { header: "Canal", get: (c) => c.canal },
    { header: "Convidados", get: (c) => c.convidados },
    { header: "Entraram", get: (c) => c.entraram },
    { header: "Conversão %", get: (c) => c.conversao },
  ];

  const colsProg: Coluna<NonNullable<typeof rel>["programacao"][number]>[] = [
    { header: "Artista", get: (p) => p.artista },
    { header: "Horário", get: (p) => (p.horario ? new Date(p.horario).toLocaleString("pt-BR") : "—") },
    { header: "Cachê", get: (p) => p.cache.toFixed(2) },
  ];

  const nomeNoite = rel ? `${rel.evento.nome} — ${new Date(rel.evento.data_hora).toLocaleDateString("pt-BR")}` : "";

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Relatórios por noite</h1>
        <p className="mt-1 text-muted-foreground">
          Lotação, receita por lote e conversão por canal para fechar o caixa e analisar a performance da casa.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={evId}
          onChange={(e) => setEventoId(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
        >
          {eventos.map((e: { id: string; nome: string; data_hora: string }) => (
            <option key={e.id} value={e.id}>
              {e.nome} · {new Date(e.data_hora).toLocaleDateString("pt-BR")}
            </option>
          ))}
        </select>
        {rel && (
          <>
            <button
              onClick={() => exportarCSV(`vendas-${rel.evento.nome}`, colsLotes, rel.lotes)}
              className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              CSV vendas
            </button>
            <button
              onClick={() => exportarPDF("Vendas por lote", colsLotes, rel.lotes, nomeNoite)}
              className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              PDF vendas
            </button>
            <button
              onClick={() => exportarCSV(`check-ins-${rel.evento.nome}`, colsCanais, rel.canais)}
              className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              CSV check-ins
            </button>
            <button
              onClick={() => exportarPDF("Programação da noite", colsProg, rel.programacao, nomeNoite)}
              className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              PDF programação
            </button>
          </>
        )}
      </div>

      {!rel ? (
        <p className="text-sm text-muted-foreground">Selecione uma noite para ver o relatório.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              label="Lotação"
              value={rel.totais.ocupacao === null ? "—" : `${rel.totais.ocupacao}%`}
              hint={`${rel.totais.vendidos} de ${rel.totais.capacidade || "?"} ingressos`}
            />
            <Card label="Receita de bilheteria" value={brl(rel.totais.receitaIngressos)} />
            <Card label="Receita de comandas" value={brl(rel.totais.receitaComandas)} hint="comandas fechadas" />
            <Card
              label="Conversão da lista"
              value={
                rel.totais.convidados ? `${Math.round((rel.totais.entraram / rel.totais.convidados) * 100)}%` : "—"
              }
              hint={`${rel.totais.entraram} de ${rel.totais.convidados} convidados`}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">Receita por lote</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rel.lotes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                    <XAxis dataKey="tipo" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.6} />
                    <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.6} />
                    <Tooltip
                      formatter={(v: number, n) => (n === "receita" ? brl(v) : v)}
                      contentStyle={{ background: "#141110", border: "1px solid #333", borderRadius: 12 }}
                    />
                    <Legend />
                    <Bar dataKey="vendidos" name="Vendidos" fill="#c1121f" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="receita" name="Receita" fill="#d4af37" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">Conversão por canal</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rel.canais} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.6} />
                    <YAxis type="category" dataKey="canal" width={110} tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.6} />
                    <Tooltip contentStyle={{ background: "#141110", border: "1px solid #333", borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="convidados" name="Convidados" fill="#8d6e2f" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="entraram" name="Entraram" fill="#d4af37" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">Ingressos vendidos por lote</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rel.lotes} dataKey="vendidos" nameKey="tipo" outerRadius={90} label>
                      {rel.lotes.map((l, i) => (
                        <Cell key={l.id} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#141110", border: "1px solid #333", borderRadius: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">Programação e cachês</h2>
              {rel.programacao.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atração cadastrada nesta noite.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {rel.programacao.map((p, i) => (
                    <li key={i} className="flex items-center justify-between py-2">
                      <span className="text-foreground">{p.artista}</span>
                      <span className="text-muted-foreground">
                        {p.horario ? new Date(p.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"} ·{" "}
                        {brl(p.cache)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 border-t border-border pt-3 text-sm font-semibold text-foreground">
                Cachê total: {brl(rel.totais.cacheTotal)}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
