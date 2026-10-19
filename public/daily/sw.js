// Criterion Daily service worker (GitHub Pages build): shows pushes from Firebase Cloud Messaging and opens the app on tap. No caching.
// FCM delivers {data:{title,body,url,tag}, notification:{...}}; we always show the notification ourselves (required on iOS).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let p = {}; try { p = e.data ? e.data.json() : {}; } catch { p = { body: e.data ? e.data.text() : '' }; }
  const n = p.notification || {}, d = p.data || {};
  const title = d.title || n.title || p.title || 'To Do', body = d.body || n.body || p.body || '';
  const url = d.url || p.url || '/', tag = d.tag || n.tag || p.tag || undefined;
  e.waitUntil(self.registration.showNotification(title, { body, tag, icon: 'icon-192.png', badge: 'icon-192.png', data: { url } }));
});
// "/?view=messages" style links are resolved inside this app's scope (/home-value/daily/).
const inScope = u => new URL(String(u || '/').replace(/^\/+/, ''), self.registration.scope).href;
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = inScope(e.notification.data && e.notification.data.url);
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all.find(w => w.url.startsWith(self.registration.scope));
    if (c) { c.postMessage({ type: 'open', url }); try { await c.focus(); return; } catch {} }
    return self.clients.openWindow(url);
  })());
});
