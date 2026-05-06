const CACHE_NAME = 'qbot-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const alarmId = event.notification.data && event.notification.data.alarmId;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.focus();
          if (alarmId) client.postMessage({ type: 'ALARM_CONFIRMED', alarmId: alarmId });
          return;
        }
      }
      if (clients.openWindow) {
        var url = '/dashboard';
        if (alarmId) url += '?confirmAlarm=' + alarmId;
        return clients.openWindow(url);
      }
    })
  );
});
