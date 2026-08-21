import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listarClientesFn, criarClienteFn, atualizarClienteFn, excluirClienteFn } from "@/lib/clientes.functions";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

function ClientesPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [preferencias, setPreferencias] = useState("");
  const [tags, setTags] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editPref, setEditPref] = useState("");

  const fetchClientes = useServerFn(listarClientesFn);
  const criar = useServerFn(criarClienteFn);
  const atualizar = useServerFn(atualizarClienteFn);
  const excluir = useServerFn(excluirClienteFn);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => fetchClientes({ data: {} }),
  });

  const filtered = busca
    ? clientes.filter((c: any) => c.nome.toLowerCase().includes(busca.toLowerCase()))
    : clientes;

  const criarMut = useMutation({
    mutationFn: () =>
      criar({ data: { nome, telefone: telefone || null, email: email || null, preferencias: preferencias || null, tags: tags ? tags.split(",").map((t) => t.trim()) : [] } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setNome(""); setTelefone(""); setEmail(""); setPreferencias(""); setTags("");
    },
  });

  const salvarPrefMut = useMutation({
    mutationFn: (id: string) => atualizar({ data: { id, patch: { preferencias: editPref } } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setEditId(null);
    },
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Fregueses</h1>
        <p className="mt-1 text-muted-foreground">Cadastro e preferências dos clientes da casa.</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-5">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome *" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (vírgula)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        <button onClick={() => criarMut.mutate()} disabled={!nome || criarMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          Cadastrar
        </button>
      </div>
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome…"
        className="mb-4 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((c: any) => (
              <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-foreground">{c.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.telefone ?? "—"}
                    {c.email ? ` · ${c.email}` : ""}
                    {c.tags?.length ? ` · ${c.tags.join(", ")}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.preferencias ? `Prefs: ${c.preferencias}` : "Sem preferências registradas"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditId(editId === c.id ? null : c.id);
                      setEditPref(c.preferencias ?? "");
                    }}
                    className="rounded-lg border border-input px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                  >
                    Preferências
                  </button>
                  <button
                    onClick={() => { if (confirm(`Excluir ${c.nome}?`)) excluirMut.mutate(c.id); }}
                    className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    Excluir
                  </button>
                </div>
                {editId === c.id && (
                  <div className="flex w-full gap-2 sm:max-w-md">
                    <textarea
                      value={editPref}
                      onChange={(e) => setEditPref(e.target.value)}
                      rows={2}
                      placeholder="Preferências, observações…"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => salvarPrefMut.mutate(c.id)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
