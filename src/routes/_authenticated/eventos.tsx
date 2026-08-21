import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listarEventosFn, criarEventoFn, atualizarEventoFn, excluirEventoFn } from "@/lib/eventos.functions";
import { programacaoEventoFn, adicionarArtistaEventoFn, removerArtistaEventoFn } from "@/lib/atracoes.functions";
import { listarIngressosFn, criarIngressoFn, venderIngressoFn, lotacaoEventosFn } from "@/lib/bilheteria.functions";
import { listarArtistasFn } from "@/lib/artistas.functions";

export const Route = createFileRoute("/_authenticated/eventos")({
  component: EventosPage,
});

function EventosPage() {
  const queryClient = useQueryClient();
  const [apenasProximos, setApenasProximos] = useState(true);
  const [aberto, setAberto] = useState<string | null>(null);

  // Novo evento
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [capacidade, setCapacidade] = useState("");

  // Programação / bilheteria do evento aberto
  const [artistaSel, setArtistaSel] = useState("");
  const [horario, setHorario] = useState("");
  const [cache, setCache] = useState("");
  const [ingTipo, setIngTipo] = useState("inteira");
  const [ingPreco, setIngPreco] = useState("");
  const [ingQtd, setIngQtd] = useState("");

  const fetchEventos = useServerFn(listarEventosFn);
  const criar = useServerFn(criarEventoFn);
  const atualizar = useServerFn(atualizarEventoFn);
  const excluir = useServerFn(excluirEventoFn);
  const fetchProg = useServerFn(programacaoEventoFn);
  const addSlot = useServerFn(adicionarArtistaEventoFn);
  const removeSlot = useServerFn(removerArtistaEventoFn);
  const fetchIngressos = useServerFn(listarIngressosFn);
  const criarIngresso = useServerFn(criarIngressoFn);
  const venderIngresso = useServerFn(venderIngressoFn);
  const fetchLotacao = useServerFn(lotacaoEventosFn);
  const fetchArtistas = useServerFn(listarArtistasFn);

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos", apenasProximos],
    queryFn: () => fetchEventos({ data: { apenasProximos } }),
  });
  const { data: artistas = [] } = useQuery({ queryKey: ["artistas"], queryFn: () => fetchArtistas({ data: {} }) });
  const { data: lotacao = {} } = useQuery({ queryKey: ["lotacao"], queryFn: () => fetchLotacao() });

  const abertoEvent = eventos.find((e: any) => e.id === aberto);
  const { data: programacao = [] } = useQuery({
    queryKey: ["programacao", aberto],
    queryFn: () => (aberto ? fetchProg({ data: { evento_id: aberto } }) : Promise.resolve([])),
    enabled: !!aberto,
  });
  const { data: ingressos = [] } = useQuery({
    queryKey: ["ingressos", aberto],
    queryFn: () => (aberto ? fetchIngressos({ data: { evento_id: aberto } }) : Promise.resolve([])),
    enabled: !!aberto,
  });

  const criarMut = useMutation({
    mutationFn: () => criar({ data: { nome, data_hora: new Date(dataHora).toISOString(), tipo: tipo || "festa", capacidade: capacidade ? Number(capacidade) : null, status: "confirmado" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      setNome(""); setTipo(""); setDataHora(""); setCapacidade("");
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { status: string } }) => atualizar({ data: { id, patch } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const addSlotMut = useMutation({
    mutationFn: () => addSlot({ data: { evento_id: aberto!, artista_id: artistaSel, horario: horario ? new Date(horario).toISOString() : null, cache: cache ? Number(cache) : 0 } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programacao", aberto] });
      setArtistaSel(""); setHorario(""); setCache("");
    },
  });

  const removeSlotMut = useMutation({
    mutationFn: (id: string) => removeSlot({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["programacao", aberto] }),
  });

  const criarIngMut = useMutation({
    mutationFn: () => criarIngresso({ data: { evento_id: aberto!, tipo: ingTipo, preco: ingPreco ? Number(ingPreco) : 0, quantidade: ingQtd ? Number(ingQtd) : 0 } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingressos", aberto] });
      queryClient.invalidateQueries({ queryKey: ["lotacao"] });
      setIngPreco(""); setIngQtd("");
    },
  });

  const venderMut = useMutation({
    mutationFn: (id: string) => venderIngresso({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingressos", aberto] });
      queryClient.invalidateQueries({ queryKey: ["lotacao"] });
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Noites &amp; Atrações</h1>
        <p className="mt-1 text-muted-foreground">Agenda da casa: cada noite com sua programação, atrações e bilheteria.</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-6">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da noite *" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Tipo (festa, baile…)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input type="number" value={capacidade} onChange={(e) => setCapacidade(e.target.value)} placeholder="Capacidade" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <button onClick={() => criarMut.mutate()} disabled={!nome || !dataHora || criarMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 md:col-span-2">
          Criar noite
        </button>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={apenasProximos} onChange={(e) => setApenasProximos(e.target.checked)} />
        Apenas próximas noites
      </label>

      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma noite encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {eventos.map((e: any) => {
            const passado = new Date(e.data_hora) < new Date();
            const vendidos = Number(lotacao[e.id] ?? 0);
            const capacidade = e.capacidade ?? null;
            const pct = capacidade ? Math.round((vendidos / capacidade) * 100) : null;
            const isOpen = aberto === e.id;
            return (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{e.nome}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {new Date(e.data_hora).toLocaleDateString("pt-BR")} · {new Date(e.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="mt-1 text-sm text-foreground">{e.tipo}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${passado ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                    {passado ? "encerrada" : e.status}
                  </span>
                </div>

                {capacidade && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Lotação</span>
                      <span>{vendidos} / {capacidade}{pct !== null ? ` · ${pct}%` : ""}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${pct !== null && pct >= 90 ? "bg-destructive" : pct !== null && pct >= 70 ? "bg-primary" : "bg-secondary"}`}
                        style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button onClick={() => setAberto(isOpen ? null : e.id)} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
                    {isOpen ? "Fechar" : "Programação & Bilheteria"}
                  </button>
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

                {isOpen && (
                  <div className="mt-5 grid grid-cols-1 gap-5 border-t border-border pt-4 lg:grid-cols-2">
                    {/* Programação */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Programação</h4>
                      <div className="mb-3 grid grid-cols-1 gap-2">
                        <select value={artistaSel} onChange={(e) => setArtistaSel(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Artista *</option>
                          {artistas.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="datetime-local" value={horario} onChange={(e) => setHorario(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <input type="number" value={cache} min={0} onChange={(e) => setCache(e.target.value)} placeholder="Cachê (R$)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                        </div>
                        <button onClick={() => addSlotMut.mutate()} disabled={!artistaSel} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                          Adicionar
                        </button>
                      </div>
                      {programacao.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem atrações escaladas.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {programacao.map((s: any) => (
                            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                              <span className="text-foreground">{s.artista?.nome ?? "Artista"}</span>
                              <span className="flex items-center gap-2 text-muted-foreground">
                                {s.horario ? new Date(s.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                {Number(s.cache) > 0 ? ` · R$ ${Number(s.cache).toFixed(2)}` : ""}
                                <button onClick={() => removeSlotMut.mutate(s.id)} className="text-destructive hover:underline">remover</button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Bilheteria */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Bilheteria</h4>
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <select value={ingTipo} onChange={(e) => setIngTipo(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                          {["inteira", "meia", "pista", "camarote", "cortesia"].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="number" value={ingQtd} min={0} onChange={(e) => setIngQtd(e.target.value)} placeholder="Qtd." className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                        <input type="number" value={ingPreco} min={0} onChange={(e) => setIngPreco(e.target.value)} placeholder="Preço (R$)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                        <button onClick={() => criarIngMut.mutate()} disabled={!ingQtd} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                          Criar lote
                        </button>
                      </div>
                      {ingressos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum lote de ingresso criado.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {ingressos.map((i: any) => (
                            <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                              <span className="text-foreground">
                                {i.tipo}
                                <span className="ml-2 text-muted-foreground">
                                  {Number(i.vendidos ?? 0)}/{i.quantidade} · R$ {Number(i.preco ?? 0).toFixed(2)}
                                </span>
                              </span>
                              <button
                                onClick={() => venderMut.mutate(i.id)}
                                disabled={(i.vendidos ?? 0) >= i.quantidade}
                                className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-40"
                              >
                                +1 venda
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
