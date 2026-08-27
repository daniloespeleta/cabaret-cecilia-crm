import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listarAuditoriaFn } from "@/lib/auditoria.functions";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria da casa | Cabaret da Cecília" },
      {
        name: "description",
        content: "Histórico de vendas de ingressos, portaria e alterações de atrações do Cabaret da Cecília.",
      },
      { property: "og:title", content: "Auditoria da casa | Cabaret da Cecília" },
      { property: "og:description", content: "Histórico de ações do CRM do Cabaret da Cecília." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditoriaPage,
});

const FILTROS = [
  { valor: "", label: "Tudo" },
  { valor: "ingressos", label: "Bilheteria" },
  { valor: "guest_list", label: "Portaria" },
  { valor: "evento_artistas", label: "Programação" },
  { valor: "artistas", label: "Artistas" },
  { valor: "convites", label: "Convites" },
];

const ACAO_LABEL: Record<string, string> = {
  venda_ingresso: "Venda de ingresso",
  convidado_adicionado: "Convidado adicionado",
  portaria_status: "Portaria",
  atracao_adicionada: "Atração adicionada",
  atracao_atualizada: "Atração atualizada",
  atracao_removida: "Atração removida",
  artista_criado: "Artista criado",
  artista_atualizado: "Artista atualizado",
  artista_removido: "Artista removido",
  convite_aceito: "Convite aceito",
};

function resumo(item: { acao: string; detalhes: Record<string, unknown>; evento: string | null; artista: string | null }) {
  const d = item.detalhes;
  const evento = item.evento ? ` · ${item.evento}` : "";
  switch (item.acao) {
    case "venda_ingresso": {
      const antes = Number(d["vendidos_antes"] ?? 0);
      const depois = Number(d["vendidos_depois"] ?? 0);
      return `${depois - antes} ingresso(s) ${String(d["tipo"] ?? "")} · ${depois}/${String(d["quantidade"] ?? "")} vendidos${evento}`;
    }
    case "portaria_status":
      return `${String(d["nome"] ?? "")}: ${String(d["status_antes"] ?? "")} → ${String(d["status_depois"] ?? "")}${evento}`;
    case "convidado_adicionado":
      return `${String(d["nome"] ?? "")} na lista${evento}`;
    case "atracao_adicionada":
    case "atracao_removida":
      return `${item.artista ?? "artista"}${evento}`;
    case "atracao_atualizada":
      return `${item.artista ?? "artista"} · cachê ${String(d["cache_antes"] ?? "")} → ${String(d["cache_depois"] ?? "")}${evento}`;
    case "convite_aceito":
      return `${String(d["email"] ?? "")} · ${(d["roles"] as string[] | undefined)?.join(", ") ?? ""}`;
    default:
      return String(d["nome"] ?? "");
  }
}

function AuditoriaPage() {
  const [entidade, setEntidade] = useState("");
  const fetchAuditoria = useServerFn(listarAuditoriaFn);
  const { data: itens = [], isLoading, error } = useQuery({
    queryKey: ["auditoria", entidade],
    queryFn: () => fetchAuditoria({ data: entidade ? { entidade } : {} }),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Auditoria da casa</h1>
        <p className="mt-1 text-muted-foreground">
          Histórico de vendas de ingressos, movimentos da portaria e alterações nas atrações.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setEntidade(f.valor)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              entidade === f.valor
                ? "bg-primary text-primary-foreground"
                : "border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {error ? (
          <p className="p-6 text-sm text-destructive">{(error as Error).message}</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando histórico...</p>
        ) : itens.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {itens.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      {ACAO_LABEL[item.acao] ?? item.acao}
                    </span>
                    <span className="truncate text-sm text-foreground">{resumo(item)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">por {item.ator}</div>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString("pt-BR")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
