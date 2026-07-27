import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const resendFrom = Deno.env.get("RESEND_FROM") ?? "AppointmentSaaS <onboarding@resend.dev>";
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) {
      throw new Error("Faltan secretos requeridos para la función de correo.");
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const appointmentId = Number(body.appointment_id);
    if (!Number.isFinite(appointmentId)) {
      return new Response(JSON.stringify({ error: "appointment_id es obligatorio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: appointment, error: appointmentError } = await adminClient
      .from("appointments")
      .select(`
        id, business_id, client_id, client_name, client_email, client_phone,
        confirmation_code, local_date, local_time, starts_at, status,
        services(name, price, duration_minutes),
        staff(id, name),
        businesses(name, phone, address, timezone)
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return new Response(JSON.stringify({ error: "Cita no encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, business_id, staff_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    const isOwner = appointment.client_id === userData.user.id;
    const isAdmin = profile?.role === "admin" && profile.business_id === appointment.business_id;
    const isAssignedEmployee = profile?.role === "employee" && Number(profile.staff_id) === Number(appointment.staff?.id);

    if (!isOwner && !isAdmin && !isAssignedEmployee) {
      return new Response(JSON.stringify({ error: "No tienes permiso para enviar este correo." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const business = appointment.businesses;
    const service = appointment.services;
    const staff = appointment.staff;
    const lookupUrl = publicSiteUrl
      ? `${publicSiteUrl.replace(/\/$/, "")}/?appointment=${encodeURIComponent(appointment.confirmation_code)}`
      : "";

    const subject = `Cita confirmada - ${appointment.confirmation_code}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#16213b">
        <div style="background:#0f1b3d;color:white;padding:28px;border-radius:16px 16px 0 0">
          <div style="font-size:12px;letter-spacing:.12em;color:#9fc0ff;font-weight:700">APPOINTMENTSAAS</div>
          <h1 style="margin:8px 0 0;font-size:28px">Tu cita está confirmada</h1>
        </div>
        <div style="border:1px solid #dfe5ef;border-top:0;padding:28px;border-radius:0 0 16px 16px">
          <p>Hola <strong>${escapeHtml(appointment.client_name)}</strong>,</p>
          <p>Tu reserva en <strong>${escapeHtml(business?.name)}</strong> fue registrada correctamente.</p>
          <table style="width:100%;border-collapse:collapse;margin:22px 0">
            <tr><td style="padding:10px;background:#f5f7fb">Código</td><td style="padding:10px;font-weight:700">${escapeHtml(appointment.confirmation_code)}</td></tr>
            <tr><td style="padding:10px;background:#f5f7fb">Servicio</td><td style="padding:10px">${escapeHtml(service?.name)}</td></tr>
            <tr><td style="padding:10px;background:#f5f7fb">Profesional</td><td style="padding:10px">${escapeHtml(staff?.name)}</td></tr>
            <tr><td style="padding:10px;background:#f5f7fb">Fecha</td><td style="padding:10px">${escapeHtml(appointment.local_date)}</td></tr>
            <tr><td style="padding:10px;background:#f5f7fb">Hora</td><td style="padding:10px">${escapeHtml(String(appointment.local_time).slice(0,5))}</td></tr>
            <tr><td style="padding:10px;background:#f5f7fb">Precio</td><td style="padding:10px">RD$ ${Number(service?.price ?? 0).toLocaleString("es-DO")}</td></tr>
          </table>
          <p><strong>Dirección:</strong> ${escapeHtml(business?.address)}</p>
          <p><strong>Teléfono:</strong> ${escapeHtml(business?.phone)}</p>
          ${lookupUrl ? `<p style="margin-top:26px"><a href="${escapeHtml(lookupUrl)}" style="background:#2f6fe4;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;display:inline-block">Consultar mi cita</a></p>` : ""}
          <p style="margin-top:28px;color:#6d7890;font-size:12px">Conserva el código de confirmación. La cancelación en línea está disponible hasta 2 horas antes de la cita.</p>
        </div>
      </div>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `appointment-${appointment.id}`,
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [appointment.client_email],
        subject,
        html,
      }),
    });

    const resendPayload = await resendResponse.json();
    if (!resendResponse.ok) {
      await adminClient.from("appointments").update({ email_status: "Error" }).eq("id", appointment.id);
      return new Response(JSON.stringify({ error: "Resend rechazó el mensaje.", details: resendPayload }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await adminClient
      .from("appointments")
      .update({ email_status: "Enviado", email_sent_at: new Date().toISOString() })
      .eq("id", appointment.id);

    await adminClient.from("audit_logs").insert({
      business_id: appointment.business_id,
      actor_id: userData.user.id,
      actor_name: profile?.role === "client" ? appointment.client_name : "Usuario autorizado",
      action: `Correo de confirmación enviado para ${appointment.confirmation_code}`,
    });

    return new Response(JSON.stringify({ id: resendPayload.id, sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
