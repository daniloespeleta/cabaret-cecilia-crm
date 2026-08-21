-- Atrações / Artistas do cabaret
create table public.artistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'outro',
  contato text,
  instagram text,
  descricao text,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.artistas to authenticated;
grant all on public.artistas to service_role;
alter table public.artistas enable row level security;

-- Programação da noite (muitos-para-muitos eventos <-> artistas, com cachê e horário)
create table public.evento_artistas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.eventos(id) on delete cascade not null,
  artista_id uuid references public.artistas(id) on delete cascade not null,
  horario timestamptz,
  cache numeric not null default 0,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  unique (evento_id, artista_id)
);
grant select, insert, update, delete on public.evento_artistas to authenticated;
grant all on public.evento_artistas to service_role;
alter table public.evento_artistas enable row level security;

-- Bilheteria: ingressos por evento
create table public.ingressos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.eventos(id) on delete cascade not null,
  tipo text not null default 'pista',
  preco numeric not null default 0,
  quantidade int not null default 0,
  vendidos int not null default 0,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ingressos to authenticated;
grant all on public.ingressos to service_role;
alter table public.ingressos enable row level security;

-- RLS: admin gerencia tudo; promoter/staff gerenciam (mesmo padrão das demais tabelas)
create policy "Admins manage all artistas" on public.artistas
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Team can manage artistas" on public.artistas
  for all to authenticated
  using (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'));

create policy "Admins manage all evento_artistas" on public.evento_artistas
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Team can manage evento_artistas" on public.evento_artistas
  for all to authenticated
  using (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'));

create policy "Admins manage all ingressos" on public.ingressos
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Team can manage ingressos" on public.ingressos
  for all to authenticated
  using (public.has_role(auth.uid(), 'staff') or public.has_role(auth.uid(), 'promoter'))
  with check (public.has_role(auth.uid(), 'staff') or public.has_role(auth.uid(), 'promoter'));

-- Triggers de updated_at
create trigger set_artistas_updated_at before update on public.artistas for each row execute function public.set_updated_at();
create trigger set_ingressos_updated_at before update on public.ingressos for each row execute function public.set_updated_at();

-- Trava contra excesso de venda por tipo de ingresso
create or replace function public.check_ingresso_vendidos()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.vendidos > new.quantidade then
    raise exception 'Venda excede a quantidade disponível deste ingresso (quantidade: %, vendidos: %).', new.quantidade, new.vendidos;
  end if;
  return new;
end;
$$;
create trigger check_ingresso_vendidos before update on public.ingressos for each row execute function public.check_ingresso_vendidos();