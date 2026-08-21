import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listarGuestListFn, adicionarConvidadoFn, atualizarConvidadoFn } from "@/lib/guest-list.functions";
import { listarEventosFn } from "@/lib/eventos.functions";
import { listarPromotersFn } from "@/lib/promoters.functions";

export const Route = createFileRoute("/_authenticated/guest-list")({
  component: GuestListPage,
});

function GuestListPage() {
  const queryClient = useQueryClient();
  const [eventoId, setEventoId] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [promoterId, setPromoterId] = useState("");

  const fetchGuest = useServerFn(listarGuestListFn);
  const adicionar = useServerFn(adicionarConvidadoFn);
  const atualizar = useServerFn(atualizarConvidadoFn);
  const fetchEventos = useServerFn(listarEventosFn);
  const fetchPromoters = useServerFn(listarPromotersFn);

  const { data: guest = [] } = useQuery({
    queryKey: ["guest-list", eventoId],
    queryFn: () => fetchGuest({ data: eventoId ? { evento_id: eventoId } : {} }),
  });
  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => fetchEventos({ data: {} }) });
  const { data: promoters = [] } = useQuery({ queryKey: ["promoters"], queryFn: () => fetchPromoters({ data: {} }) });

  const addMut = useMutation({
    mutationFn: () => adicionar({ data: { evento_id: eventoId, nome, telefone: telefone || null, promoter_id: promoterId || null } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-list"] });
      setNome(""); setTelefone(""); setPromoterId("");
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pendente" | "confirmado" | "entrou" | "nao_compareceu" }) =>
      atualizar({ data: { id, patch: { status } } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-list"] }),
  });

  const badge: Record<string, string> = {
    pendente: "bg-muted text-muted-foreground",
    confirmado: "bg-primary/15 text-primary",
    entrou: "bg-emerald-500/15 text-emerald-500",
    nao_compareceu: "bg-destructive/10 text-destructive",
  };

  const entradas = guest.filter((g: any) => g.status === "entrou").length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Guest list</h1>
        <p className="mt-1 text-muted-foreground">Convidados, confirmações e entrada na porta. Entraram: {entradas}.</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-5">
        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="">Evento *</option>
          {eventos.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome *" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <select value={promoterId} onChange={(e) => setPromoterId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="">Promoter</option>
          {promoters.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <button onClick={() => addMut.mutate()} disabled={!eventoId || !nome || addMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Adicionar
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {guest.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum convidado nesta lista.</p>
        ) : (
          <ul className="divide-y divide-border">
            {guest.map((g: any) => (
              <li key={g.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-foreground">{g.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    {g.telefone ?? "—"} · {g.eventos?.nome ?? "—"}
                    {g.promoters?.nome ? ` · prom.: ${g.promoters.nome}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[g.status] ?? badge["pendente"]}`}>
                    {g.status.replace("_", " ")}
                  </span>
                  <select
                    value={g.status}
                    onChange={(e) => statusMut.mutate({ id: g.id, status: e.target.value as "pendente" | "confirmado" | "entrou" | "nao_compareceu" })}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="entrou">Entrou</option>
                    <option value="nao_compareceu">Não compareceu</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
