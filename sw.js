const CACHE_NAME = 'sarya-pwa-v5'; // غيّر الرقم لتفعيل التحديث
const OFFLINE_URL = '/web/index.html';

const ASSETS = [
  '/web/',
  '/web/index.html',
  '/web/styles.css',
  '/web/renderer.js',
  '/web/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 تخزين الملفات الأساسية');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // استثناء users.json (نذهب للشبكة دائماً)
  if (requestUrl.pathname.includes('users.json')) {
    event.respondWith(fetch(event.request).catch(() => {
      return new Response('لا يمكن تحميل بيانات المستخدمين', { status: 503 });
    }));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
      return cachedResponse || fetchPromise;
    })
  );
});