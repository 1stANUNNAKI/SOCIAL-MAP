/**
 * Service Worker لدعم العمل الكامل بدون إنترنت والتخزين المؤقت للخرائط
 * OpenMapIQ Iraq GIS v6
 */

const STATIC_CACHE = 'smi-static-v16';
const TILE_CACHE = 'openmapiq-tiles-offline-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== STATIC_CACHE && k !== TILE_CACHE) {
            return caches.delete(k);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. التعامل مع طلبات بلاطات الخرائط
  if (url.hostname.includes('tile.openstreetmap') || url.hostname.includes('arcgisonline.com')) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // في حال كان المستخدم أوفلاين ولم تكن البلاطة مخزنة، نعيد استجابة فارغة بدلاً من خطأ يوقف الصفحة
              return new Response('', { status: 408, statusText: 'Offline Tile' });
            });
        });
      })
    );
    return;
  }

  // 2. عدم اعتراض طلبات الـ API الخارجية أو إضافات المتصفح
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. التعامل مع الملفات المحلية: الشبكة أولاً بدون كاش قديم (Network-First) لضمان تحديث التعديلات فوراً
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        const cloned = networkResponse.clone();
        if (networkResponse.status === 200 && event.request.method === 'GET') {
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, cloned)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
