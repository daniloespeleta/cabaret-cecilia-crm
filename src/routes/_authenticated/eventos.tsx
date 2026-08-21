import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listarEventosFn, criarEventoFn, atualizarEventoFn, excluirEventoFn } from "@/lib/eventos.functions";

export const Route = createFileRoute("/_authenticated/eventos")({
  component: EventosPage,
});

function EventosPage() {
  const queryClient = useQueryClient();
  const [apenasProximos, setApenasProximos] = useState(true);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [artista, setArtista] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [capacidade, setCapacidade] = useState("");

  const fetchEventos = useServerFn(listarEventosFn);
  const criar = useServerFn(criarEventoFn);
  const atualizar = useServerFn(atualizarEventoFn);
  const excluir = useServerFn(excluirEventoFn);

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos", apenasProximos],
    queryFn: () => fetchEventos({ data: { apenasProximos } }),
  });

  const criarMut = useMutation({
    mutationFn: () => criar({ data: { nome, data_hora: new Date(dataHora).toISOString(), tipo: tipo || "festa", artista: artista || null, capacidade: capacidade ? Number(capacidade) : null, status: "confirmado" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      setNome(""); setTipo(""); setArtista(""); setDataHora(""); setCapacidade("");
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => atualizar({ data: { id, patch } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Eventos &amp; Atrações</h1>
        <p className="mt-1 text-muted-foreground">Agenda da casa: DJs, artistas e festas temáticas.</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-6">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do evento *" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Tipo (festa, baile…)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input value={artista} onChange={(e) => setArtista(e.target.value)} placeholder="Artista / DJ" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input type="number" value={capacidade} onChange={(e) => setCapacidade(e.target.value)} placeholder="Capacidade" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <button onClick={() => criarMut.mutate()} disabled={!nome || !dataHora || criarMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Criar
        </button>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={apenasProximos} onChange={(e) => setApenasProximos(e.target.checked)} />
        Apenas próximos eventos
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento encontrado.</p>
        ) : (
          eventos.map((e: any) => {
            const passado = new Date(e.data_hora) < new Date();
            return (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{e.nome}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {new Date(e.data_hora).toLocaleDateString("pt-BR")} · {new Date(e.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="mt-2 text-sm text-foreground">{e.artista ?? e.tipo}</div>
                    {e.capacidade && <div className="text-xs text-muted-foreground">Capacidade: {e.capacidade}</div>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${passado ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                    {passado ? "encerrado" : e.status}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => toggleMut.mutate({ id: e.id, patch: { status: e.status === "confirmado" ? "cancelado" : "confirmado" } })}
                    className="rounded-lg border border-input px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                  >
                    {e.status === "confirmado" ? "Cancelar" : "Confirmar"}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Excluir ${e.nome}?`)) excluirMut.mutate(e.id); }}
                    className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
