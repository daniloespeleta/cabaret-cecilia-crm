import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RelatorioNoite = {
  evento: { id: string; nome: string; data_hora: string; capacidade: number | null; local: string | null };
  lotes: { id: string; tipo: string; preco: number; quantidade: number; vendidos: number; receita: number }[];
  canais: { canal: string; convidados: number; entraram: number; conversao: number }[];
  programacao: { artista: string; horario: string | null; cache: number }[];
  totais: {
    vendidos: number;
    capacidade: number;
    ocupacao: number | null;
    receitaIngressos: number;
    receitaComandas: number;
    cacheTotal: number;
    convidados: number;
    entraram: number;
  };
};

export const relatorioNoiteFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { evento_id: string }) => d)
  .handler(async ({ data, context }): Promise<RelatorioNoite> => {
    const sb = context.supabase;

    const { data: evento, error: e1 } = await sb
      .from("eventos")
      .select("id, nome, data_hora, capacidade, local")
      .eq("id", data.evento_id)
      .single();
    if (e1) throw e1;

    const [{ data: ingressos }, { data: guest }, { data: comandas }, { data: prog }] = await Promise.all([
      sb.from("ingressos").select("*").eq("evento_id", data.evento_id),
      sb.from("guest_list").select("status, promoter_id, promoters(nome)").eq("evento_id", data.evento_id),
      sb.from("comandas").select("valor_total, status").eq("evento_id", data.evento_id),
      sb
        .from("evento_artistas")
        .select("horario, cache, ordem, artistas(nome)")
        .eq("evento_id", data.evento_id)
        .order("ordem"),
    ]);

    const lotes = (ingressos ?? []).map((i) => ({
      id: i.id,
      tipo: i.tipo,
      preco: Number(i.preco ?? 0),
      quantidade: Number(i.quantidade ?? 0),
      vendidos: Number(i.vendidos ?? 0),
      receita: Number(i.preco ?? 0) * Number(i.vendidos ?? 0),
    }));

    const porCanal = new Map<string, { convidados: number; entraram: number }>();
    for (const g of (guest ?? []) as { status: string; promoters: { nome: string } | null }[]) {
      const canal = g.promoters?.nome ?? "Casa / direto";
      const atual = porCanal.get(canal) ?? { convidados: 0, entraram: 0 };
      atual.convidados += 1;
      if (g.status === "entrou") atual.entraram += 1;
      porCanal.set(canal, atual);
    }
    const canais = [...porCanal.entries()]
      .map(([canal, v]) => ({
        canal,
        convidados: v.convidados,
        entraram: v.entraram,
        conversao: v.convidados ? Math.round((v.entraram / v.convidados) * 100) : 0,
      }))
      .sort((a, b) => b.convidados - a.convidados);

    const programacao = ((prog ?? []) as { horario: string | null; cache: number; artistas: { nome: string } | null }[])
      .map((p) => ({ artista: p.artistas?.nome ?? "—", horario: p.horario, cache: Number(p.cache ?? 0) }));

    const vendidos = lotes.reduce((s, l) => s + l.vendidos, 0);
    const capacidade = Number(evento.capacidade ?? 0);
    const receitaComandas = (comandas ?? [])
      .filter((c) => c.status === "fechada")
      .reduce((s, c) => s + Number(c.valor_total ?? 0), 0);

    return {
      evento,
      lotes,
      canais,
      programacao,
      totais: {
        vendidos,
        capacidade,
        ocupacao: capacidade ? Math.round((vendidos / capacidade) * 100) : null,
        receitaIngressos: lotes.reduce((s, l) => s + l.receita, 0),
        receitaComandas,
        cacheTotal: programacao.reduce((s, p) => s + p.cache, 0),
        convidados: canais.reduce((s, c) => s + c.convidados, 0),
        entraram: canais.reduce((s, c) => s + c.entraram, 0),
      },
    };
  });
