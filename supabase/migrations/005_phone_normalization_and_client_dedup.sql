-- AppointmentSaaS - normalización de teléfonos y unificación de clientes
-- Ejecutar después de 004_client_directory.sql.

create or replace function public.normalize_phone_digits(p_phone text)
returns text
language sql
immutable
set search_path=pg_catalog
as $$
  with raw as (
    select regexp_replace(coalesce(p_phone,''), '\D', '', 'g') as digits
  )
  select case
    when length(digits)=11 and digits like '1%' then substr(digits,2,10)
    else left(digits,10)
  end
  from raw;
$$;

create or replace function public.format_phone(p_phone text)
returns text
language sql
immutable
set search_path=pg_catalog,public
as $$
  with normalized as (
    select public.normalize_phone_digits(p_phone) as digits
  )
  select case
    when length(digits)=10 then substr(digits,1,3)||'-'||substr(digits,4,3)||'-'||substr(digits,7,4)
    when length(digits)>6 then substr(digits,1,3)||'-'||substr(digits,4,3)||'-'||substr(digits,7)
    when length(digits)>3 then substr(digits,1,3)||'-'||substr(digits,4)
    else digits
  end
  from normalized;
$$;

-- Homogeneizar la presentación de los teléfonos.
update public.clients
set phone=public.format_phone(phone)
where phone is distinct from public.format_phone(phone);

update public.appointments
set client_phone=public.format_phone(client_phone)
where client_phone is distinct from public.format_phone(client_phone);

update public.profiles
set phone=public.format_phone(phone)
where phone is distinct from public.format_phone(phone);

-- Identificar duplicados por negocio + mismo nombre + mismo teléfono de 10 dígitos.
create temporary table client_merge_map on commit drop as
with ranked as (
  select
    id,
    first_value(id) over (
      partition by business_id,lower(trim(full_name)),public.normalize_phone_digits(phone)
      order by (profile_id is not null) desc,id
    ) as survivor_id,
    row_number() over (
      partition by business_id,lower(trim(full_name)),public.normalize_phone_digits(phone)
      order by (profile_id is not null) desc,id
    ) as position
  from public.clients
  where length(public.normalize_phone_digits(phone))=10
)
select id as duplicate_id,survivor_id
from ranked
where position>1;

-- Conservar el perfil vinculado y los mejores datos disponibles.
update public.clients survivor
set
  profile_id=coalesce(
    survivor.profile_id,
    (
      select duplicate.profile_id
      from client_merge_map map
      join public.clients duplicate on duplicate.id=map.duplicate_id
      where map.survivor_id=survivor.id and duplicate.profile_id is not null
      limit 1
    )
  ),
  phone=public.format_phone(survivor.phone),
  active=true,
  updated_at=now()
where survivor.id in (select survivor_id from client_merge_map);

-- Mover las citas al registro que se conservará.
update public.appointments appointment
set client_record_id=map.survivor_id
from client_merge_map map
where appointment.client_record_id=map.duplicate_id;

-- Eliminar los registros repetidos.
delete from public.clients client
using client_merge_map map
where client.id=map.duplicate_id;

-- Evitar nuevos duplicados: buscar por cuenta, correo o teléfono normalizado.
create or replace function public.ensure_business_client(
  p_business_id uuid,
  p_profile_id uuid,
  p_full_name text,
  p_phone text,
  p_email text
)
returns public.clients
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_client public.clients%rowtype;
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_phone text:=public.format_phone(p_phone);
  v_phone_digits text:=public.normalize_phone_digits(p_phone);
begin
  if trim(coalesce(p_full_name,''))='' then
    raise exception 'El nombre del cliente es obligatorio.';
  end if;
  if v_email='' then
    raise exception 'El correo del cliente es obligatorio.';
  end if;
  if length(v_phone_digits)<>10 then
    raise exception 'El teléfono debe contener 10 dígitos.';
  end if;

  select * into v_client
  from public.clients
  where business_id=p_business_id
    and (
      (p_profile_id is not null and profile_id=p_profile_id)
      or lower(email)=v_email
      or public.normalize_phone_digits(phone)=v_phone_digits
    )
  order by
    (p_profile_id is not null and profile_id=p_profile_id) desc,
    (lower(email)=v_email) desc,
    (profile_id is not null) desc,
    id
  limit 1;

  if found then
    update public.clients
    set
      profile_id=coalesce(profile_id,p_profile_id),
      full_name=trim(p_full_name),
      phone=v_phone,
      email=v_email,
      active=true
    where id=v_client.id
    returning * into v_client;
  else
    insert into public.clients(
      business_id,profile_id,full_name,phone,email,active
    ) values(
      p_business_id,p_profile_id,trim(p_full_name),v_phone,v_email,true
    )
    returning * into v_client;
  end if;

  return v_client;
end;
$$;

-- Debe devolver cero filas.
select
  business_id,
  full_name,
  public.format_phone(phone) as phone,
  count(*) as records
from public.clients
where length(public.normalize_phone_digits(phone))=10
group by business_id,lower(trim(full_name)),full_name,public.format_phone(phone)
having count(*)>1
order by full_name;
