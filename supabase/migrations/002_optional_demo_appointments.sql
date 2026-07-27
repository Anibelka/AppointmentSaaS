-- Optional sample appointments.
-- Run only after demo users have been created by scripts/create-demo-users.mjs.
-- This file intentionally does not hard-code auth UUIDs. The frontend works without it.

-- Example business closure:
-- insert into public.business_closures (business_id, closure_date, reason)
-- values ('11111111-1111-1111-1111-111111111111', current_date + 14, 'Mantenimiento')
-- on conflict (business_id, closure_date) do update set reason=excluded.reason;
