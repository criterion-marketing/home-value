// Criterion Daily: client for the Apps Script API.
// The UI (index.html) still speaks the old REST paths (/api/tasks, /api/approvals/<id>/approve, ...). CD.api() maps each one
// to an Apps Script action and returns a normal fetch Response, so the UI code stays the same as the box version.
// Calls made in the same tick are sent together as one 'batch' request (one Apps Script execution).
// The device token lives only in this device's localStorage and is sent in the POST body (never in a URL).
(function () {
  const cfg = window.CD_CONFIG || {};
  const TOKEN_KEY = 'cd.token', PUSH_KEY = 'cd.fcm';
  let token = null; try { token = localStorage.getItem(TOKEN_KEY); } catch {}
  let onUnpaired = () => {};

  async function post(body) {
    const r = await fetch(cfg.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body),
      credentials: 'omit', cache: 'no-store', redirect: 'follow' });
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }
  let queue = [], timer = null;
  function call(action, args) {
    return new Promise((resolve, reject) => { queue.push({ action, args: args || {}, resolve, reject }); if (!timer) timer = setTimeout(flush, 0); });
  }
  async function flush() {
    const items = queue; queue = []; timer = null;
    try {
      let results;
      if (items.length === 1) results = [await post({ action: items[0].action, token, args: items[0].args })];
      else { const j = await post({ action: 'batch', token, calls: items.map(i => ({ action: i.action, args: i.args })) }); results = j.ok ? j.results : items.map(() => j); }
      items.forEach((it, i) => it.resolve(results[i] || { ok: false, status: 500, error: 'no result' }));
    } catch (e) { items.forEach(it => it.reject(e)); }
  }

  // old REST path -> [action, args]
  function route(method, path, body) {
    let m;
    const list = path.startsWith('/api/yells/tasks') ? 'yells' : 'daniel';
    const tp = path.replace(/^\/api\/(yells\/)?tasks/, '');
    if (method === 'GET') {
      if (path === '/api/me') return ['me'];
      if (path === '/api/version') return ['version'];
      if (/^\/api\/(yells\/)?tasks$/.test(path)) return ['tasks.get', { list }];
      if (path === '/api/deals') return ['deals.get'];
      if (path === '/api/approvals') return ['approvals.get'];
      if (path === '/api/leads') return ['leads.get'];
      if (path === '/api/notify/yells') return ['yells.history'];
      if (path === '/api/yells/messages') return ['yells.messages'];
      if (path === '/api/devices') return ['device.list'];
      if (path === '/api/push/status') return ['push.status'];
      return null;
    }
    if (/^\/api\/(yells\/)?tasks\//.test(path)) {
      if (tp === '/add') return ['task.add', { list, text: body.text }];
      if (tp === '/restore') return ['task.restore', Object.assign({ list }, body)];
      if ((m = tp.match(/^\/([^/]+)\/(toggle|delete)$/))) return ['task.' + m[2], { list, id: decodeURIComponent(m[1]) }];
    }
    if ((m = path.match(/^\/api\/deals\/([^/]+)\/checklist\/([^/]+)\/(toggle|delete)$/))) return ['checklist.' + m[3], { dealId: decodeURIComponent(m[1]), id: decodeURIComponent(m[2]) }];
    if ((m = path.match(/^\/api\/approvals\/([^/]+)\/(approve|skip|edit|restore)$/))) return ['approval.decide', Object.assign({}, body, { id: decodeURIComponent(m[1]), act: m[2] })];
    if ((m = path.match(/^\/api\/leads\/([^/]+)\/status$/))) return ['lead.status', { id: decodeURIComponent(m[1]), status: body.status }];
    if (path === '/api/notify/yells') return ['yells.send', body];
    if (path === '/api/notify/yells/clear') return ['yells.clear'];
    if (path === '/api/yells/messages/ack') return ['yells.ack', body];
    if (path === '/api/push/test') return ['push.test'];
    if (path === '/api/logout') return ['device.forget'];
    if ((m = path.match(/^\/api\/devices\/([^/]+)\/revoke$/))) return ['device.revoke', { device_id: decodeURIComponent(m[1]) }];
    if (path === '/api/pair') return ['pair.create', body];
    return null;
  }
  const jsonResp = (o, status) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  let appStamp = null;
  async function appVersion() {
    try { const r = await fetch('app-version.json?t=' + Date.now(), { cache: 'no-store' }); if (r.ok) appStamp = (await r.json()).app || appStamp; } catch {}
    return appStamp;
  }
  async function api(u, opt) {
    opt = opt || {};
    const url = new URL(u, 'http://x'); const method = (opt.method || 'GET').toUpperCase();
    let body = {}; if (opt.body) { try { body = JSON.parse(opt.body); } catch {} }
    const rt = route(method, url.pathname, body);
    if (!rt) return jsonResp({ ok: false, error: 'not found' }, 404);
    if (!token) { onUnpaired(); throw new Error('login'); }
    const [action, args] = rt;
    const [j, app] = await Promise.all([call(action, args || {}), action === 'version' ? appVersion() : null]);
    if (!j.ok && (j.status === 401 || j.error === 'not_paired')) { clearToken(); onUnpaired(); throw new Error('login'); }
    if (action === 'version') {
      if (j.ok) CD.boxLastSync = j.box_last_sync_at || CD.boxLastSync;
      const inm = opt.headers && (opt.headers['If-None-Match'] || opt.headers['if-none-match']);
      if (j.ok && inm === `"${j.v}"` && (!app || app === CD.firstApp)) return new Response(null, { status: 304 });
      if (CD.firstApp == null && app) CD.firstApp = app;
      return jsonResp(Object.assign({}, j, { app }), j.ok ? 200 : j.status || 500);
    }
    if (action === 'device.forget' && j.ok) clearToken();
    return jsonResp(j, j.ok ? 200 : (j.status || 500));
  }
  function clearToken() { token = null; try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PUSH_KEY); } catch {} }
  const deviceLabel = () => { const ua = navigator.userAgent; return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPad'
    : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows PC' : 'Browser'; };
  async function pair(code) {
    const j = await post({ action: 'pair.redeem', args: { code, label: deviceLabel(), ua: navigator.userAgent.slice(0, 120) } });
    if (j.ok && j.token) { token = j.token; try { localStorage.setItem(TOKEN_KEY, token); } catch {} }
    return j;
  }

  // ---- push via Firebase Cloud Messaging (SDK loaded only when needed) ----
  const pushConfigured = () => !!cfg.firebase && !/REPLACE/.test(JSON.stringify(cfg.firebase) + String(cfg.vapidKey || ''));
  let messaging = null, fb = null;
  async function fcm() {
    if (messaging) return messaging;
    const app = await import('./vendor/firebase-app.js'); fb = await import('./vendor/firebase-messaging.js');
    if (!(await fb.isSupported())) throw new Error('unsupported');
    messaging = fb.getMessaging(app.initializeApp(cfg.firebase)); return messaging;
  }
  async function registerToken(reg) {
    const m = await fcm();
    const t = await fb.getToken(m, { vapidKey: cfg.vapidKey, serviceWorkerRegistration: reg });
    if (!t) throw new Error('no token');
    let last = null; try { last = localStorage.getItem(PUSH_KEY); } catch {}
    if (last !== t) { const j = await call('push.register', { fcm_token: t, ua: navigator.userAgent.slice(0, 120) }); if (!j.ok) throw new Error(j.error || 'register failed');
      try { localStorage.setItem(PUSH_KEY, t); } catch {} }
    return t;
  }
  async function pushCheck(isIOS, standalone) {
    if (!pushConfigured()) return 'notready';
    if (isIOS && !standalone) return 'install';
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      if (Notification.permission !== 'granted') return 'off';
      const st = await call('push.status', {}); if (!st.ok || !st.this_device) { try { localStorage.removeItem(PUSH_KEY); } catch {} }
      await registerToken(reg); return 'on';      // refreshes the FCM token each open (iOS can rotate it)
    } catch { return 'off'; }
  }
  async function pushEnable() {
    const perm = await Notification.requestPermission();        // first thing in the tap handler (iOS rule)
    if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
    const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
    await registerToken(reg); return 'on';
  }

  window.CD = { api, call, pair, clearToken, hasToken: () => !!token, set onUnpaired(fn) { onUnpaired = fn; }, pushConfigured, pushCheck, pushEnable,
    cfg, boxLastSync: '', firstApp: null };
})();
