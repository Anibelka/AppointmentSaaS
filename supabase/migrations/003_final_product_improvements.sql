-- AppointmentSaaS - mejoras finales de producto
-- Ejecutar una vez después de 001_schema_rls_seed.sql en proyectos existentes.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
alter table public.businesses add column if not exists brand_primary_color text not null default '#2f6fe4', add column if not exists brand_logo_text text not null default 'BC', add column if not exists booking_message text not null default 'Reserva tu cita sin llamadas ni mensajes.';
alter table public.appointments add column if not exists reminder_24h_sent_at timestamptz, add column if not exists reminder_2h_sent_at timestamptz, add column if not exists cancellation_email_sent_at timestamptz;
alter function public.book_appointment(text,bigint,bigint,timestamptz,text) set search_path = pg_catalog, public, extensions;
alter function public.admin_create_appointment(bigint,bigint,timestamptz,text,text,text,text) set search_path = pg_catalog, public, extensions;
create or replace function public.admin_create_historical_appointment(p_service_id bigint,p_staff_id bigint,p_starts_at timestamptz,p_client_name text,p_client_phone text,p_client_email text,p_status text,p_source text,p_notes text default '') returns public.appointments language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
declare v_business public.businesses%rowtype;v_service public.services%rowtype;v_staff public.staff%rowtype;v_local_start timestamp;v_ends_at timestamptz;v_code text;v_row public.appointments%rowtype;
begin
 select b.* into v_business from public.businesses b where b.id=public.current_business_id() and public.current_profile_role()='admin';if not found then raise exception 'Acceso administrativo requerido.' using errcode='42501';end if;
 if p_starts_at>now() then raise exception 'El registro histórico debe pertenecer al pasado o al momento actual.';end if;if p_status not in ('Completada','Cancelada','No asistió') then raise exception 'El historial requiere un estado final.';end if;if p_source not in ('Cliente','Negocio') then raise exception 'Origen inválido.';end if;
 select * into v_service from public.services where id=p_service_id and business_id=v_business.id;if not found then raise exception 'Servicio no encontrado.';end if;select * into v_staff from public.staff where id=p_staff_id and business_id=v_business.id;if not found then raise exception 'Profesional no encontrado.';end if;
 v_ends_at:=p_starts_at+make_interval(mins=>v_service.duration_minutes);v_local_start:=p_starts_at at time zone v_business.timezone;v_code:='APT-H-'||upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,10));
 insert into public.appointments(business_id,client_id,client_name,client_phone,client_email,service_id,staff_id,starts_at,ends_at,local_date,local_time,status,source,notes,reminder_status,email_status,confirmation_code) values(v_business.id,null,trim(p_client_name),trim(p_client_phone),lower(trim(p_client_email)),p_service_id,p_staff_id,p_starts_at,v_ends_at,v_local_start::date,v_local_start::time,p_status,p_source,coalesce(p_notes,''),case when p_status='Cancelada' then 'Cancelado' else 'Enviado' end,'No configurado',v_code) returning * into v_row;
 perform public.write_audit(v_business.id,'Registro histórico '||v_code||' agregado con estado '||p_status);return v_row;
exception when exclusion_violation then raise exception 'El profesional ya posee un registro que coincide con ese horario.';end;$$;
grant execute on function public.admin_create_historical_appointment(bigint,bigint,timestamptz,text,text,text,text,text,text) to authenticated;
update public.services set name='Limpieza facial masculina',description='Limpieza y cuidado facial orientado al público masculino.' where business_id='11111111-1111-1111-1111-111111111111' and id=3;
update public.services set name='Peinado y styling',description='Peinado, definición y acabado profesional.' where business_id='11111111-1111-1111-1111-111111111111' and id=4;
update public.staff set name='Carlos Méndez',specialty='Barbero senior',schedule_label='Lun-Sáb' where business_id='11111111-1111-1111-1111-111111111111' and id=1;
update public.staff set name='Miguel Ramírez',specialty='Corte y arreglo de barba',schedule_label='Mar-Sáb' where business_id='11111111-1111-1111-1111-111111111111' and id=2;
update public.staff set name='Javier Santos',specialty='Styling y cuidado facial',schedule_label='Lun-Vie' where business_id='11111111-1111-1111-1111-111111111111' and id=3;
