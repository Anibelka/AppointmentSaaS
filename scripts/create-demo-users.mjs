import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUSINESS_ID = '11111111-1111-1111-1111-111111111111';

const demoUsers = [
  {
    email: 'demo@appointmentsaas.com',
    password: 'Demo123!',
    fullName: 'Anibelka Santana',
    phone: '809-555-0100',
    role: 'admin',
    staffId: null,
  },
  {
    email: 'empleado@appointmentsaas.com',
    password: 'Empleado123!',
    fullName: 'Carlos Méndez',
    phone: '809-555-0102',
    role: 'employee',
    staffId: 1,
  },
  {
    email: 'cliente@appointmentsaas.com',
    password: 'Cliente123!',
    fullName: 'Laura Gómez',
    phone: '809-555-2211',
    role: 'client',
    staffId: null,
  },
];

async function findUserByEmail(email) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

async function ensureUser(config) {
  let user = await findUserByEmail(config.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: { full_name: config.fullName, phone: config.phone },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Creado: ${config.email}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: config.password,
      email_confirm: true,
      user_metadata: { full_name: config.fullName, phone: config.phone },
    });
    if (error) throw error;
    console.log(`Actualizado: ${config.email}`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: config.fullName,
    phone: config.phone,
    role: config.role,
    business_id: config.role === 'client' ? null : BUSINESS_ID,
    staff_id: config.staffId,
  }, { onConflict: 'id' });
  if (profileError) throw profileError;

  if (config.staffId) {
    const { error: staffError } = await supabase.from('staff').update({ user_id: user.id }).eq('id', config.staffId);
    if (staffError) throw staffError;
  }
  return user;
}

function santoDomingoDate(daysAhead = 1) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const todayParts = Object.fromEntries(formatter.formatToParts(new Date()).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  const date = new Date(Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day) + daysAhead, 12));
  return date.toISOString().slice(0, 10);
}

function nextOpenWeekday(startDaysAhead = 1) {
  for (let offset = startDaysAhead; offset < startDaysAhead + 14; offset += 1) {
    const date = santoDomingoDate(offset);
    const day = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (day >= 1 && day <= 6) return date;
  }
  return santoDomingoDate(startDaysAhead);
}

async function seedAppointments(clientUserId) {
  const date1 = nextOpenWeekday(1);
  const date2 = nextOpenWeekday(2);
  const date3 = nextOpenWeekday(3);
  const rows = [
    {
      business_id: BUSINESS_ID,
      client_id: clientUserId,
      client_name: 'Laura Gómez', client_phone: '809-555-2211', client_email: 'cliente@appointmentsaas.com',
      service_id: 2, staff_id: 1,
      starts_at: `${date1}T10:00:00-04:00`, ends_at: `${date1}T10:45:00-04:00`,
      local_date: date1, local_time: '10:00', status: 'Confirmada', source: 'Cliente',
      notes: '', reminder_status: 'Programado', email_status: 'Pendiente', confirmation_code: 'APT-DEMOCLIENTE',
    },
    {
      business_id: BUSINESS_ID,
      client_id: null,
      client_name: 'María López', client_phone: '809-555-1001', client_email: 'maria@example.com',
      service_id: 1, staff_id: 2,
      starts_at: `${date2}T11:00:00-04:00`, ends_at: `${date2}T11:30:00-04:00`,
      local_date: date2, local_time: '11:00', status: 'Pendiente', source: 'Negocio',
      notes: '', reminder_status: 'Programado', email_status: 'Pendiente', confirmation_code: 'APT-DEMOAGENDA1',
    },
    {
      business_id: BUSINESS_ID,
      client_id: null,
      client_name: 'Rosa Martínez', client_phone: '829-555-1005', client_email: 'rosa@example.com',
      service_id: 3, staff_id: 3,
      starts_at: `${date3}T15:00:00-04:00`, ends_at: `${date3}T16:00:00-04:00`,
      local_date: date3, local_time: '15:00', status: 'Confirmada', source: 'Negocio',
      notes: '', reminder_status: 'Programado', email_status: 'Pendiente', confirmation_code: 'APT-DEMOAGENDA2',
    },
  ];
  const { error } = await supabase.from('appointments').upsert(rows, { onConflict: 'confirmation_code' });
  if (error) throw error;
  console.log('Citas de demostración preparadas.');
}

try {
  let clientUser;
  for (const config of demoUsers) {
    const user = await ensureUser(config);
    if (config.role === 'client') clientUser = user;
  }
  await seedAppointments(clientUser.id);
  console.log('\nCredenciales listas:');
  console.log('Administrador: demo@appointmentsaas.com / Demo123!');
  console.log('Empleado: empleado@appointmentsaas.com / Empleado123!');
  console.log('Cliente: cliente@appointmentsaas.com / Cliente123!');
} catch (error) {
  console.error(error);
  process.exit(1);
}
