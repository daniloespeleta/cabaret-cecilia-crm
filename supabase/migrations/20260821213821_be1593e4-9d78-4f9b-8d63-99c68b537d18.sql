-- Papéis de usuário (tabela separada para evitar escalada de privilégio)
create type public.app_role as enum ('admin', 'promoter', 'staff');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  preferencias text,
  tags text[],
  observacoes text,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.clientes to authenticated;
grant all on public.clientes to service_role;

alter table public.clientes enable row level security;

-- Eventos / atrações
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_hora timestamptz not null,
  tipo text not null default 'festa',
  artista text,
  local text,
  capacidade int,
  status text not null default 'agendado',
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.eventos to authenticated;
grant all on public.eventos to service_role;

alter table public.eventos enable row level security;

-- Promoters
create table public.promoters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  nome text not null,
  taxa_comissao numeric not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.promoters to authenticated;
grant all on public.promoters to service_role;

alter table public.promoters enable row level security;

-- Comandas (contas/consumo)
create table public.comandas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  evento_id uuid references public.eventos(id) on delete set null,
  mesa text,
  status text not null default 'aberta',
  valor_total numeric not null default 0,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.comandas to authenticated;
grant all on public.comandas to service_role;

alter table public.comandas enable row level security;

-- Itens de comanda
create table public.itens_comanda (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid references public.comandas(id) on delete cascade not null,
  descricao text not null,
  quantidade int not null default 1,
  valor_unitario numeric not null default 0,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.itens_comanda to authenticated;
grant all on public.itens_comanda to service_role;

alter table public.itens_comanda enable row level security;

-- Guest list
create table public.guest_list (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.eventos(id) on delete cascade not null,
  nome text not null,
  telefone text,
  promoter_id uuid references public.promoters(id) on delete set null,
  status text not null default 'pendente',
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.guest_list to authenticated;
grant all on public.guest_list to service_role;

alter table public.guest_list enable row level security;

-- ===== Políticas RLS =====

-- user_roles: usuário lê seus próprios papéis; admins veem todos
create policy "Users can view own roles" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- clientes: admin tudo; promoter/staff podem gerenciar
create policy "Admins manage all clientes" on public.clientes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Team can manage clientes" on public.clientes
  for all to authenticated
  using (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'));

-- eventos: admin tudo; promoter/staff podem gerenciar
create policy "Admins manage all eventos" on public.eventos
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Team can manage eventos" on public.eventos
  for all to authenticated
  using (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'promoter') or public.has_role(auth.uid(), 'staff'));

-- promoters: admin gerencia; cada promoter vê o próprio registro
create policy "Admins manage promoters" on public.promoters
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Promoters view own record" on public.promoters
  for select to authenticated
  using (auth.uid() = user_id);

-- comandas: admin tudo; staff/promoter podem gerenciar
create policy "Admins manage all comandas" on public.comandas
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Team can manage comandas" on public.comandas
  for all to authenticated
  using (public.has_role(auth.uid(), 'staff') or public.has_role(auth.uid(), 'promoter'))
  with check (public.has_role(auth.uid(), 'staff') or public.has_role(auth.uid(), 'promoter'));

-- itens_comanda: admin tudo; staff/promoter podem gerenciar (via comandas)
create policy "Admins manage all itens" on public.itens_comanda
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Team can manage itens" on public.itens_comanda
  for all to authenticated
  using (public.has_role(auth.uid(), 'staff') or public.has_role(auth.uid(), 'promoter'))
  with check (public.has_role(auth.uid(), 'staff') or public.has_role(auth.uid(), 'promoter'));

-- guest_list: admin tudo; promoter gerencia própria guest list; staff marca entradas
create policy "Admins manage all guest list" on public.guest_list
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Promoters manage their guest list" on public.guest_list
  for all to authenticated
  using (public.has_role(auth.uid(), 'promoter') and (
    promoter_id is null or promoter_id in (select id from public.promoters where user_id = auth.uid())
  ))
  with check (public.has_role(auth.uid(), 'promoter') and (
    promoter_id is null or promoter_id in (select id from public.promoters where user_id = auth.uid())
  ));

create policy "Staff manage guest list entries" on public.guest_list
  for all to authenticated
  using (public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'staff'));

-- Função para manter updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_clientes_updated_at before update on public.clientes for each row execute function public.set_updated_at();
create trigger set_eventos_updated_at before update on public.eventos for each row execute function public.set_updated_at();
create trigger set_promoters_updated_at before update on public.promoters for each row execute function public.set_updated_at();
create trigger set_comandas_updated_at before update on public.comandas for each row execute function public.set_updated_at();
create trigger set_guest_list_updated_at before update on public.guest_list for each row execute function public.set_updated_at();