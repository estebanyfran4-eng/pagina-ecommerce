-- =========================================================
--  NOVA · Paso 1: cuentas de clientes
--  Pegá TODO este archivo en Supabase → SQL Editor → Run.
--  Se puede ejecutar más de una vez sin romper nada.
-- =========================================================

-- ---------------------------------------------------------
-- 1) PERFILES
--    Supabase guarda email y contraseña en auth.users (tabla
--    interna, no la tocamos). Nosotros guardamos el resto de
--    los datos del cliente en "profiles", con el mismo id.
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  phone       text default '',
  birth_date  date,
  newsletter  boolean not null default true,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2) DIRECCIONES (un cliente puede tener varias)
-- ---------------------------------------------------------
create table if not exists public.addresses (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null,                 -- "Casa", "Trabajo"…
  street      text not null,                 -- calle y número
  city        text not null,                 -- ciudad y provincia
  zip         text not null,
  is_main     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- ---------------------------------------------------------
-- 3) CREAR EL PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
--    Cuando alguien se registra, Supabase inserta una fila en
--    auth.users. Este trigger crea su fila en profiles usando
--    el nombre que mandamos desde el formulario de registro.
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, newsletter)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'newsletter')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Actualiza updated_at en cada cambio del perfil
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------
-- 4) ¿ES ADMIN?  (se usa en las políticas y en el panel)
--    security definer: puede leer profiles sin chocar con RLS.
-- ---------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------
-- 5) SEGURIDAD: Row Level Security (RLS)
--    La "anon key" que va en el frontend es pública. Lo que
--    protege los datos son estas reglas: cada cliente solo ve
--    y edita SUS filas; el admin puede ver todo.
-- ---------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.addresses enable row level security;

drop policy if exists "perfil: leer el propio"      on public.profiles;
drop policy if exists "perfil: editar el propio"    on public.profiles;
drop policy if exists "direcciones: todo lo propio" on public.addresses;

create policy "perfil: leer el propio" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "perfil: editar el propio" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "direcciones: todo lo propio" on public.addresses
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- Un cliente NO puede cambiarse el rol a sí mismo a 'admin'.
-- (Desde el SQL Editor sí se puede: ahí el usuario es "postgres".)
create or replace function public.protect_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'No tenés permiso para cambiar el rol';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- ---------------------------------------------------------
-- 6) HACER ADMIN AL DUEÑO DE LA TIENDA (ejecutar a mano)
--    Primero registrate en la tienda con el email del dueño,
--    después descomentá y corré esta línea con ese email:
-- ---------------------------------------------------------
-- update public.profiles set role = 'admin' where email = 'dueño@tienda.com';
