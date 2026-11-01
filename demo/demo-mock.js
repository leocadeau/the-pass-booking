/* THE PASS — démo interactive : la vraie application, branchée sur un serveur SIMULÉ dans le navigateur.
   Aucune donnée réelle, rien n'est enregistré (tout repart à zéro au rechargement). */
(function () {
  var SUPA = 'https://pbvrsxhnkckcaqnanvzp.supabase.co';
  var RID = '11111111-1111-1111-1111-111111111111', UID = '22222222-2222-2222-2222-222222222222';
  var now = new Date();
  function iso(h, m, dayOffset) { var d = new Date(now); d.setDate(d.getDate() + (dayOffset || 0)); d.setHours(h, m || 0, 0, 0); return d.toISOString(); }
  function day(o) { var d = new Date(now); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); }
  function b64(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  var exp = Math.floor(Date.now() / 1000) + 30 * 86400;
  var USER = { id: UID, aud: 'authenticated', role: 'authenticated', email: 'demo@thepass.app', user_metadata: { full_name: 'Démo THE PASS' }, app_metadata: {}, created_at: now.toISOString() };
  var JWT = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: UID, role: 'authenticated', exp: exp, email: USER.email, aud: 'authenticated' }) + '.demo';
  var SESSION = { access_token: JWT, token_type: 'bearer', expires_in: 30 * 86400, expires_at: exp, refresh_token: 'demo', user: USER };
  try { localStorage.setItem('sb-pbvrsxhnkckcaqnanvzp-auth-token', JSON.stringify(SESSION)); } catch (e) {}

  var PERMS = ['view_dashboard','view_finance','view_analytics','manage_bills','refund_bills','manage_reservations','serve_tables','manage_floor_plan','view_guests','view_guest_contacts','view_dietary_health','manage_dietary_health','confirm_kitchen','manage_team','manage_settings','manage_marketing','manage_billing'];
  var AREAS = [{ id: 'a1', restaurant_id: RID, name: 'Salle', kind: 'indoor', sort_order: 0, width: 1000, height: 700, active: true },
               { id: 'a2', restaurant_id: RID, name: 'Terrasse', kind: 'terrace', sort_order: 1, width: 1000, height: 500, active: true }];
  var TABLES = [];
  [[1,'round',2,'free'],[2,'square',2,'seated'],[3,'square',4,'reserved'],[4,'rectangle',6,'free'],[5,'round',4,'bill_requested'],[6,'square',4,'cleaning']].forEach(function (t, i) {
    TABLES.push({ id: 't' + t[0], restaurant_id: RID, area_id: 'a1', name: 'T' + t[0], shape: t[1], x: 80 + (i % 3) * 280, y: 90 + Math.floor(i / 3) * 260, width: t[1] === 'rectangle' ? 160 : 100, height: 100, rotation: 0, seats_min: 1, seats_max: t[2], combinable: true, status: t[3], status_changed_at: iso(19), server_member_id: 'm1', version: 1, active: true });
  });
  [[7,'round',2],[8,'round',2],[9,'square',4]].forEach(function (t, i) {
    TABLES.push({ id: 't' + t[0], restaurant_id: RID, area_id: 'a2', name: 'E' + (i + 1), shape: t[1], x: 120 + i * 280, y: 160, width: 100, height: 100, rotation: 0, seats_min: 1, seats_max: t[2], combinable: true, status: 'free', status_changed_at: iso(12), server_member_id: null, version: 1, active: true });
  });
  var GUESTS = [['g1','Alice','Martin',true,6,'1988-' + day(12).slice(5)],['g2','Hugo','Roux',false,2,null],['g3','Inès','Fontaine',false,9,null],['g4','Louis','Girard',true,14,null],['g5','Chloé','Lambert',false,1,null],['g6','Nathan','Moreau',false,3,null],['g7','Manon','Faure',false,1,null],['g8','Jules','Mercier',false,4,null]].map(function (g, i) {
    return { id: g[0], restaurant_id: RID, first_name: g[1], last_name: g[2], birthday: g[5], is_vip: g[3], tags: [], notes_internal: i === 0 ? 'Préfère la banquette.' : null,
      marketing_email_consent_at: i % 2 ? iso(10, 0, -40) : null, marketing_sms_consent_at: null, anonymized_at: null, created_at: iso(10, 0, -120 + i * 10), visits: g[4],
      first_visit_at: g[4] ? iso(20, 0, -110 + i * 5) : null, last_visit_at: g[4] ? iso(20, 0, -(5 + i * 9)) : null, upcoming_reservations: i < 5 ? 1 : 0, cancellations: i === 5 ? 2 : 0, no_shows: i === 5 ? 1 : 0, spend_ttc_cents: g[4] * 6800, has_dietary_alert: i === 0 || i === 2 };
  });
  function g(id) { var x = GUESTS.filter(function (y) { return y.id === id; })[0]; return { id: x.id, first_name: x.first_name, last_name: x.last_name, is_vip: x.is_vip }; }
  var RES = [['r1','g1',20,0,2,'confirmed','web','Anniversaire — bougie au dessert','yes','t1'],['r2','g2',19,30,2,'seated','phone',null,'no','t2'],['r3','g3',20,30,4,'confirmed','web',null,'yes','t3'],
             ['r4','g4',21,0,6,'confirmed','app','Table calme','no','t4'],['r5','g5',19,0,4,'seated','walk_in',null,'unknown','t5'],['r6','g6',21,30,2,'confirmed','phone',null,'unknown',null]].map(function (r) {
    return { id: r[0], restaurant_id: RID, guest_id: r[1], service_id: 's2', starts_at: iso(r[2], r[3]), ends_at: iso(r[2] + 2, r[3]), party_size: r[4], status: r[5], source: r[6], special_requests: r[7], notes_internal: null,
      allergy_declaration: r[8], intolerance_declaration: 'no', created_at: iso(10), seated_at: r[5] === 'seated' ? iso(r[2], r[3]) : null, completed_at: null, cancelled_at: null, manage_token: 'demo',
      guest: g(r[1]), reservation_tables: r[9] ? [{ table_id: r[9], active: true }] : [], kitchen_alert: r[8] === 'yes' ? { state: r[0] === 'r1' ? 'to_process' : 'sent_to_kitchen' } : null };
  });
  var MENU = [['i1','Burrata, tomates anciennes','Entrées',1400,['milk'],'Burrata des Pouilles, tomates de saison, basilic.'],['i2','Velouté de potimarron','Entrées',1100,['milk','celery'],'Crème légère, graines torréfiées.'],
    ['i3','Tartare de bœuf au couteau','Plats',2200,['mustard','eggs'],'Bœuf charolais, condiments, frites maison.'],['i4','Dos de cabillaud, beurre blanc','Plats',2600,['fish','milk','sulphites'],'Légumes du marché.'],
    ['i5','Risotto aux champignons','Plats',2100,['milk'],'Carnaroli, parmesan 24 mois.'],['i6','Moelleux chocolat','Desserts',900,['gluten','eggs','milk'],'Cœur coulant, glace vanille.'],
    ['i7','Verre de vin rouge','Boissons',700,['sulphites'],'Sélection du moment.'],['i8','Eau minérale 75 cl','Boissons',500,[],null]].map(function (m, i) {
    return { id: m[0], restaurant_id: RID, name: m[1], category: m[2], price_cents: m[3], vat_rate_bp: m[2] === 'Boissons' ? (m[0] === 'i8' ? 550 : 2000) : 1000, active: true, description: m[5], photo_path: null, allergens: m[4], allergens_verified_at: iso(9, 0, -3),
      is_available: m[0] !== 'i2', available_from: null, available_to: null, is_public: true, sort_order: i, translations: {} };
  });
  var MEMBERS = [['m1','Léo','owner'],['m2','Sam','server'],['m3','Flo','floor_manager']].map(function (m) { return { id: m[0], restaurant_id: RID, user_id: m[0] === 'm1' ? UID : 'u-' + m[0], role: m[2], permissions: null, display_name: m[1], active: true }; });
  var SHIFTS = []; for (var k = 0; k < 7; k++) { SHIFTS.push({ id: 'sh' + k, restaurant_id: RID, member_id: k % 2 ? 'm2' : 'm1', starts_at: iso(18, 0, k - 1), ends_at: iso(23, 30, k - 1), note: 'Salle' }); if (k % 3 === 0) SHIFTS.push({ id: 'shb' + k, restaurant_id: RID, member_id: 'm3', starts_at: iso(11, 0, k - 1), ends_at: iso(15, 0, k - 1), note: 'Déjeuner' }); }
  var SERIES = []; for (var d = 29; d >= 0; d--) { var wd = new Date(now.getTime() - d * 864e5).getDay(); var base = [0, 18000, 21000, 24000, 30000, 52000, 61000][wd]; SERIES.push({ day: day(-d), revenue_ttc_cents: d === 0 ? 38000 : base + (d * 1373) % 9000, revenue_ht_cents: Math.round((base) / 1.1), vat_cents: Math.round(base * 0.09), tips_cents: 900, bills: wd ? 6 + wd : 0, covers: wd ? 14 + wd * 3 : 0 }); }
  var DASH = { day: day(0), timezone: 'Europe/Paris', generated_at: now.toISOString(),
    reservations: { reservations: 6, covers_expected: 20, guests_seated: 6, cancellations: 0, no_shows: 0, waitlist: 1, late: 0, upcoming: 4 },
    tables: { total: 9, free: 5, occupied: 2, cleaning: 1, reserved: 1, unavailable: 0, occupancy_rate: 0.33 },
    services: [{ service_id: 's1', name: 'Déjeuner', start_time: '12:00:00', reservations: 9, covers: 24 }, { service_id: 's2', name: 'Dîner', start_time: '19:00:00', reservations: 6, covers: 20 }],
    finance: { real: { revenue_ttc_cents: 38000, bills: 6, tips_cents: 1200, avg_basket_cents: 6333, per_cover_cents: 3166 },
      estimate: { remaining_covers: 14, per_cover_cents: 3500, remaining_revenue_cents: 49000, basis: { days: 28, bills: 140, covers: 380 }, available: true } } };
  var TP = TABLES.map(function (t, i) { return { table_id: t.id, table_name: t.name, area_name: t.area_id === 'a1' ? 'Salle' : 'Terrasse', area_kind: t.area_id === 'a1' ? 'indoor' : 'terrace', seats_max: t.seats_max, revenue_ttc_cents: 40000 + ((i * 7919) % 90000), bills: 8 + i, covers: 20 + i * 3, avg_basket_cents: 6200 + i * 300, occupied_minutes: 900 + i * 120, rotations: 1 + (i % 3) * 0.4, revenue_per_hour_cents: 3200 + i * 150, revenue_per_cover_cents: 3100 + i * 90 }; });

  var RPC = {
    my_restaurants: [{ restaurant_id: RID, name: 'Le Comptoir (démo)', slug: 'the-pass-demo', role: 'owner', permissions: PERMS, is_demo: true }],
    my_permissions: PERMS, dashboard_today: DASH, my_member_id: 'm1', reservation_has_dietary_alert: true,
    staff_hours: [{ member_id: 'm1', display_name: 'Léo', role: 'owner', planned_minutes: 1650, worked_minutes: 1580, open_since: null }, { member_id: 'm2', display_name: 'Sam', role: 'server', planned_minutes: 990, worked_minutes: 1020, open_since: null }, { member_id: 'm3', display_name: 'Flo', role: 'floor_manager', planned_minutes: 720, worked_minutes: 700, open_since: null }],
    activity_summary: { from: day(-6), to: day(0), days: 7, reservations: 84, covers_booked: 236, covers_honored: 214, cancellations: 6, no_shows: 3, no_show_rate: 0.036, waitlist: 2, walk_ins: 11, by_source: { web: 38, phone: 27, app: 8, walk_in: 11 }, new_guests: 21, returning_guests: 44, by_weekday: { 1: 18, 2: 22, 3: 26, 4: 31, 5: 52, 6: 65 }, by_hour: { 12: 61, 13: 38, 19: 24, 20: 58, 21: 33 }, revenue_ttc_cents: 1412000 },
    suggest_tables: [{ table_ids: ['t1'], tables: ['T1'], area: 'Salle', seats: 2, wasted_seats: 0, combined: false, idle_before_min: null, idle_after_min: 0, score: 0, reasons: ['Capacité exacte', "S'enchaîne avec une autre réservation"] }, { table_ids: ['t7'], tables: ['E1'], area: 'Terrasse', seats: 2, wasted_seats: 0, combined: false, idle_before_min: null, idle_after_min: null, score: 0, reasons: ['Capacité exacte'] }],
    service_fill: { day: day(0), seats: 30, services: [{ service_id: 's1', name: 'Déjeuner', start_time: '12:00:00', end_time: '15:00:00', covers: 24, reservations: 9, capacity: 30, fill_ratio: 0.8, tables_used: 7, rotations: 1.3 }, { service_id: 's2', name: 'Dîner', start_time: '19:00:00', end_time: '23:00:00', covers: 20, reservations: 6, capacity: 30, fill_ratio: 0.667, tables_used: 5, rotations: 1 }] },
    floor_conflicts: [{ kind: 'no_table', reservation_id: 'r6', starts_at: iso(21, 30), party_size: 2, message: 'Réservation sans table attribuée' }],
    usage_summary: { period_start: iso(0, 0, -now.getDate() + 1), items: [{ kind: 'ai_requests', limit: 150, used: 12, cost_cents: null }, { kind: 'email', limit: 1000, used: 240, cost_cents: null }, { kind: 'sms', limit: 100, used: 85, cost_cents: 383 }, { kind: 'voice_minutes', limit: 50, used: 0, cost_cents: null }] },
    get_available_slots: [19, 19.5, 20, 20.5, 21].map(function (h) { return { slot: iso(Math.floor(h), h % 1 ? 30 : 0, 1), service_id: 's2', service_name: 'Dîner' }; }),
    revenue_series: SERIES, table_performance: TP,
    staff_performance: [{ member_id: 'm1', display_name: 'Léo', role: 'owner', revenue_ttc_cents: 612000, bills: 92, covers: 240, avg_basket_cents: 6652 }, { member_id: 'm2', display_name: 'Sam', role: 'server', revenue_ttc_cents: 488000, bills: 71, covers: 188, avg_basket_cents: 6873 }],
    service_performance: [{ service_id: 's1', service_name: 'Déjeuner', revenue_ttc_cents: 402000, bills: 98, covers: 230, avg_basket_cents: 4102 }, { service_id: 's2', service_name: 'Dîner', revenue_ttc_cents: 698000, bills: 65, covers: 198, avg_basket_cents: 10738 }],
    finance_summary: { revenue_ttc_cents: 1100000, revenue_ht_cents: 975000, vat_cents: 125000, tips_cents: 31000, refunds_cents: 0, bills: 163, covers: 428, expenses_ht_cents: 420000, expenses_ht_cents_by_category: { food: 260000, beverage: 80000, energy: 40000, software: 40000 }, payments_by_method: { card: 880000, cash: 120000, meal_voucher: 100000 }, sales_by_category: { Entrées: 180000, Plats: 620000, Desserts: 120000, Boissons: 180000 }, operating_result_is_estimate: true },
    export_guest_data: { format: 'thepass.guest-export.v1', note: 'Démo : export fictif' },
  };
  var TABLE = {
    restaurants: { id: RID, name: 'Le Comptoir (démo)', slug: 'the-pass-demo', timezone: 'Europe/Paris', address: '12 rue des Tanneurs', city: 'Aix-en-Provence', postal_code: '13100', phone: '0442000000', email: 'contact@exemple.fr', website: null, cuisine: 'Bistronomie', description: 'Établissement de démonstration.', default_reservation_minutes: 120, booking_enabled: true, booking_min_notice_minutes: 60, booking_max_days_ahead: 60, booking_max_party_size: 8, is_demo: true, menu_published: true, menu_languages: ['fr', 'en'], menu_note: null },
    reservations: RES, dining_tables: TABLES, areas: AREAS,
    reservation_tables: RES.filter(function (r) { return r.reservation_tables.length; }).map(function (r) { return { table_id: r.reservation_tables[0].table_id, reservation: { id: r.id, starts_at: r.starts_at, ends_at: r.ends_at, status: r.status, party_size: r.party_size, special_requests: r.special_requests, guest: r.guest } }; }),
    kitchen_alerts: RES.filter(function (r) { return r.kitchen_alert; }).map(function (r) { return { reservation_id: r.id, state: r.kitchen_alert.state, updated_at: iso(10), reservation: { starts_at: r.starts_at, party_size: r.party_size, status: r.status, guest: r.guest } }; }),
    services: [{ id: 's1', restaurant_id: RID, name: 'Déjeuner', weekdays: [1,2,3,4,5,6], start_time: '12:00:00', last_seating_time: '13:45:00', end_time: '15:00:00', slot_interval_minutes: 15, reservation_minutes: 90, max_covers: 40, active: true, sort_order: 0 },
               { id: 's2', restaurant_id: RID, name: 'Dîner', weekdays: [1,2,3,4,5,6], start_time: '19:00:00', last_seating_time: '21:30:00', end_time: '23:00:00', slot_interval_minutes: 30, reservation_minutes: null, max_covers: null, active: true, sort_order: 1 }],
    guest_summary: GUESTS, guests: GUESTS, restaurant_members: MEMBERS, menu_items: MENU,
    menu_categories: ['Entrées','Plats','Desserts','Boissons'].map(function (n, i) { return { id: 'c' + i, name: n, sort_order: i, translations: {} }; }),
    staff_shifts: SHIFTS, staff_availability: [{ id: 'av1', member_id: 'm1', weekday: 5, start_time: '17:00:00', end_time: '23:59:00', note: null }],
    shift_requests: [{ id: 'q1', restaurant_id: RID, shift_id: 'sh1', kind: 'replacement', requester_member_id: 'm2', target_member_id: null, target_shift_id: null, status: 'pending', message: 'Examen ce soir', created_at: iso(9) }],
    guest_contacts: GUESTS.map(function (x) { return { guest_id: x.id, restaurant_id: RID, phone: '06 00 00 00 0' + x.id.slice(1), email: x.first_name.toLowerCase() + '@exemple.fr' }; }),
    guest_allergies: [{ id: 'al1', restaurant_id: RID, guest_id: 'g1', allergen: 'peanuts', details: 'Allergie sévère', last_verified_at: iso(10, 0, -20), created_at: iso(10, 0, -60) }],
    guest_intolerances: [{ id: 'in1', restaurant_id: RID, guest_id: 'g3', label: 'Lactose', details: null, last_verified_at: iso(10, 0, -200), created_at: iso(10, 0, -200) }],
    guest_preferences: [{ id: 'pr1', restaurant_id: RID, guest_id: 'g1', preference: 'vegetarian', details: null, created_at: iso(10, 0, -60) }],
    reservation_dietary: [{ id: 'rd1', restaurant_id: RID, reservation_id: 'r1', kind: 'allergy', allergen: 'peanuts', preference: null, label: null, details: 'Allergie sévère', guest_label: null }],
    subscriptions: { restaurant_id: RID, plan: 'all_inclusive', price_ht_cents: 8900, status: 'trialing', trial_ends_at: iso(12, 0, 12), current_period_end: null, cancel_at_period_end: false },
    review_sources: [{ id: 'rv1', restaurant_id: RID, platform: 'google', profile_url: 'https://maps.google.com/', rating: null, scale: 5, review_count: null, fetched_at: null, show_on_booking: true }],
    notification_preferences: [], member_invitations: [], expenses: [], closures: [], audit_log: [], dietary_change_events: [], table_status_events: [], bills: [], bill_totals: [], bill_items: [], bill_payments: [], time_entries: [], push_tokens: [],
  };
  function resp(body, status) { return new Response(body === undefined ? null : JSON.stringify(body), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/*' } }); }
  function filterRows(rows, sp) {
    var out = rows;
    sp.forEach(function (v, k) {
      if (!Array.isArray(out) || ['select','order','limit','offset','or','on_conflict','columns'].indexOf(k) >= 0) return;
      var m = /^eq\.(.*)$/.exec(v); if (m) out = out.filter(function (r) { return r[k] === undefined || String(r[k]) === m[1]; });
    });
    return out;
  }
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;
    if (url.indexOf(SUPA) !== 0) return realFetch(input, init);
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var headers = new Headers((init && init.headers) || (input && input.headers) || {});
    var single = (headers.get('Accept') || '').indexOf('vnd.pgrst.object') >= 0;
    var u = new URL(url), p = u.pathname;
    var body = null; try { body = init && init.body ? JSON.parse(init.body) : null; } catch (e) {}
    if (p.indexOf('/auth/v1/token') === 0) return Promise.resolve(resp(SESSION));
    if (p.indexOf('/auth/v1/user') === 0) return Promise.resolve(resp(USER));
    if (p.indexOf('/auth/v1/logout') === 0) return Promise.resolve(resp({}));
    if (p.indexOf('/auth/v1/') === 0) return Promise.resolve(resp({}));
    if (p.indexOf('/functions/v1/assistant') === 0) return Promise.resolve(resp({ error: "Démo : l'assistant IA répond une fois la clé Anthropic configurée sur la version réelle." }, 503));
    if (p.indexOf('/rest/v1/rpc/') === 0) {
      var fn = p.slice('/rest/v1/rpc/'.length);
      var r = RPC[fn];
      if (r === undefined) r = fn.indexOf('create_reservation') === 0 ? { reservation_id: 'r1', table_ids: ['t1'], duplicate: false, manage_token: 'demo' } : null;
      return Promise.resolve(resp(r));
    }
    if (p.indexOf('/rest/v1/') === 0) {
      var t = p.slice('/rest/v1/'.length);
      if (method !== 'GET' && method !== 'HEAD') {
        var echo = Array.isArray(body) ? body : Object.assign({ id: 'demo-' + Math.random().toString(36).slice(2, 8) }, body || {});
        return Promise.resolve(resp(single && Array.isArray(echo) ? echo[0] : echo, method === 'DELETE' ? 200 : 201));
      }
      var data = TABLE[t];
      if (data === undefined) data = [];
      if (Array.isArray(data)) data = filterRows(data, u.searchParams);
      if (single) data = Array.isArray(data) ? (data[0] || null) : data;
      else if (!Array.isArray(data)) data = [data];
      return Promise.resolve(resp(data));
    }
    if (p.indexOf('/storage/') === 0) return Promise.resolve(resp({}));
    return Promise.resolve(resp({}));
  };
  // Pas de temps réel dans la démo
  var RealWS = window.WebSocket;
  window.WebSocket = function (u, pr) { if (String(u).indexOf('supabase.co') >= 0) { var fake = { readyState: 3, send: function () {}, close: function () {}, addEventListener: function () {}, removeEventListener: function () {} }; return fake; } return new RealWS(u, pr); };
  window.WebSocket.prototype = RealWS.prototype; ['CONNECTING','OPEN','CLOSING','CLOSED'].forEach(function (k) { window.WebSocket[k] = RealWS[k]; });
  // Bandeau démo
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('div');
    b.setAttribute('role', 'note');
    b.style.cssText = 'position:fixed;right:10px;bottom:calc(84px + env(safe-area-inset-bottom));opacity:.92;z-index:2147483647;background:#D99A48;color:#141414;font:500 12px/1.2 system-ui,sans-serif;padding:6px 12px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.35);pointer-events:auto;white-space:nowrap';
    b.innerHTML = 'Démo · données fictives';
    document.body.appendChild(b);
  });
})();
