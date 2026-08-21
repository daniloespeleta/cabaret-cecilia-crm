import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listarComandasFn, listarItensComandaFn, abrirComandaFn, adicionarItemFn, fecharComandaFn,
} from "@/lib/comandas.functions";
import { listarClientesFn } from "@/lib/clientes.functions";
import { listarEventosFn } from "@/lib/eventos.functions";

export const Route = createFileRoute("/_authenticated/comandas")({
  component: ComandasPage,
});

function ComandasPage() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState("aberta");
  const [clienteId, setClienteId] = useState("");
  const [eventoId, setEventoId] = useState("");
  const [mesa, setMesa] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [itemDesc, setItemDesc] = useState("");
  const [itemQtd, setItemQtd] = useState(1);
  const [itemValor, setItemValor] = useState(0);

  const fetchComandas = useServerFn(listarComandasFn);
  const fetchItens = useServerFn(listarItensComandaFn);
  const abrir = useServerFn(abrirComandaFn);
  const addItem = useServerFn(adicionarItemFn);
  const fechar = useServerFn(fecharComandaFn);
  const fetchClientes = useServerFn(listarClientesFn);
  const fetchEventos = useServerFn(listarEventosFn);

  const { data: comandas = [] } = useQuery({ queryKey: ["comandas"], queryFn: () => fetchComandas() });
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: () => fetchClientes() });
  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => fetchEventos() });
  const { data: itens = [] } = useQuery({
    queryKey: ["itens", selId],
    queryFn: () => (selId ? fetchItens({ data: { comanda_id: selId } }) : Promise.resolve([])),
    enabled: !!selId,
  });

  const filtered = filtro ? comandas.filter((c: any) => c.status === filtro) : comandas;

  const abrirMut = useMutation({
    mutationFn: () => abrir({ data: { cliente_id: clienteId || null, evento_id: eventoId || null, mesa: mesa || null } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comandas"] });
      setClienteId(""); setEventoId(""); setMesa("");
    },
  });

  const addItemMut = useMutation({
    mutationFn: () => addItem({ data: { comanda_id: selId!, descricao: itemDesc, quantidade: itemQtd, valor_unitario: itemValor } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comandas"] });
      queryClient.invalidateQueries({ queryKey: ["itens", selId] });
      setItemDesc(""); setItemQtd(1); setItemValor(0);
    },
  });

  const fecharMut = useMutation({
    mutationFn: (id: string) => fechar({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comandas"] }),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Comandas</h1>
        <p className="mt-1 text-muted-foreground">Consumo por mesa ou cliente.</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-5">
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="">Cliente (avulso)</option>
          {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="">Evento</option>
          {eventos.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <input value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Mesa/VIP" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <div />
        <button onClick={() => abrirMut.mutate()} disabled={abrirMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Abrir comanda
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {["aberta", "fechada", ""].map((s) => (
          <button
            key={s || "todas"}
            onClick={() => setFiltro(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filtro === s ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {s === "aberta" ? "Abertas" : s === "fechada" ? "Fechadas" : "Todas"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nenhuma comanda {filtro}.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((c: any) => (
                <li key={c.id}>
                  <button onClick={() => setSelId(selId === c.id ? null : c.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-accent">
                    <div>
                      <div className="font-semibold text-foreground">{c.clientes?.nome ?? "Comanda avulsa"}</div>
                      <div className="text-sm text-muted-foreground">
                        {c.eventos?.nome ?? "Sem evento"}{c.mesa ? ` · ${c.mesa}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">R$ {Number(c.valor_total || 0).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{c.status}</div>
                    </div>
                  </button>
                  {selId === c.id && (
                    <div className="border-t border-border p-4">
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Itens</h3>
                      {itens.length === 0 ? (
                        <p className="mb-2 text-sm text-muted-foreground">Nenhum item.</p>
                      ) : (
                        <ul className="mb-3 space-y-1 text-sm">
                          {itens.map((i: any) => (
                            <li key={i.id} className="flex justify-between">
                              <span className="text-foreground">{i.quantidade}× {i.descricao}</span>
                              <span className="text-muted-foreground">R$ {(i.quantidade * i.valor_unitario).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {c.status === "aberta" && (
                        <>
                          <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                            <input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Item" className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm sm:col-span-2" />
                            <input type="number" value={itemQtd} min={1} onChange={(e) => setItemQtd(Number(e.target.value))} className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm" />
                            <input type="number" value={itemValor} min={0} step="0.01" onChange={(e) => setItemValor(Number(e.target.value))} className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => addItemMut.mutate()} disabled={!itemDesc} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                              + Item
                            </button>
                            <button onClick={() => { if (confirm("Fechar esta comanda?")) fecharMut.mutate(c.id); }} className="rounded-lg border border-input px-4 py-2 text-sm text-foreground hover:bg-accent">
                              Fechar comanda
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
