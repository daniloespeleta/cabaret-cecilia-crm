import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listarArtistasFn, criarArtistaFn, atualizarArtistaFn, excluirArtistaFn,
} from "@/lib/artistas.functions";
import {
  programacaoEventoFn, adicionarArtistaEventoFn, removerArtistaEventoFn,
} from "@/lib/atracoes.functions";
import { listarEventosFn } from "@/lib/eventos.functions";

export const Route = createFileRoute("/_authenticated/atracoes")({
  component: AtracoesPage,
});

const TIPOS = ["drag", "burlesca", "mc", "danca", "musica", "teatro", "outro"];

function AtracoesPage() {
  const queryClient = useQueryClient();

  // Formulário de novo artista
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("drag");
  const [instagram, setInstagram] = useState("");
  const [contato, setContato] = useState("");

  // Programação
  const [eventoId, setEventoId] = useState("");
  const [artistaId, setArtistaId] = useState("");
  const [horario, setHorario] = useState("");
  const [cache, setCache] = useState("");

  const fetchArtistas = useServerFn(listarArtistasFn);
  const criar = useServerFn(criarArtistaFn);
  const atualizar = useServerFn(atualizarArtistaFn);
  const excluir = useServerFn(excluirArtistaFn);
  const fetchEventos = useServerFn(listarEventosFn);
  const fetchProg = useServerFn(programacaoEventoFn);
  const addSlot = useServerFn(adicionarArtistaEventoFn);
  const removeSlot = useServerFn(removerArtistaEventoFn);

  const { data: artistas = [] } = useQuery({ queryKey: ["artistas"], queryFn: () => fetchArtistas({ data: {} }) });
  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => fetchEventos({ data: {} }) });
  const { data: programacao = [] } = useQuery({
    queryKey: ["programacao", eventoId],
    queryFn: () => (eventoId ? fetchProg({ data: { evento_id: eventoId } }) : Promise.resolve([])),
    enabled: !!eventoId,
  });

  const criarMut = useMutation({
    mutationFn: () => criar({ data: { nome, tipo, instagram: instagram || null, contato: contato || null } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistas"] });
      setNome(""); setInstagram(""); setContato("");
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => atualizar({ data: { id, patch: { ativo } } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["artistas"] }),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["artistas"] }),
  });

  const addSlotMut = useMutation({
    mutationFn: () => addSlot({
      data: {
        evento_id: eventoId,
        artista_id: artistaId,
        horario: horario ? new Date(horario).toISOString() : null,
        cache: cache ? Number(cache) : 0,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programacao", eventoId] });
      setArtistaId(""); setHorario(""); setCache("");
    },
  });

  const removeSlotMut = useMutation({
    mutationFn: (id: string) => removeSlot({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["programacao", eventoId] }),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Atrações</h1>
        <p className="mt-1 text-muted-foreground">Artistas da casa: drag, burlescas, DJs e música — e a programação de cada noite.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Artistas */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Artistas</h2>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome artístico *" className="rounded-lg border border-input bg-background px-3 py-2 text-sm sm:col-span-2" />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@instagram" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Contato" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={() => criarMut.mutate()} disabled={!nome || criarMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:col-span-2">
              Cadastrar artista
            </button>
          </div>

          {artistas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum artista cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {artistas.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <div className="font-semibold text-foreground">{a.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.tipo}
                      {a.instagram ? ` · ${a.instagram}` : ""}
                      {a.ativo ? "" : " · inativo"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMut.mutate({ id: a.id, ativo: !a.ativo })}
                      className="rounded-lg border border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {a.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Excluir ${a.nome}?`)) excluirMut.mutate(a.id); }}
                      className="rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Programação da noite */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Programação da noite</h2>
          <select
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
            className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione a noite *</option>
            {eventos.map((e: any) => <option key={e.id} value={e.id}>{e.nome} · {new Date(e.data_hora).toLocaleDateString("pt-BR")}</option>)}
          </select>

          {eventoId && (
            <>
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
                <select value={artistaId} onChange={(e) => setArtistaId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm sm:col-span-2">
                  <option value="">Artista *</option>
                  {artistas.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <input type="datetime-local" value={horario} onChange={(e) => setHorario(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input type="number" value={cache} min={0} onChange={(e) => setCache(e.target.value)} placeholder="Cachê (R$)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <button onClick={() => addSlotMut.mutate()} disabled={!artistaId || addSlotMut.isPending} className="mb-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                Adicionar à programação
              </button>

              {programacao.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem atrações escaladas para esta noite.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {programacao.map((s: any) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 py-3">
                      <div>
                        <div className="font-semibold text-foreground">{s.artista?.nome ?? "Artista"}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.horario ? new Date(s.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "horário a definir"}
                          {Number(s.cache) > 0 ? ` · cachê R$ ${Number(s.cache).toFixed(2)}` : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => { if (confirm("Remover desta noite?")) removeSlotMut.mutate(s.id); }}
                        className="rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
