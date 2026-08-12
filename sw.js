// ================================================================
// sw.js - Service Worker لتطبيق نظام التحضير (PWA)
// يدعم التخزين المؤقت للملفات الأساسية ويعمل على أندرويد
// ================================================================

const CACHE_NAME = 'sarya-pwa-v2';
const OFFLINE_URL = '/web/index.html';

// الملفات الأساسية التي سيتم تخزينها مؤقتاً
const ASSETS = [
  '/web/',
  '/web/index.html',
  '/web/styles.css',
  '/web/renderer.js',
  '/web/manifest.json'
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 تخزين الملفات الأساسية');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل الـ Service Worker وحذف الكاش القديم
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

// استراتيجية "الشبكة أولاً" للملفات، مع الاحتياط بالكاش
// هذا يضمن أن ملف users.json يتم جلبه دائماً من الشبكة (لكننا سنستثنيه)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // نستثني طلبات users.json (نذهب للشبكة دائماً ولا نخزنها)
  if (requestUrl.pathname.includes('users.json')) {
    event.respondWith(fetch(event.request).catch(() => {
      // في حال فشل الشبكة، نعيد استجابة فارغة أو رسالة خطأ
      return new Response('لا يمكن تحميل بيانات المستخدمين، تأكد من الاتصال بالإنترنت', { status: 503 });
    }));
    return;
  }

  // استراتيجية "Stale-While-Revalidate" للملفات الأخرى
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // نعيد النسخة المخزنة إن وجدت، ونحدث الكاش في الخلفية
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // نحدث الكاش بالنسخة الجديدة
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // إذا فشل الشبكة ولا يوجد كاش، نعيد الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });

      // نعيد النسخة المخزنة أولاً (إن وجدت) أو ننتظر الشبكة
      return cachedResponse || fetchPromise;
    })
  );
});