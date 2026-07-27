/* global supabase */

const Cloud = {
  enabled: false,
  client: null,
  config: null,
  profile: null,
  business: null,
  channel: null,
  channelUserId: null,

  async init() {
    try {
      let config = window.APP_CONFIG || null;
      if (!config) {
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (response.ok) config = await response.json();
      }
      if (!config?.cloudEnabled || !config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
        this.enabled = false;
        return false;
      }
      this.config = config;
      this.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      this.enabled = true;
      await this.refreshProfile();
      return true;
    } catch (error) {
      console.warn('Cloud mode unavailable; using local demo mode.', error);
      this.enabled = false;
      return false;
    }
  },

  async refreshProfile() {
    if (!this.enabled) return null;
    const { data: { session } } = await this.client.auth.getSession();
    if (!session?.user) {
      this.profile = null;
      return null;
    }
    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, phone, role, business_id, staff_id')
      .eq('id', session.user.id)
      .single();
    if (error) throw error;
    this.profile = {
      id: data.id,
      name: data.full_name || session.user.email.split('@')[0],
      phone: data.phone || '',
      email: session.user.email,
      role: data.role,
      businessId: data.business_id,
      staffId: data.staff_id ? Number(data.staff_id) : null,
    };
    return this.profile;
  },

  async loadState(fallbackState) {
    if (!this.enabled) return fallbackState;
    await this.refreshProfile();

    const slug = this.config.businessSlug || 'barberia-caribe';
    const { data: business, error: businessError } = await this.client
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single();
    if (businessError) throw businessError;
    this.business = business;

    const [servicesResult, staffResult, hoursResult, closuresResult, appointmentsResult, clientsResult, auditResult] = await Promise.all([
      this.client.from('services').select('*').eq('business_id', business.id).order('id'),
      this.client.from('staff').select('*').eq('business_id', business.id).order('id'),
      this.client.from('business_hours').select('*').eq('business_id', business.id).order('day_of_week'),
      this.client.from('business_closures').select('*').eq('business_id', business.id).order('closure_date'),
      this.client.from('appointments').select('*').eq('business_id', business.id).order('starts_at'),
      this.profile?.role === 'admin'
        ? this.client.from('clients').select('*').eq('business_id', business.id).eq('active', true).order('full_name')
        : Promise.resolve({ data: [], error: null }),
      this.profile?.role === 'admin'
        ? this.client.from('audit_logs').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(80)
        : Promise.resolve({ data: [], error: null }),
    ]);

    for (const result of [servicesResult, staffResult, hoursResult, closuresResult, appointmentsResult, clientsResult, auditResult]) {
      if (result.error) throw result.error;
    }

    const schedule = {};
    for (let day = 0; day <= 6; day += 1) {
      const row = hoursResult.data.find(item => Number(item.day_of_week) === day);
      schedule[day] = row
        ? { open: row.is_open, start: String(row.opening_time).slice(0, 5), end: String(row.closing_time).slice(0, 5) }
        : { open: false, start: '09:00', end: '17:00' };
    }

    return {
      business: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        phone: business.phone || '',
        address: business.address || '',
        timezone: business.timezone || 'America/Santo_Domingo',
        brandColor: business.brand_primary_color || '#2f6fe4',
        brandLogoText: business.brand_logo_text || 'BC',
        bookingMessage: business.booking_message || 'Reserva tu cita sin llamadas ni mensajes.',
        schedule,
        closures: closuresResult.data.map(row => ({
          id: Number(row.id),
          date: row.closure_date,
          reason: row.reason,
        })),
      },
      emailConfig: { enabled: true, provider: 'Supabase Edge Function + Resend' },
      subscription: { plan: business.subscription_plan, trialDays: business.trial_days },
      notificationSettings: {
        immediate: business.notification_immediate,
        h24: business.notification_24h,
        h2: business.notification_2h,
      },
      clientAccounts: [],
      clients: clientsResult.data.map(row => ({
        id: Number(row.id),
        profileId: row.profile_id,
        name: row.full_name,
        phone: row.phone || '',
        email: row.email,
        registered: Boolean(row.profile_id),
        active: row.active,
      })),
      services: servicesResult.data.map(row => ({
        id: Number(row.id),
        name: row.name,
        price: Number(row.price),
        duration: Number(row.duration_minutes),
        description: row.description || '',
        active: row.active,
      })),
      staff: staffResult.data.map(row => ({
        id: Number(row.id),
        userId: row.user_id,
        name: row.name,
        specialty: row.specialty || '',
        schedule: row.schedule_label || '',
        active: row.active,
      })),
      appointments: appointmentsResult.data.map(row => this.mapAppointment(row)),
      audit: auditResult.data.map(row => ({
        id: Number(row.id),
        at: row.created_at,
        action: row.action,
        actor: row.actor_name,
      })),
    };
  },

  mapAppointment(row) {
    return {
      id: Number(row.id),
      code: row.confirmation_code,
      clientId: row.client_id,
      clientRecordId: row.client_record_id ? Number(row.client_record_id) : null,
      client: row.client_name,
      phone: row.client_phone,
      email: row.client_email,
      serviceId: Number(row.service_id),
      staffId: Number(row.staff_id),
      date: row.local_date,
      time: String(row.local_time).slice(0, 5),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      source: row.source,
      notes: row.notes || '',
      reminderStatus: row.reminder_status,
      emailStatus: row.email_status,
    };
  },

  async signIn(email, password) {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return this.refreshProfile();
  },

  async signUpClient({ name, phone, email, password }) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    });
    if (error) throw error;
    if (data.session) await this.refreshProfile();
    return { sessionCreated: Boolean(data.session), user: data.user };
  },

  async signOut() {
    if (!this.enabled) return;
    await this.client.auth.signOut();
    this.profile = null;
  },

  async bookAppointment(draft) {
    const startsAt = new Date(`${draft.date}T${draft.time}:00-04:00`).toISOString();
    const { data, error } = await this.client.rpc('book_appointment', {
      p_business_slug: this.config.businessSlug || 'barberia-caribe',
      p_service_id: draft.serviceId,
      p_staff_id: draft.staffId,
      p_starts_at: startsAt,
      p_notes: draft.notes || '',
    });
    if (error) throw error;
    return this.mapAppointment(data);
  },

  async createAdminAppointment(payload) {
    const startsAt = new Date(`${payload.date}T${payload.time}:00-04:00`).toISOString();
    const { data, error } = await this.client.rpc('admin_create_appointment', {
      p_service_id: payload.serviceId,
      p_staff_id: payload.staffId,
      p_starts_at: startsAt,
      p_client_name: payload.client,
      p_client_phone: payload.phone,
      p_client_email: payload.email,
      p_notes: payload.notes || '',
    });
    if (error) throw error;
    return this.mapAppointment(data);
  },

  async createHistoricalAppointment(payload) {
    const startsAt = new Date(`${payload.date}T${payload.time}:00-04:00`).toISOString();
    const { data, error } = await this.client.rpc('admin_create_historical_appointment', {
      p_service_id: payload.serviceId, p_staff_id: payload.staffId, p_starts_at: startsAt,
      p_client_name: payload.client, p_client_phone: payload.phone, p_client_email: payload.email,
      p_status: payload.status, p_source: payload.source, p_notes: payload.notes || '',
    });
    if (error) throw error;
    return this.mapAppointment(data);
  },

  async setAppointmentStatus(id, status) {
    const { data, error } = await this.client.rpc('set_appointment_status', {
      p_appointment_id: id,
      p_status: status,
    });
    if (error) throw error;
    return this.mapAppointment(data);
  },

  async cancelMyAppointment(id) {
    const { data, error } = await this.client.rpc('cancel_my_appointment', {
      p_appointment_id: id,
    });
    if (error) throw error;
    return this.mapAppointment(data);
  },

  async lookupByCode(code) {
    const { data, error } = await this.client.rpc('lookup_appointment_by_code', { p_code: code });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      id: Number(row.id),
      code: row.confirmation_code,
      status: row.status,
      date: row.local_date,
      time: String(row.local_time).slice(0, 5),
      startsAt: row.starts_at,
      serviceId: Number(row.service_id),
      staffId: Number(row.staff_id),
      lookupServiceName: row.service_name,
      lookupStaffName: row.staff_name,
      lookupBusinessName: row.business_name,
      lookupBusinessPhone: row.business_phone,
      lookupBusinessAddress: row.business_address,
    };
  },

  async sendAppointmentEmail(appointmentId, messageType = 'confirmation') {
    const { data, error } = await this.client.functions.invoke('send-appointment-email', {
      body: { appointment_id: appointmentId, message_type: messageType },
    });
    if (error) throw error;
    return data;
  },

  async logAudit(action) {
    if (!this.enabled || !this.profile) return;
    await this.client.rpc('log_client_event', { p_action: action });
  },

  async syncAdminState(state) {
    if (!this.enabled || this.profile?.role !== 'admin' || !this.business) return;
    const businessId = this.business.id;

    const { error: businessError } = await this.client.from('businesses').update({
      name: state.business.name,
      phone: state.business.phone,
      address: state.business.address,
      subscription_plan: state.subscription.plan,
      trial_days: state.subscription.trialDays,
      notification_immediate: state.notificationSettings.immediate,
      notification_24h: state.notificationSettings.h24,
      notification_2h: state.notificationSettings.h2,
      brand_primary_color: state.business.brandColor || '#2f6fe4',
      brand_logo_text: state.business.brandLogoText || 'BC',
      booking_message: state.business.bookingMessage || 'Reserva tu cita sin llamadas ni mensajes.',
    }).eq('id', businessId);
    if (businessError) throw businessError;

    const { error: servicesError } = await this.client.from('services').upsert(
      state.services.map(item => ({
        id: item.id,
        business_id: businessId,
        name: item.name,
        price: item.price,
        duration_minutes: item.duration,
        description: item.description || '',
        active: item.active,
      })),
      { onConflict: 'id' },
    );
    if (servicesError) throw servicesError;

    const { error: staffError } = await this.client.from('staff').upsert(
      state.staff.map(item => ({
        id: item.id,
        business_id: businessId,
        user_id: item.userId || null,
        name: item.name,
        specialty: item.specialty || '',
        schedule_label: item.schedule || '',
        active: item.active,
      })),
      { onConflict: 'id' },
    );
    if (staffError) throw staffError;

    const { error: hoursError } = await this.client.from('business_hours').upsert(
      Object.entries(state.business.schedule).map(([day, item]) => ({
        business_id: businessId,
        day_of_week: Number(day),
        is_open: item.open,
        opening_time: item.start,
        closing_time: item.end,
      })),
      { onConflict: 'business_id,day_of_week' },
    );
    if (hoursError) throw hoursError;

    const desiredClosures = state.business.closures.map(item => item.date);
    const { data: existingClosures, error: closureReadError } = await this.client
      .from('business_closures').select('id, closure_date').eq('business_id', businessId);
    if (closureReadError) throw closureReadError;

    for (const existing of existingClosures || []) {
      if (!desiredClosures.includes(existing.closure_date)) {
        const { error } = await this.client.from('business_closures').delete().eq('id', existing.id);
        if (error) throw error;
      }
    }
    if (state.business.closures.length) {
      const { error: closureUpsertError } = await this.client.from('business_closures').upsert(
        state.business.closures.map(item => ({
          business_id: businessId,
          closure_date: item.date,
          reason: item.reason,
        })),
        { onConflict: 'business_id,closure_date' },
      );
      if (closureUpsertError) throw closureUpsertError;
    }
  },

  subscribe(onChange) {
    if (!this.enabled || !this.business) return;
    const userKey = this.profile?.id || 'anon';
    if (this.channel && this.channelUserId === userKey) return;
    if (this.channel) this.client.removeChannel(this.channel);
    this.channelUserId = userKey;
    this.channel = this.client.channel(`appointmentsaas-live-${userKey}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'appointments',
        filter: `business_id=eq.${this.business.id}`,
      }, () => onChange())
      .subscribe();
  },
};

window.Cloud = Cloud;
