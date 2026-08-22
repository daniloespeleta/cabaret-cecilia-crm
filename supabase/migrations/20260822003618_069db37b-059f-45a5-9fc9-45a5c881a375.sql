CREATE TABLE public.convites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  roles app_role[] NOT NULL DEFAULT '{}',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pendente',
  convidado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  aceito_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  aceito_em timestamp with time zone,
  expira_em timestamp with time zone NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage convites" ON public.convites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_convites_updated_at BEFORE UPDATE ON public.convites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.auditoria (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ator_id uuid,
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX auditoria_created_at_idx ON public.auditoria (created_at DESC);
CREATE INDEX auditoria_entidade_idx ON public.auditoria (entidade);

GRANT SELECT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read auditoria" ON public.auditoria
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_auditoria_ingressos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if new.vendidos is distinct from old.vendidos then
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (
      auth.uid(), 'venda_ingresso', 'ingressos', new.id,
      jsonb_build_object(
        'evento_id', new.evento_id,
        'tipo', new.tipo,
        'preco', new.preco,
        'vendidos_antes', old.vendidos,
        'vendidos_depois', new.vendidos,
        'quantidade', new.quantidade
      )
    );
  end if;
  return new;
end;
$$;

CREATE TRIGGER log_auditoria_ingressos AFTER UPDATE ON public.ingressos
  FOR EACH ROW EXECUTE FUNCTION public.log_auditoria_ingressos();

CREATE OR REPLACE FUNCTION public.log_auditoria_guest_list()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if TG_OP = 'INSERT' then
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'convidado_adicionado', 'guest_list', new.id,
      jsonb_build_object('evento_id', new.evento_id, 'nome', new.nome, 'status', new.status));
    return new;
  elsif TG_OP = 'UPDATE' and new.status is distinct from old.status then
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'portaria_status', 'guest_list', new.id,
      jsonb_build_object('evento_id', new.evento_id, 'nome', new.nome,
        'status_antes', old.status, 'status_depois', new.status));
    return new;
  end if;
  return new;
end;
$$;

CREATE TRIGGER log_auditoria_guest_list AFTER INSERT OR UPDATE ON public.guest_list
  FOR EACH ROW EXECUTE FUNCTION public.log_auditoria_guest_list();

CREATE OR REPLACE FUNCTION public.log_auditoria_atracoes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if TG_OP = 'DELETE' then
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'atracao_removida', 'evento_artistas', old.id,
      jsonb_build_object('evento_id', old.evento_id, 'artista_id', old.artista_id, 'cache', old.cache));
    return old;
  elsif TG_OP = 'INSERT' then
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'atracao_adicionada', 'evento_artistas', new.id,
      jsonb_build_object('evento_id', new.evento_id, 'artista_id', new.artista_id,
        'horario', new.horario, 'cache', new.cache));
    return new;
  else
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'atracao_atualizada', 'evento_artistas', new.id,
      jsonb_build_object('evento_id', new.evento_id, 'artista_id', new.artista_id,
        'horario_antes', old.horario, 'horario_depois', new.horario,
        'cache_antes', old.cache, 'cache_depois', new.cache));
    return new;
  end if;
end;
$$;

CREATE TRIGGER log_auditoria_atracoes AFTER INSERT OR UPDATE OR DELETE ON public.evento_artistas
  FOR EACH ROW EXECUTE FUNCTION public.log_auditoria_atracoes();

CREATE OR REPLACE FUNCTION public.log_auditoria_artistas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if TG_OP = 'INSERT' then
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'artista_criado', 'artistas', new.id,
      jsonb_build_object('nome', new.nome, 'tipo', new.tipo));
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'artista_removido', 'artistas', old.id,
      jsonb_build_object('nome', old.nome));
    return old;
  else
    insert into public.auditoria (ator_id, acao, entidade, entidade_id, detalhes)
    values (auth.uid(), 'artista_atualizado', 'artistas', new.id,
      jsonb_build_object('nome', new.nome, 'ativo_antes', old.ativo, 'ativo_depois', new.ativo));
    return new;
  end if;
end;
$$;

CREATE TRIGGER log_auditoria_artistas AFTER INSERT OR UPDATE OR DELETE ON public.artistas
  FOR EACH ROW EXECUTE FUNCTION public.log_auditoria_artistas();