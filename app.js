
const STORAGE_KEY = "appointmentsaas_schedule_clients_v4";
const BUSINESS_SESSION_KEY = "appointmentsaas_business_session_v4";
const CLIENT_SESSION_KEY = "appointmentsaas_client_session_v4";
const TIME_ZONE = "America/Santo_Domingo";
const SLOT_INTERVAL_MINUTES = 30;
const CANCEL_LIMIT_HOURS = 2;

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const DAY_NAMES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DAY_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DEFAULT_SCHEDULE = {
  0: { open: false, start: "10:00", end: "14:00" },
  1: { open: true,  start: "09:00", end: "20:00" },
  2: { open: true,  start: "09:00", end: "20:00" },
  3: { open: true,  start: "09:00", end: "20:00" },
  4: { open: true,  start: "09:00", end: "20:00" },
  5: { open: true,  start: "09:00", end: "20:00" },
  6: { open: true,  start: "09:00", end: "18:00" }
};

function zonedParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
}
function zonedToday() {
  const p = zonedParts();
  return `${p.year}-${p.month}-${p.day}`;
}
function zonedMinutesNow() {
  const p = zonedParts();
  return Number(p.hour) * 60 + Number(p.minute);
}
function dateOffset(days) {
  const [y,m,d] = zonedToday().split("-").map(Number);
  const dt = new Date(Date.UTC(y,m-1,d+days,12,0,0));
  return dt.toISOString().slice(0,10);
}
function dayIndex(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}
function toMinutes(time) {
  const [h,m] = time.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
function nextOpenDate(openDayOffset, schedule = DEFAULT_SCHEDULE) {
  let found = -1;
  for (let day = 0; day < 60; day++) {
    const date = dateOffset(day);
    if (schedule[dayIndex(date)]?.open) {
      found += 1;
      if (found === openDayOffset) return date;
    }
  }
  return dateOffset(openDayOffset);
}
function appointmentInstant(a) {
  return new Date(`${a.date}T${a.time}:00-04:00`);
}
function hoursUntilAppointment(a) {
  return (appointmentInstant(a).getTime() - Date.now()) / 3600000;
}
function createInitialState() {
  const schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  const d0 = nextOpenDate(0, schedule);
  const d1 = nextOpenDate(1, schedule);
  const d2 = nextOpenDate(2, schedule);
  const d3 = nextOpenDate(3, schedule);
  const d4 = nextOpenDate(4, schedule);
  return {
    business: {
      name: "Barbería Caribe",
      phone: "809-555-0101",
      address: "Av. Winston Churchill, Santo Domingo",
      schedule,
      closures: []
    },
    emailConfig: {
      enabled: false,
      serviceId: "",
      templateId: "",
      publicKey: ""
    },
    subscription: { plan: "Pro", trialDays: 17 },
    notificationSettings: { immediate: true, h24: true, h2: true },
    clientAccounts: [
      { id: 9001, name: "Laura Gómez", phone: "809-555-2211", email: "cliente@appointmentsaas.com", password: "Cliente123!" }
    ],
    services: [
      { id: 1, name: "Corte", price: 700, duration: 30, description: "Corte clásico o moderno según preferencia.", active: true },
      { id: 2, name: "Corte + Barba", price: 1200, duration: 45, description: "Servicio completo de corte y arreglo de barba.", active: true },
      { id: 3, name: "Spa Facial", price: 1500, duration: 60, description: "Limpieza facial y cuidado básico de la piel.", active: true },
      { id: 4, name: "Peinado", price: 900, duration: 40, description: "Peinado y terminación profesional.", active: true }
    ],
    staff: [
      { id: 1, name: "Carlos", specialty: "Barbero senior", schedule: "Lun–Sáb", active: true },
      { id: 2, name: "Miguel", specialty: "Corte y barba", schedule: "Mar–Sáb", active: true },
      { id: 3, name: "Andrea", specialty: "Estética y peinados", schedule: "Lun–Vie", active: true }
    ],
    appointments: [
      { id: 101, code: "APT-540921", client: "María López", phone: "809-555-1001", email: "maria@example.com", serviceId: 1, staffId: 1, date: d0, time: "09:00", status: "Completada", source: "Cliente", notes: "", reminderStatus: "Enviado" },
      { id: 102, code: "APT-114732", client: "Carlos Pérez", phone: "829-555-1002", email: "carlos@example.com", serviceId: 2, staffId: 2, date: d0, time: "10:30", status: "Confirmada", source: "Cliente", notes: "", reminderStatus: "Enviado" },
      { id: 103, code: "APT-338105", client: "Ana Díaz", phone: "849-555-1003", email: "ana@example.com", serviceId: 4, staffId: 3, date: d0, time: "15:00", status: "Pendiente", source: "Negocio", notes: "", reminderStatus: "Programado" },
      { id: 104, code: "APT-892014", client: "Luis Gómez", phone: "809-555-1004", email: "luis@example.com", serviceId: 3, staffId: 3, date: d0, time: "16:00", status: "No asistió", source: "Cliente", notes: "", reminderStatus: "Enviado" },
      { id: 105, code: "APT-773450", client: "Rosa Martínez", phone: "829-555-1005", email: "rosa@example.com", serviceId: 2, staffId: 1, date: d1, time: "12:00", status: "Confirmada", source: "Cliente", notes: "", reminderStatus: "Programado" },
      { id: 106, code: "APT-629083", client: "José Ramírez", phone: "849-555-1006", email: "jose@example.com", serviceId: 1, staffId: 2, date: d1, time: "16:00", status: "Pendiente", source: "Negocio", notes: "", reminderStatus: "Programado" },
      { id: 107, code: "APT-482771", client: "Daniela Cruz", phone: "809-555-1007", email: "daniela@example.com", serviceId: 3, staffId: 3, date: d2, time: "16:00", status: "Confirmada", source: "Cliente", notes: "", reminderStatus: "Programado" },
      { id: 108, code: "APT-901267", client: "Pedro Santana", phone: "829-555-1008", email: "pedro@example.com", serviceId: 2, staffId: 1, date: d2, time: "17:00", status: "Cancelada", source: "Cliente", notes: "", reminderStatus: "Cancelado" },
      { id: 109, code: "APT-140225", client: "Laura Gómez", phone: "809-555-2211", email: "cliente@appointmentsaas.com", serviceId: 2, staffId: 1, date: d3, time: "10:00", status: "Confirmada", source: "Cliente", notes: "", reminderStatus: "Programado" }
    ],
    audit: [
      { id: 1, at: new Date().toISOString(), action: "Demo inicializado con horario de Santo Domingo", actor: "Sistema" }
    ]
  };
}

let state = loadState();
let bookingStep = 1;
let bookingDraft = {};
let lastConfirmedAppointmentId = null;
let currentBusinessView = "dashboard";

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.business?.schedule && parsed?.clientAccounts) return parsed;
  } catch {}
  return createInitialState();
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getBusinessSession() {
  try { return JSON.parse(localStorage.getItem(BUSINESS_SESSION_KEY)); } catch { return null; }
}
function setBusinessSession(v) { localStorage.setItem(BUSINESS_SESSION_KEY, JSON.stringify(v)); }
function clearBusinessSession() { localStorage.removeItem(BUSINESS_SESSION_KEY); }
function getClientSession() {
  try { return JSON.parse(localStorage.getItem(CLIENT_SESSION_KEY)); } catch { return null; }
}
function setClientSession(v) { localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(v)); }
function clearClientSession() { localStorage.removeItem(CLIENT_SESSION_KEY); }

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}
function currency(v) {
  return new Intl.NumberFormat("es-DO", { style:"currency", currency:"DOP", maximumFractionDigits:0 }).format(v).replace("DOP","RD$");
}
function formatDate(d) {
  return new Intl.DateTimeFormat("es-DO", { timeZone:TIME_ZONE, weekday:"short", day:"2-digit", month:"short", year:"numeric" })
    .format(new Date(`${d}T12:00:00-04:00`));
}
function formatTime(t) {
  const [h,m] = t.split(":").map(Number);
  const d = new Date(Date.UTC(2026,0,1,h+4,m));
  return new Intl.DateTimeFormat("es-DO", { timeZone:TIME_ZONE, hour:"numeric", minute:"2-digit" }).format(d);
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function addAudit(action, actor = null) {
  const business = getBusinessSession();
  const client = getClientSession();
  state.audit.unshift({
    id: Date.now() + Math.random(),
    at: new Date().toISOString(),
    action,
    actor: actor || business?.name || client?.name || "Sistema"
  });
  state.audit = state.audit.slice(0,80);
  saveState();
}
function generateCode() {
  let code;
  do code = "APT-" + Math.floor(100000 + Math.random()*900000);
  while (state.appointments.some(a => a.code === code));
  return code;
}
function activeServices() { return state.services.filter(s => s.active); }
function activeStaff() { return state.staff.filter(s => s.active); }
function getService(id) { return state.services.find(s => s.id === Number(id)); }
function getStaff(id) { return state.staff.find(s => s.id === Number(id)); }
function priceOf(a) { return getService(a.serviceId)?.price || 0; }
function sortAppointments(list) { return list.slice().sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time)); }

function closureForDate(date) {
  return state.business.closures.find(c => c.date === date);
}
function scheduleForDate(date) {
  const closure = closureForDate(date);
  if (closure) return { open:false, closure };
  return state.business.schedule[dayIndex(date)] || { open:false, start:"09:00", end:"17:00" };
}
function publicScheduleSummary() {
  const schedule = state.business.schedule;
  const orderedDays = [1,2,3,4,5,6,0];
  const groups = [];
  const same = (a,b) => a.open===b.open && a.start===b.start && a.end===b.end;
  let startIndex = 0;
  for (let i = 1; i <= orderedDays.length; i++) {
    const atEnd = i === orderedDays.length;
    const previous = schedule[orderedDays[i-1]];
    const current = atEnd ? null : schedule[orderedDays[i]];
    if (!atEnd && same(previous,current)) continue;
    const firstDay = orderedDays[startIndex];
    const lastDay = orderedDays[i-1];
    const item = schedule[firstDay];
    const label = firstDay === lastDay ? DAY_SHORT[firstDay] : `${DAY_SHORT[firstDay]}–${DAY_SHORT[lastDay]}`;
    groups.push(item.open ? `${label} ${formatTime(item.start)}–${formatTime(item.end)}` : `${label} cerrado`);
    startIndex = i;
  }
  return groups.join(" · ");
}
function slotsFor(serviceId, staffId, date) {
  const schedule = scheduleForDate(date);
  if (!schedule.open) return [];
  const service = getService(serviceId);
  if (!service || !getStaff(staffId)?.active) return [];
  const start = toMinutes(schedule.start);
  const end = toMinutes(schedule.end);
  const now = date === zonedToday() ? zonedMinutesNow() : -1;
  const slots = [];
  for (let candidate=start; candidate + service.duration <= end; candidate += SLOT_INTERVAL_MINUTES) {
    if (date === zonedToday() && candidate <= now) continue;
    const time = fromMinutes(candidate);
    if (!isSlotTaken(staffId,date,time,service.duration)) slots.push(time);
  }
  return slots;
}
function isSlotTaken(staffId,date,time,duration,excludeId=null) {
  const candidateStart = toMinutes(time);
  const candidateEnd = candidateStart + duration;
  return state.appointments.some(a => {
    if (a.id === excludeId || a.staffId !== Number(staffId) || a.date !== date || ["Cancelada","No asistió"].includes(a.status)) return false;
    const existingService = getService(a.serviceId);
    const existingStart = toMinutes(a.time);
    const existingEnd = existingStart + (existingService?.duration || 30);
    return candidateStart < existingEnd && candidateEnd > existingStart;
  });
}
function validateSlot(serviceId,staffId,date,time) {
  if (date < zonedToday()) return "No puedes reservar en una fecha pasada.";
  const schedule = scheduleForDate(date);
  if (!schedule.open) return schedule.closure ? `El local está cerrado: ${schedule.closure.reason}.` : `El local no trabaja los ${DAY_NAMES[dayIndex(date)].toLowerCase()}.`;
  const service = getService(serviceId);
  if (!service) return "Selecciona un servicio válido.";
  const start = toMinutes(time);
  if (date === zonedToday() && start <= zonedMinutesNow()) return "Esa hora ya pasó en República Dominicana.";
  if (start < toMinutes(schedule.start) || start + service.duration > toMinutes(schedule.end)) return "El servicio no cabe dentro del horario laboral de ese día.";
  if (isSlotTaken(staffId,date,time,service.duration)) return "El profesional ya tiene una cita que coincide con ese horario.";
  return "";
}

function setPublicView(name) {
  $$(".public-view").forEach(v => v.classList.add("hidden"));
  const el = $("#" + name + "PublicView");
  if (!el) return;
  el.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
  if (name === "home") renderPublicHome();
  if (name === "booking") { resetBooking(); renderBookingStep(); }
  if (name === "clientAccount") renderClientAccount();
}
$$("[data-public-view]").forEach(b => b.addEventListener("click", () => setPublicView(b.dataset.publicView)));

function renderBusinessIdentity() {
  $$("[data-business-name]").forEach(el => el.textContent = state.business.name);
  $("#publicBusinessPhone").textContent = state.business.phone;
  $("#publicBusinessAddress").textContent = state.business.address;
  $("#publicBusinessHours").textContent = publicScheduleSummary();
  $("#businessNameSetting").value = state.business.name;
  $("#businessPhoneSetting").value = state.business.phone;
  $("#businessAddressSetting").value = state.business.address;
  document.title = `${state.business.name} · AppointmentSaaS`;
}
function findNextAvailability() {
  const service = activeServices()[0];
  if (!service) return null;
  for (let day=0;day<30;day++) {
    const date = dateOffset(day);
    for (const staff of activeStaff()) {
      const slots = slotsFor(service.id,staff.id,date);
      if (slots.length) return { date, time:slots[0], service, staff };
    }
  }
  return null;
}
function renderPublicHome() {
  renderBusinessIdentity();
  $("#publicServicesGrid").innerHTML = activeServices().map(s => `
    <article class="service-card">
      <div class="service-icon">${s.name.includes("Barba")?"✦":s.name.includes("Facial")?"◉":s.name.includes("Peinado")?"≈":"✂"}</div>
      <h3>${escapeHtml(s.name)}</h3>
      <p>${escapeHtml(s.description)}</p>
      <div class="service-meta"><span>${s.duration} min</span><span>${currency(s.price)}</span></div>
    </article>`).join("");
  $("#publicStaffGrid").innerHTML = activeStaff().map(p => `
    <article class="staff-card"><div class="staff-avatar">${escapeHtml(p.name.slice(0,2).toUpperCase())}</div>
    <div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.specialty)}</small><small>${escapeHtml(p.schedule)}</small></div></article>`).join("");
  const next = findNextAvailability();
  $("#publicNextAvailability").textContent = next ? `${formatDate(next.date)}, ${formatTime(next.time)}` : "Sin disponibilidad";
  $("#publicNextService").textContent = next?.service.name || "Sin servicios activos";
  $("#publicNextServiceMeta").textContent = next ? `${next.service.duration} min · ${currency(next.service.price)} · ${next.staff.name}` : "Revisa la configuración del negocio";
  renderClientHeader();
}
function renderClientHeader() {
  const session = getClientSession();
  $("#openClientAuth").textContent = session ? `Mi cuenta · ${session.name.split(" ")[0]}` : "Mi cuenta";
}

function resetBooking() {
  const client = getClientSession();
  bookingStep = 1;
  bookingDraft = {
    serviceId:null,
    staffId:activeStaff()[0]?.id || null,
    date:zonedToday(),
    time:"",
    client:client?.name || "",
    phone:client?.phone || "",
    email:client?.email || "",
    notes:""
  };
  $("#publicBookingForm").reset();
  $("#bookingDate").min = zonedToday();
  $("#bookingDate").value = bookingDraft.date;
  $("#bookingClientName").value = bookingDraft.client;
  $("#bookingClientPhone").value = bookingDraft.phone;
  $("#bookingClientEmail").value = bookingDraft.email;
}
function renderBookingStep() {
  $$("[data-booking-step]").forEach(el => el.classList.toggle("hidden", Number(el.dataset.bookingStep)!==bookingStep));
  $$("[data-step-indicator]").forEach(el => el.classList.toggle("active", Number(el.dataset.stepIndicator)<=bookingStep));
  if (bookingStep===1) renderBookingServices();
  if (bookingStep===2) renderBookingSchedule();
  if (bookingStep===3) renderBookingAccountHint();
  if (bookingStep===4) renderBookingSummary();
}
function renderBookingServices() {
  $("#bookingServices").innerHTML = activeServices().map(s => `
    <button type="button" class="select-card ${bookingDraft.serviceId===s.id?"selected":""}" data-book-service="${s.id}">
      <strong>${escapeHtml(s.name)}</strong><small>${s.duration} min · ${currency(s.price)}</small>
    </button>`).join("");
}
function renderBookingSchedule() {
  $("#bookingStaff").innerHTML = activeStaff().map(p => `<option value="${p.id}">${escapeHtml(p.name)} · ${escapeHtml(p.specialty)}</option>`).join("");
  $("#bookingStaff").value = String(bookingDraft.staffId || activeStaff()[0]?.id || "");
  $("#bookingDate").min = zonedToday();
  $("#bookingDate").value = bookingDraft.date || zonedToday();
  renderAvailableTimes();
}
function renderAvailableTimes() {
  bookingDraft.staffId = Number($("#bookingStaff").value || bookingDraft.staffId);
  bookingDraft.date = $("#bookingDate").value || bookingDraft.date;
  const schedule = scheduleForDate(bookingDraft.date);
  const service = getService(bookingDraft.serviceId);
  if (!schedule.open) {
    const reason = schedule.closure ? schedule.closure.reason : `el local no trabaja los ${DAY_NAMES[dayIndex(bookingDraft.date)].toLowerCase()}`;
    $("#bookingScheduleNotice").className = "schedule-notice closed";
    $("#bookingScheduleNotice").textContent = `No hay horarios disponibles: ${reason}.`;
    $("#bookingTimes").innerHTML = `<div class="empty-state">Selecciona otro día.</div>`;
    return;
  }
  $("#bookingScheduleNotice").className = "schedule-notice";
  $("#bookingScheduleNotice").textContent = `${DAY_NAMES[dayIndex(bookingDraft.date)]}: ${formatTime(schedule.start)} a ${formatTime(schedule.end)}${service ? ` · Duración del servicio: ${service.duration} min` : ""}.`;
  const slots = slotsFor(bookingDraft.serviceId,bookingDraft.staffId,bookingDraft.date);
  if (!slots.includes(bookingDraft.time)) bookingDraft.time = "";
  $("#bookingTimes").innerHTML = slots.length ? slots.map(t => `
    <button type="button" class="time-option ${bookingDraft.time===t?"selected":""}" data-book-time="${t}">${formatTime(t)}</button>`).join("")
    : `<div class="empty-state">No quedan horarios disponibles para ese profesional y servicio.</div>`;
}
function renderBookingAccountHint() {
  const client = getClientSession();
  $("#bookingAccountHint").innerHTML = client
    ? `<strong>Sesión iniciada como ${escapeHtml(client.name)}.</strong> Tus datos se completaron automáticamente y la cita aparecerá en tu portal.`
    : `<strong>Puedes reservar como invitado.</strong> Para ver todas tus citas en un solo lugar, crea una cuenta o inicia sesión desde “Mi cuenta”.`;
  if (client) {
    $("#bookingClientName").value = client.name;
    $("#bookingClientPhone").value = client.phone;
    $("#bookingClientEmail").value = client.email;
  }
}
function collectBookingInputs() {
  bookingDraft.staffId = Number($("#bookingStaff")?.value || bookingDraft.staffId);
  bookingDraft.date = $("#bookingDate")?.value || bookingDraft.date;
  bookingDraft.client = $("#bookingClientName")?.value.trim() || bookingDraft.client;
  bookingDraft.phone = $("#bookingClientPhone")?.value.trim() || bookingDraft.phone;
  bookingDraft.email = $("#bookingClientEmail")?.value.trim().toLowerCase() || bookingDraft.email;
  bookingDraft.notes = $("#bookingNotes")?.value.trim() || bookingDraft.notes;
}
function validateBookingStep() {
  if (bookingStep===1 && !bookingDraft.serviceId) { showToast("Selecciona un servicio"); return false; }
  if (bookingStep===2) {
    collectBookingInputs();
    if (!bookingDraft.staffId || !bookingDraft.date || !bookingDraft.time) { showToast("Selecciona profesional, fecha y hora"); return false; }
    const error = validateSlot(bookingDraft.serviceId,bookingDraft.staffId,bookingDraft.date,bookingDraft.time);
    if (error) { showToast(error); renderAvailableTimes(); return false; }
  }
  if (bookingStep===3) {
    collectBookingInputs();
    if (!bookingDraft.client || !bookingDraft.phone || !bookingDraft.email || !$("#bookingConsent").checked) {
      showToast("Completa los datos y acepta la confirmación"); return false;
    }
  }
  return true;
}
function renderBookingSummary() {
  const s = getService(bookingDraft.serviceId), p = getStaff(bookingDraft.staffId);
  $("#bookingSummary").innerHTML = `
    <div class="summary-item"><span>Servicio</span><strong>${escapeHtml(s?.name)}</strong></div>
    <div class="summary-item"><span>Precio</span><strong>${currency(s?.price||0)}</strong></div>
    <div class="summary-item"><span>Profesional</span><strong>${escapeHtml(p?.name)}</strong></div>
    <div class="summary-item"><span>Fecha y hora</span><strong>${formatDate(bookingDraft.date)} · ${formatTime(bookingDraft.time)}</strong></div>
    <div class="summary-item"><span>Cliente</span><strong>${escapeHtml(bookingDraft.client)}</strong></div>
    <div class="summary-item"><span>Correo</span><strong>${escapeHtml(bookingDraft.email)}</strong></div>`;
}
$("#bookingServices").addEventListener("click", e => {
  const b = e.target.closest("[data-book-service]"); if (!b) return;
  bookingDraft.serviceId = Number(b.dataset.bookService); renderBookingServices();
});
$("#bookingStaff").addEventListener("change", () => { bookingDraft.time=""; renderAvailableTimes(); });
$("#bookingDate").addEventListener("change", () => { bookingDraft.time=""; renderAvailableTimes(); });
$("#bookingTimes").addEventListener("click", e => {
  const b = e.target.closest("[data-book-time]"); if (!b) return;
  bookingDraft.time = b.dataset.bookTime; renderAvailableTimes();
});
$$("[data-next-step]").forEach(b => b.addEventListener("click", () => {
  if (validateBookingStep()) { bookingStep = Math.min(4,bookingStep+1); renderBookingStep(); }
}));
$$("[data-prev-step]").forEach(b => b.addEventListener("click", () => {
  collectBookingInputs(); bookingStep = Math.max(1,bookingStep-1); renderBookingStep();
}));

async function sendRealEmail(appointment) {
  const cfg = state.emailConfig;
  if (!cfg.enabled || !cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
    return { sent:false, message:"Correo automático no configurado. La confirmación sí quedó guardada en el sistema." };
  }
  const service = getService(appointment.serviceId);
  const staff = getStaff(appointment.staffId);
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        service_id:cfg.serviceId,
        template_id:cfg.templateId,
        user_id:cfg.publicKey,
        template_params:{
          to_email:appointment.email,
          to_name:appointment.client,
          business_name:state.business.name,
          appointment_code:appointment.code,
          service_name:service?.name || "",
          professional_name:staff?.name || "",
          appointment_date:formatDate(appointment.date),
          appointment_time:formatTime(appointment.time),
          business_phone:state.business.phone,
          business_address:state.business.address
        }
      })
    });
    if (!response.ok) throw new Error(await response.text());
    appointment.emailStatus = "Enviado";
    saveState();
    return { sent:true, message:`Correo de confirmación enviado a ${appointment.email}.` };
  } catch (error) {
    appointment.emailStatus = "Error";
    saveState();
    return { sent:false, error:true, message:"La cita fue confirmada, pero el proveedor de correo no pudo enviar el mensaje." };
  }
}
function showBookingSuccess(appointment) {
  lastConfirmedAppointmentId = appointment.id;
  $("#successCode").textContent = appointment.code;
  const service = getService(appointment.serviceId), staff = getStaff(appointment.staffId);
  $("#successDetails").innerHTML = `
    <div class="summary-item"><span>Servicio</span><strong>${escapeHtml(service?.name)}</strong></div>
    <div class="summary-item"><span>Profesional</span><strong>${escapeHtml(staff?.name)}</strong></div>
    <div class="summary-item"><span>Fecha</span><strong>${formatDate(appointment.date)}</strong></div>
    <div class="summary-item"><span>Hora</span><strong>${formatTime(appointment.time)}</strong></div>
    <div class="summary-item"><span>Cliente</span><strong>${escapeHtml(appointment.client)}</strong></div>
    <div class="summary-item"><span>Correo</span><strong>${escapeHtml(appointment.email)}</strong></div>`;
  $("#successEmailStatus").className = "email-status";
  $("#successEmailStatus").textContent = "Procesando confirmación...";
  $("#successAccountBtn").textContent = getClientSession() ? "Ver mis citas" : "Crear cuenta / iniciar sesión";
  setPublicView("bookingSuccess");
}
$("#publicBookingForm").addEventListener("submit", async e => {
  e.preventDefault(); collectBookingInputs();
  const error = validateSlot(bookingDraft.serviceId,bookingDraft.staffId,bookingDraft.date,bookingDraft.time);
  if (error) { showToast(error); bookingStep=2; renderBookingStep(); return; }
  const appointment = {
    id:Date.now(), code:generateCode(), client:bookingDraft.client, phone:bookingDraft.phone,
    email:bookingDraft.email, serviceId:bookingDraft.serviceId, staffId:bookingDraft.staffId,
    date:bookingDraft.date, time:bookingDraft.time, status:"Confirmada", source:"Cliente",
    notes:bookingDraft.notes, reminderStatus:"Programado", emailStatus:"Pendiente"
  };
  state.appointments.push(appointment);
  addAudit(`Cita ${appointment.code} creada desde el portal`, appointment.client);
  saveState();
  renderAll();
  showBookingSuccess(appointment);
  const emailResult = await sendRealEmail(appointment);
  $("#successEmailStatus").className = `email-status ${emailResult.sent?"success":emailResult.error?"error":""}`;
  $("#successEmailStatus").textContent = emailResult.message;
});

function lastAppointment() {
  return state.appointments.find(a => a.id === lastConfirmedAppointmentId);
}
$("#copySuccessCode").addEventListener("click", async () => {
  const a = lastAppointment(); if (!a) return;
  try { await navigator.clipboard.writeText(a.code); showToast("Código copiado"); }
  catch { showToast(`Código: ${a.code}`); }
});
function downloadText(filename,content,type="text/plain") {
  const blob = new Blob([content],{type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href=url; link.download=filename; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}
$("#downloadReceiptBtn").addEventListener("click", () => {
  const a=lastAppointment(); if(!a)return;
  const s=getService(a.serviceId),p=getStaff(a.staffId);
  const text=`CONFIRMACIÓN DE CITA\n\nNegocio: ${state.business.name}\nCódigo: ${a.code}\nCliente: ${a.client}\nServicio: ${s?.name}\nProfesional: ${p?.name}\nFecha: ${formatDate(a.date)}\nHora: ${formatTime(a.time)}\nPrecio: ${currency(s?.price||0)}\nDirección: ${state.business.address}\nTeléfono: ${state.business.phone}\nZona horaria: ${TIME_ZONE}\n`;
  downloadText(`cita-${a.code}.txt`,text);
});
$("#downloadCalendarBtn").addEventListener("click", () => {
  const a=lastAppointment(); if(!a)return;
  const s=getService(a.serviceId),p=getStaff(a.staffId);
  const start = appointmentInstant(a);
  const end = new Date(start.getTime() + (s?.duration||30)*60000);
  const icsDate = d => d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AppointmentSaaS//Demo//ES\r\nBEGIN:VEVENT\r\nUID:${a.code}@appointmentsaas.demo\r\nDTSTAMP:${icsDate(new Date())}\r\nDTSTART:${icsDate(start)}\r\nDTEND:${icsDate(end)}\r\nSUMMARY:${s?.name} en ${state.business.name}\r\nDESCRIPTION:Código ${a.code}. Profesional: ${p?.name}.\r\nLOCATION:${state.business.address}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
  downloadText(`${a.code}.ics`,ics,"text/calendar");
});
$("#prepareEmailBtn").addEventListener("click", () => {
  const a=lastAppointment(); if(!a)return;
  const s=getService(a.serviceId),p=getStaff(a.staffId);
  const subject=encodeURIComponent(`Confirmación de cita ${a.code}`);
  const body=encodeURIComponent(`Hola ${a.client},\n\nTu cita en ${state.business.name} está confirmada.\n\nCódigo: ${a.code}\nServicio: ${s?.name}\nProfesional: ${p?.name}\nFecha: ${formatDate(a.date)}\nHora: ${formatTime(a.time)}\nDirección: ${state.business.address}\n\nGracias.`);
  window.location.href=`mailto:${encodeURIComponent(a.email)}?subject=${subject}&body=${body}`;
});
$("#successAccountBtn").addEventListener("click", () => {
  if (getClientSession()) setPublicView("clientAccount");
  else openClientAuth("login");
});

function lookupCard(a) {
  const s=getService(a.serviceId),p=getStaff(a.staffId);
  const canCancel=!["Cancelada","Completada","No asistió"].includes(a.status) && hoursUntilAppointment(a)>=CANCEL_LIMIT_HOURS;
  return `<div class="lookup-result"><div class="booking-summary">
    <div class="summary-item"><span>Estado</span><strong>${escapeHtml(a.status)}</strong></div>
    <div class="summary-item"><span>Servicio</span><strong>${escapeHtml(s?.name||"—")}</strong></div>
    <div class="summary-item"><span>Profesional</span><strong>${escapeHtml(p?.name||"—")}</strong></div>
    <div class="summary-item"><span>Fecha y hora</span><strong>${formatDate(a.date)} · ${formatTime(a.time)}</strong></div>
  </div>
  ${canCancel?`<button class="btn btn-soft btn-block" style="margin-top:14px;color:var(--danger)" data-public-cancel="${a.id}">Cancelar cita</button>`:""}
  ${!canCancel && !["Cancelada","Completada","No asistió"].includes(a.status)?`<p class="notice">La cancelación en línea solo está disponible hasta ${CANCEL_LIMIT_HOURS} horas antes.</p>`:""}
  </div>`;
}
$("#lookupForm").addEventListener("submit", e => {
  e.preventDefault();
  const code=$("#lookupCode").value.trim().toUpperCase();
  const a=state.appointments.find(x=>x.code.toUpperCase()===code);
  $("#lookupResult").innerHTML=a?lookupCard(a):`<div class="empty-state">No encontramos una cita con ese código.</div>`;
});
$("#lookupResult").addEventListener("click", e => {
  const b=e.target.closest("[data-public-cancel]"); if(!b)return;
  const a=state.appointments.find(x=>x.id===Number(b.dataset.publicCancel));
  if (!a || hoursUntilAppointment(a)<CANCEL_LIMIT_HOURS) { showToast("La cita ya no puede cancelarse en línea"); return; }
  a.status="Cancelada";a.reminderStatus="Cancelado";
  addAudit(`Cita ${a.code} cancelada por el cliente`,a.client);
  saveState();$("#lookupResult").innerHTML=lookupCard(a);renderAll();showToast("Cita cancelada");
});

function openClientAuth(tab="login") {
  $("#clientAuthModal").classList.remove("hidden");
  switchAuthTab(tab);
}
function closeClientAuth() { $("#clientAuthModal").classList.add("hidden"); }
$("#openClientAuth").addEventListener("click", () => {
  if (getClientSession()) setPublicView("clientAccount");
  else openClientAuth("login");
});
$$("[data-close-client-modal]").forEach(x=>x.addEventListener("click",closeClientAuth));
function switchAuthTab(tab) {
  $$("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===tab));
  $("#clientLoginForm").classList.toggle("hidden",tab!=="login");
  $("#clientRegisterForm").classList.toggle("hidden",tab!=="register");
}
$$("[data-auth-tab]").forEach(b=>b.addEventListener("click",()=>switchAuthTab(b.dataset.authTab)));
$("#clientLoginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#clientLoginEmail").value.trim().toLowerCase();
  const password=$("#clientLoginPassword").value;
  const account=state.clientAccounts.find(c=>c.email.toLowerCase()===email && c.password===password);
  if(!account){showToast("Correo o contraseña incorrectos");return;}
  setClientSession({id:account.id,name:account.name,phone:account.phone,email:account.email});
  addAudit("Inicio de sesión del cliente",account.name);
  closeClientAuth();renderAll();setPublicView("clientAccount");showToast("Sesión iniciada");
});
$("#clientRegisterForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#clientRegisterEmail").value.trim().toLowerCase();
  if(state.clientAccounts.some(c=>c.email.toLowerCase()===email)){showToast("Ya existe una cuenta con ese correo");return;}
  const account={id:Date.now(),name:$("#clientRegisterName").value.trim(),phone:$("#clientRegisterPhone").value.trim(),email,password:$("#clientRegisterPassword").value};
  state.clientAccounts.push(account);saveState();
  setClientSession({id:account.id,name:account.name,phone:account.phone,email:account.email});
  addAudit("Cuenta de cliente creada",account.name);
  closeClientAuth();renderAll();setPublicView("clientAccount");showToast("Cuenta creada");
});
$("#clientLogoutBtn").addEventListener("click",()=>{
  const c=getClientSession();if(c)addAudit("Cierre de sesión del cliente",c.name);
  clearClientSession();renderAll();setPublicView("home");
});
function clientAppointmentCard(a) {
  const s=getService(a.serviceId),p=getStaff(a.staffId);
  const canCancel=!["Cancelada","Completada","No asistió"].includes(a.status) && hoursUntilAppointment(a)>=CANCEL_LIMIT_HOURS;
  return `<article class="client-appointment-card">
    <div class="client-appointment-top"><div><h3>${escapeHtml(s?.name||"Servicio")}</h3><p>${formatDate(a.date)} · ${formatTime(a.time)} · ${escapeHtml(p?.name||"Sin asignar")}</p></div><span class="status status-${a.status.toLowerCase().replace(" ","-")}">${a.status}</span></div>
    <div class="client-appointment-meta"><span>Código: <strong>${a.code}</strong></span><span>${currency(s?.price||0)}</span><span>${a.reminderStatus}</span></div>
    <div class="client-appointment-actions"><button class="mini-btn" data-client-copy="${a.code}">Copiar código</button>${canCancel?`<button class="mini-btn danger" data-client-cancel="${a.id}">Cancelar</button>`:""}</div>
  </article>`;
}
function renderClientAccount() {
  const c=getClientSession();
  if(!c){openClientAuth("login");setPublicView("home");return;}
  $("#clientWelcomeTitle").textContent=`Hola, ${c.name.split(" ")[0]}`;
  $("#clientProfileAvatar").textContent=c.name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  $("#clientProfileName").textContent=c.name;$("#clientProfileEmail").textContent=c.email;$("#clientProfilePhone").textContent=c.phone;
  const list=sortAppointments(state.appointments.filter(a=>a.email.toLowerCase()===c.email.toLowerCase()));
  const upcoming=list.filter(a=>["Pendiente","Confirmada"].includes(a.status) && appointmentInstant(a)>new Date());
  const history=list.filter(a=>!upcoming.includes(a)).reverse();
  $("#clientUpcomingCount").textContent=upcoming.length;
  $("#clientUpcomingAppointments").innerHTML=upcoming.map(clientAppointmentCard).join("")||`<div class="empty-state">No tienes próximas citas.</div>`;
  $("#clientAppointmentHistory").innerHTML=history.map(clientAppointmentCard).join("")||`<div class="empty-state">Todavía no tienes historial.</div>`;
}
$("#clientAccountPublicView").addEventListener("click",async e=>{
  const copy=e.target.closest("[data-client-copy]");
  if(copy){try{await navigator.clipboard.writeText(copy.dataset.clientCopy);showToast("Código copiado");}catch{showToast(copy.dataset.clientCopy);}return;}
  const cancel=e.target.closest("[data-client-cancel]");
  if(cancel){
    const a=state.appointments.find(x=>x.id===Number(cancel.dataset.clientCancel));
    if(!a||hoursUntilAppointment(a)<CANCEL_LIMIT_HOURS){showToast("La cita ya no puede cancelarse en línea");return;}
    a.status="Cancelada";a.reminderStatus="Cancelado";addAudit(`Cita ${a.code} cancelada desde Mi cuenta`,a.client);saveState();renderAll();renderClientAccount();showToast("Cita cancelada");
  }
});

function openBusinessLogin(){ $("#businessLoginModal").classList.remove("hidden"); }
function closeBusinessLogin(){ $("#businessLoginModal").classList.add("hidden"); }
$("#openBusinessLogin").addEventListener("click",openBusinessLogin);
$("#footerBusinessLogin").addEventListener("click",openBusinessLogin);
$$("[data-close-modal]").forEach(x=>x.addEventListener("click",closeBusinessLogin));
$("#businessLoginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#businessEmail").value.trim().toLowerCase(),password=$("#businessPassword").value;
  let session=null;
  if(email==="demo@appointmentsaas.com"&&password==="Demo123!")session={role:"admin",name:"Anibelka Santana"};
  if(email==="empleado@appointmentsaas.com"&&password==="Empleado123!")session={role:"employee",name:"Carlos Méndez",staffId:1};
  if(!session){showToast("Credenciales incorrectas");return;}
  setBusinessSession(session);addAudit("Inicio de sesión",session.name);closeBusinessLogin();showBusinessPortal();showToast("Sesión iniciada");
});
function showBusinessPortal(){
  $("#publicPortal").classList.add("hidden");$("#businessPortal").classList.remove("hidden");currentBusinessView="dashboard";applyRoleUI();switchBusinessView("dashboard");renderAll();window.scrollTo(0,0);
}
function showPublicPortal(){
  $("#businessPortal").classList.add("hidden");$("#publicPortal").classList.remove("hidden");setPublicView("home");
}
$("#exitBusinessPortal").addEventListener("click",()=>{
  const s=getBusinessSession();if(s)addAudit("Cierre de sesión",s.name);clearBusinessSession();showPublicPortal();
});
function switchBusinessView(name){
  const titles={dashboard:"Resumen del negocio",appointments:"Gestión de citas",clients:"Clientes",services:"Servicios",staff:"Personal",analytics:"Analítica del negocio",notifications:"Recordatorios",subscription:"Suscripción",audit:"Bitácora",settings:"Configuración"};
  const session=getBusinessSession();
  const adminOnly=["services","staff","analytics","notifications","subscription","audit","settings"];
  if(session?.role==="employee"&&adminOnly.includes(name)){showToast("Este módulo requiere permisos de administrador");return;}
  currentBusinessView=name;
  $$(".business-view").forEach(v=>v.classList.add("hidden"));$("#"+name+"BusinessView").classList.remove("hidden");
  $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.businessView===name));
  $("#businessPageTitle").textContent=titles[name];renderAll();window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-business-view]").forEach(b=>b.addEventListener("click",()=>switchBusinessView(b.dataset.businessView)));

function visibleAppointments(includeCancelled=true){
  const s=getBusinessSession();let list=state.appointments;
  if(s?.role==="employee")list=list.filter(a=>a.staffId===s.staffId);
  return includeCancelled?list:list.filter(a=>a.status!=="Cancelada");
}
function appointmentClients(list=visibleAppointments()){
  const map=new Map();
  list.forEach(a=>{
    const key=a.email||a.phone;
    if(!map.has(key))map.set(key,{name:a.client,phone:a.phone,email:a.email,visits:0,revenue:0,lastDate:a.date});
    const c=map.get(key);
    if(!["Cancelada","No asistió"].includes(a.status)){c.visits++;c.revenue+=priceOf(a);}
    if(a.date>c.lastDate)c.lastDate=a.date;
  });
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
function serviceStats(list=state.appointments){
  return state.services.map(s=>{const apps=list.filter(a=>a.serviceId===s.id&&!["Cancelada","No asistió"].includes(a.status));return{name:s.name,count:apps.length,revenue:apps.reduce((sum,a)=>sum+s.price,0)};}).sort((a,b)=>b.revenue-a.revenue);
}
function hourStats(list=state.appointments){
  const map={};list.filter(a=>!["Cancelada","No asistió"].includes(a.status)).forEach(a=>map[a.time]=(map[a.time]||0)+1);
  return Object.entries(map).map(([time,count])=>({time,count})).sort((a,b)=>b.count-a.count||a.time.localeCompare(b.time));
}
function appointmentRow(a,controls=true){
  const s=getService(a.serviceId),p=getStaff(a.staffId);
  const canChange=controls&&["Pendiente","Confirmada"].includes(a.status);
  return `<div class="appointment-row"><div class="appointment-time">${formatTime(a.time)}</div><div class="appointment-main"><strong>${escapeHtml(a.client)}</strong><span>${escapeHtml(s?.name||"Servicio eliminado")} · ${formatDate(a.date)} · ${escapeHtml(p?.name||"Sin asignar")} · ${escapeHtml(a.source)}</span></div><div class="appointment-actions"><span class="status status-${a.status.toLowerCase().replace(" ","-")}">${a.status}</span>${controls&&a.status==="Pendiente"?`<button class="mini-btn" data-appt-action="confirm" data-id="${a.id}">Confirmar</button>`:""}${canChange?`<button class="mini-btn" data-appt-action="complete" data-id="${a.id}">Completar</button><button class="mini-btn" data-appt-action="noshow" data-id="${a.id}">No asistió</button><button class="mini-btn danger" data-appt-action="cancel" data-id="${a.id}">Cancelar</button>`:""}</div></div>`;
}
function renderPlanUI(){
  const pro=state.subscription.plan==="Pro";
  $("#sidebarPlanLabel").textContent=`PLAN ${state.subscription.plan.toUpperCase()}`;
  $("#sidebarPlanDetail").textContent=pro?"Analítica y recordatorios habilitados":"Agenda, clientes y recordatorios";
  $("#basicPlanCard").classList.toggle("selected",!pro);$("#proPlanCard").classList.toggle("selected",pro);
  $("#analyticsPlanLock").classList.toggle("hidden",pro);$("#analyticsBusinessView").classList.toggle("plan-locked",!pro);
}
function applyRoleUI(){
  const s=getBusinessSession(),admin=s?.role==="admin";
  $$("[data-admin-only]").forEach(el=>el.classList.toggle("role-hidden",!admin));
  $("#sessionUserName").textContent=s?.name||"Invitado";$("#sessionRoleName").textContent=admin?"Administradora":"Empleado · Carlos";$("#sessionAvatar").textContent=admin?"AS":"CM";
  $(".topbar .eyebrow").textContent=admin?"DEMO ADMINISTRATIVO":"PORTAL DEL EMPLEADO";
}
function setDashboardLabels(){
  const employee=getBusinessSession()?.role==="employee";
  $("#metricTodayLabel").textContent=employee?"Mis citas de hoy":"Citas de hoy";$("#metricTodayDetail").textContent=employee?"Asignadas a Carlos":"Reservas no canceladas";
  $("#metricRevenueLabel").textContent=employee?"Citas completadas":"Ingresos estimados";$("#metricRevenueDetail").textContent=employee?"Servicios realizados":"Servicios programados";
  $("#metricClientsLabel").textContent=employee?"Mis clientes":"Clientes únicos";$("#metricClientsDetail").textContent=employee?"Clientes asignados":"Directorio consolidado";
  $("#metricRemindersLabel").textContent=employee?"Pendientes":"Recordatorios";$("#metricRemindersDetail").textContent=employee?"Citas por confirmar":"Enviados o programados";
}
function renderDashboard(){
  setDashboardLabels();const list=visibleAppointments(false),today=list.filter(a=>a.date===zonedToday()),employee=getBusinessSession()?.role==="employee";
  const revenue=list.filter(a=>a.status!=="No asistió").reduce((sum,a)=>sum+priceOf(a),0),completed=list.filter(a=>a.status==="Completada").length,clients=appointmentClients(list).length;
  const reminders=list.filter(a=>["Enviado","Programado"].includes(a.reminderStatus)).length,pending=list.filter(a=>a.status==="Pendiente").length,ss=serviceStats(list),hs=hourStats(list);
  const next=sortAppointments(list.filter(a=>["Pendiente","Confirmada"].includes(a.status)&&appointmentInstant(a)>new Date()))[0];
  const cancelled=visibleAppointments(true).filter(a=>a.status==="Cancelada").length,rate=visibleAppointments(true).length?Math.round(cancelled/visibleAppointments(true).length*100):0;
  $("#metricToday").textContent=today.length;$("#metricRevenue").textContent=employee?completed:currency(revenue);$("#metricClients").textContent=clients;$("#metricReminders").textContent=employee?pending:reminders;
  $("#dashboardAppointments").innerHTML=sortAppointments(list).slice(0,5).map(a=>appointmentRow(a,false)).join("")||`<div class="empty-state">No hay citas activas.</div>`;
  $("#quickPeak").textContent=hs[0]?formatTime(hs[0].time):"—";$("#quickTopService").textContent=ss[0]?.name||"—";$("#quickNextClient").textContent=next?.client||"—";$("#quickCancelRate").textContent=rate+"%";
}
function populateAdminSelects(){
  $("#adminServiceSelect").innerHTML=activeServices().map(s=>`<option value="${s.id}">${escapeHtml(s.name)} · ${currency(s.price)}</option>`).join("");
  $("#adminStaffSelect").innerHTML=activeStaff().map(p=>`<option value="${p.id}">${escapeHtml(p.name)} · ${escapeHtml(p.specialty)}</option>`).join("");
  $("#adminDate").min=zonedToday();if(!$("#adminDate").value)$("#adminDate").value=zonedToday();
  const schedule=scheduleForDate($("#adminDate").value);if(!$("#adminTime").value)$("#adminTime").value=schedule.open?schedule.start:"09:00";
}
function renderAppointments(){
  const q=$("#appointmentSearch").value.trim().toLowerCase(),f=$("#appointmentStatusFilter").value;
  const list=sortAppointments(visibleAppointments(true).filter(a=>(f==="all"||a.status===f)&&(!q||a.client.toLowerCase().includes(q)||a.phone.includes(q))));
  const context=getBusinessSession()?.role==="employee"?`<div class="employee-context">Mostrando únicamente las citas asignadas a Carlos.</div>`:"";
  $("#appointmentsList").innerHTML=context+(list.map(a=>appointmentRow(a,true)).join("")||`<div class="empty-state">No se encontraron citas.</div>`);
}
function renderClients(){
  const q=$("#clientSearch").value.trim().toLowerCase(),list=appointmentClients(visibleAppointments(true)).filter(c=>!q||c.name.toLowerCase().includes(q)||c.phone.includes(q)||c.email.toLowerCase().includes(q));
  $("#clientsTable").innerHTML=`<table><thead><tr><th>Cliente</th><th>Contacto</th><th>Citas</th><th>Ingresos</th><th>Última cita</th></tr></thead><tbody>${list.map(c=>`<tr><td><strong>${escapeHtml(c.name)}</strong></td><td>${escapeHtml(c.phone)}<br><span class="muted">${escapeHtml(c.email)}</span></td><td>${c.visits}</td><td>${currency(c.revenue)}</td><td>${formatDate(c.lastDate)}</td></tr>`).join("")||`<tr><td colspan="5">Sin resultados.</td></tr>`}</tbody></table>`;
}
function renderServices(){
  $("#servicesAdminList").innerHTML=state.services.map(s=>`<div class="admin-service-row"><div><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(s.description)} · ${s.duration} min · ${s.active?"Activo":"Inactivo"}</span></div><div class="appointment-actions"><span class="price-tag">${currency(s.price)}</span><button class="mini-btn" data-service-toggle="${s.id}">${s.active?"Desactivar":"Activar"}</button></div></div>`).join("");
}
function renderStaff(){
  $("#staffAdminList").innerHTML=state.staff.map(p=>`<div class="staff-admin-card"><div class="staff-avatar">${escapeHtml(p.name.slice(0,2).toUpperCase())}</div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.specialty)}</span><span>${escapeHtml(p.schedule)}</span><button class="mini-btn" style="margin-top:10px" data-staff-toggle="${p.id}">${p.active?"Desactivar":"Activar"}</button></div>`).join("");
}
function renderAnalytics(){
  const list=state.appointments,ss=serviceStats(list),hs=hourStats(list),revenue=list.filter(a=>!["Cancelada","No asistió"].includes(a.status)).reduce((sum,a)=>sum+priceOf(a),0),top=ss[0];
  const completed=list.filter(a=>a.status==="Completada").length,noShows=list.filter(a=>a.status==="No asistió").length,finalized=completed+noShows,noShowRate=finalized?Math.round(noShows/finalized*100):0;
  const clients=appointmentClients(list),repeat=clients.filter(c=>c.visits>1).length,newClients=clients.filter(c=>c.visits===1).length,returnRate=clients.length?Math.round(repeat/clients.length*100):0;
  $("#analyticsPeak").textContent=hs[0]?formatTime(hs[0].time):"—";$("#analyticsTopService").textContent=top?.name||"—";$("#analyticsTopServiceDetail").textContent=top?top.count+" reservas":"Sin datos";$("#analyticsRevenue").textContent=currency(revenue);
  $("#analyticsNoShowRate").textContent=noShowRate+"%";$("#analyticsRepeatClients").textContent=repeat;$("#analyticsRepeatDetail").textContent=returnRate+"% de retorno";$("#analyticsNewClients").textContent=newClients;$("#analyticsCompleted").textContent=completed;$("#analyticsNoShows").textContent=noShows;
  const max=Math.max(...ss.map(x=>x.revenue),1);$("#serviceBars").innerHTML=ss.map(x=>`<div class="bar-row"><strong>${escapeHtml(x.name)}</strong><div class="bar-track"><div class="bar-fill" style="width:${Math.round(x.revenue/max*100)}%"></div></div><div class="bar-value">${currency(x.revenue)}</div></div>`).join("");
  $("#hourCards").innerHTML=hs.slice(0,4).map(x=>`<div class="hour-card"><strong>${formatTime(x.time)}</strong><span>${x.count} cita${x.count===1?"":"s"}</span></div>`).join("")||`<div class="empty-state">Sin datos.</div>`;
  const most=ss.slice().sort((a,b)=>b.count-a.count)[0],peak=hs[0];$("#recommendations").innerHTML=`<div class="recommendation"><strong>Disponibilidad</strong><p>${peak?`La mayor demanda se concentra alrededor de las ${formatTime(peak.time)}.`:"Registra más citas."}</p></div><div class="recommendation"><strong>Promoción</strong><p>${most?`${most.name} es el servicio más solicitado.`:"Aún no hay datos."}</p></div><div class="recommendation"><strong>Retención</strong><p>${repeat?`${repeat} clientes han reservado más de una vez.`:"Todavía no se identifican clientes recurrentes."}</p></div>`;
}
function renderNotifications(){
  const list=sortAppointments(state.appointments).filter(a=>a.status!=="Cancelada");
  $("#notificationsList").innerHTML=list.map(a=>`<div class="notification-row"><div><strong>${escapeHtml(a.client)} · ${escapeHtml(getService(a.serviceId)?.name||"Servicio")}</strong><span>${formatDate(a.date)} · ${formatTime(a.time)} · ${escapeHtml(a.email)}</span></div><span class="status status-${a.reminderStatus==="Enviado"?"confirmada":"pendiente"}">${a.reminderStatus}</span></div>`).join("")||`<div class="empty-state">No hay recordatorios.</div>`;
  $("#settingImmediate").checked=state.notificationSettings.immediate;$("#setting24h").checked=state.notificationSettings.h24;$("#setting2h").checked=state.notificationSettings.h2;
}
function renderAudit(){
  $("#auditList").innerHTML=state.audit.map(e=>`<div class="audit-row"><time>${new Intl.DateTimeFormat("es-DO",{timeZone:TIME_ZONE,day:"2-digit",month:"short",hour:"numeric",minute:"2-digit"}).format(new Date(e.at))}</time><strong>${escapeHtml(e.action)}</strong><span>${escapeHtml(e.actor)}</span></div>`).join("")||`<div class="empty-state">La bitácora está vacía.</div>`;
}
function renderWeeklySchedule(){
  $("#weeklyScheduleEditor").innerHTML=DAY_NAMES.map((name,index)=>{
    const s=state.business.schedule[index];
    return `<div class="schedule-row ${s.open?"":"closed-day"}" data-schedule-day="${index}">
      <label class="day-toggle"><input type="checkbox" data-day-open="${index}" ${s.open?"checked":""}/><span>${name}</span></label>
      <span>${s.open?"Abierto":"Cerrado"}</span>
      <input type="time" data-day-start="${index}" value="${s.start}" ${s.open?"":"disabled"}/>
      <span class="schedule-separator">a</span>
      <input type="time" data-day-end="${index}" value="${s.end}" ${s.open?"":"disabled"}/>
    </div>`;
  }).join("");
}
function renderClosures(){
  $("#closureDate").min=zonedToday();
  $("#closuresList").innerHTML=state.business.closures.length?state.business.closures.sort((a,b)=>a.date.localeCompare(b.date)).map(c=>`<div class="closure-row"><div><strong>${formatDate(c.date)}</strong><span>${escapeHtml(c.reason)}</span></div><button class="mini-btn danger" data-remove-closure="${c.date}">Eliminar</button></div>`).join(""):`<div class="empty-state">No hay cierres especiales configurados.</div>`;
}
function renderEmailSettings(){
  $("#emailEnabledSetting").checked=state.emailConfig.enabled;$("#emailServiceIdSetting").value=state.emailConfig.serviceId;$("#emailTemplateIdSetting").value=state.emailConfig.templateId;$("#emailPublicKeySetting").value=state.emailConfig.publicKey;
}
function renderAll(){
  renderBusinessIdentity();renderPublicHome();renderPlanUI();applyRoleUI();populateAdminSelects();renderDashboard();renderAppointments();renderClients();renderServices();renderStaff();renderAnalytics();renderNotifications();renderAudit();renderWeeklySchedule();renderClosures();renderEmailSettings();renderClientHeader();
}

$("#adminAppointmentForm").addEventListener("submit",e=>{
  e.preventDefault();
  const serviceId=Number($("#adminServiceSelect").value),staffId=Number($("#adminStaffSelect").value),date=$("#adminDate").value,time=$("#adminTime").value;
  const error=validateSlot(serviceId,staffId,date,time);if(error){showToast(error);return;}
  const a={id:Date.now(),code:generateCode(),client:$("#adminClientName").value.trim(),phone:$("#adminClientPhone").value.trim(),email:$("#adminClientEmail").value.trim().toLowerCase(),serviceId,staffId,date,time,status:"Pendiente",source:"Negocio",notes:"",reminderStatus:"Programado",emailStatus:"Pendiente"};
  state.appointments.push(a);addAudit(`Cita ${a.code} creada manualmente`);saveState();e.target.reset();populateAdminSelects();renderAll();showToast("Cita agregada");
});
$("#adminDate").addEventListener("change",()=>{const s=scheduleForDate($("#adminDate").value);if(s.open)$("#adminTime").value=s.start;});
$("#appointmentsList").addEventListener("click",e=>{
  const b=e.target.closest("[data-appt-action]");if(!b)return;const a=state.appointments.find(x=>x.id===Number(b.dataset.id));if(!a)return;
  if(getBusinessSession()?.role==="employee"&&a.staffId!==getBusinessSession().staffId){showToast("Sin permiso");return;}
  if(b.dataset.apptAction==="confirm")a.status="Confirmada";
  if(b.dataset.apptAction==="complete")a.status="Completada";
  if(b.dataset.apptAction==="noshow")a.status="No asistió";
  if(b.dataset.apptAction==="cancel"){a.status="Cancelada";a.reminderStatus="Cancelado";}
  addAudit(`Cita ${a.code} actualizada a "${a.status}"`);saveState();renderAll();showToast("Estado actualizado");
});
$("#appointmentSearch").addEventListener("input",renderAppointments);$("#appointmentStatusFilter").addEventListener("change",renderAppointments);$("#clientSearch").addEventListener("input",renderClients);
$("#serviceForm").addEventListener("submit",e=>{e.preventDefault();const s={id:Date.now(),name:$("#serviceName").value.trim(),price:Number($("#servicePrice").value),duration:Number($("#serviceDuration").value),description:$("#serviceDescription").value.trim(),active:true};state.services.push(s);addAudit(`Servicio "${s.name}" agregado`);saveState();e.target.reset();renderAll();showToast("Servicio agregado");});
$("#servicesAdminList").addEventListener("click",e=>{const b=e.target.closest("[data-service-toggle]");if(!b)return;const s=state.services.find(x=>x.id===Number(b.dataset.serviceToggle));s.active=!s.active;addAudit(`Servicio "${s.name}" ${s.active?"activado":"desactivado"}`);saveState();renderAll();});
$("#staffForm").addEventListener("submit",e=>{e.preventDefault();const p={id:Date.now(),name:$("#staffName").value.trim(),specialty:$("#staffSpecialty").value.trim(),schedule:$("#staffSchedule").value.trim(),active:true};state.staff.push(p);addAudit(`Profesional "${p.name}" agregado`);saveState();e.target.reset();renderAll();});
$("#staffAdminList").addEventListener("click",e=>{const b=e.target.closest("[data-staff-toggle]");if(!b)return;const p=state.staff.find(x=>x.id===Number(b.dataset.staffToggle));p.active=!p.active;addAudit(`Profesional "${p.name}" ${p.active?"activado":"desactivado"}`);saveState();renderAll();});
$$("[data-plan-select]").forEach(b=>b.addEventListener("click",()=>{state.subscription.plan=b.dataset.planSelect;addAudit(`Plan cambiado a ${state.subscription.plan}`);saveState();renderAll();}));
$("#settingImmediate").addEventListener("change",e=>{state.notificationSettings.immediate=e.target.checked;saveState();});
$("#setting24h").addEventListener("change",e=>{state.notificationSettings.h24=e.target.checked;saveState();});
$("#setting2h").addEventListener("change",e=>{state.notificationSettings.h2=e.target.checked;saveState();});
$("#businessSettingsForm").addEventListener("submit",e=>{e.preventDefault();state.business.name=$("#businessNameSetting").value.trim();state.business.phone=$("#businessPhoneSetting").value.trim();state.business.address=$("#businessAddressSetting").value.trim();addAudit("Perfil del negocio actualizado");saveState();renderAll();showToast("Perfil actualizado");});
$("#emailSettingsForm").addEventListener("submit",e=>{e.preventDefault();state.emailConfig.enabled=$("#emailEnabledSetting").checked;state.emailConfig.serviceId=$("#emailServiceIdSetting").value.trim();state.emailConfig.templateId=$("#emailTemplateIdSetting").value.trim();state.emailConfig.publicKey=$("#emailPublicKeySetting").value.trim();addAudit("Configuración de correo actualizada");saveState();renderAll();showToast("Configuración de correo guardada");});
$("#weeklyScheduleEditor").addEventListener("change",e=>{
  const row = e.target.closest("[data-schedule-day]");
  if (!row) return;
  const i = Number(row.dataset.scheduleDay);
  const open = row.querySelector(`[data-day-open="${i}"]`).checked;
  const start = row.querySelector(`[data-day-start="${i}"]`).value;
  const end = row.querySelector(`[data-day-end="${i}"]`).value;
  state.business.schedule[i] = { open, start, end };
  renderWeeklySchedule();
});
$("#weeklyScheduleForm").addEventListener("submit",e=>{
  e.preventDefault();
  for(let i=0;i<7;i++){
    const open=$(`[data-day-open="${i}"]`).checked,start=$(`[data-day-start="${i}"]`).value,end=$(`[data-day-end="${i}"]`).value;
    if(open&&(!start||!end||toMinutes(start)>=toMinutes(end))){showToast(`Revisa el horario de ${DAY_NAMES[i]}`);return;}
    state.business.schedule[i]={open,start,end};
  }
  addAudit("Horario semanal del local actualizado");saveState();renderAll();showToast("Horario guardado");
});
$("#closureForm").addEventListener("submit",e=>{
  e.preventDefault();const date=$("#closureDate").value,reason=$("#closureReason").value.trim();
  if(date<zonedToday()){showToast("No puedes agregar un cierre en el pasado");return;}
  const existing=state.business.closures.find(c=>c.date===date);if(existing)existing.reason=reason;else state.business.closures.push({date,reason});
  addAudit(`Cierre especial configurado para ${date}`);saveState();e.target.reset();renderAll();showToast("Cierre agregado");
});
$("#closuresList").addEventListener("click",e=>{const b=e.target.closest("[data-remove-closure]");if(!b)return;state.business.closures=state.business.closures.filter(c=>c.date!==b.dataset.removeClosure);addAudit(`Cierre especial eliminado: ${b.dataset.removeClosure}`);saveState();renderAll();});
$("#clearAuditBtn").addEventListener("click",()=>{state.audit=[];saveState();renderAudit();});
$("#resetDemoBtn").addEventListener("click",()=>{state=createInitialState();saveState();clearClientSession();renderAll();showToast("Demo restablecido");});

renderAll();
if(getBusinessSession())showBusinessPortal();else setPublicView("home");
