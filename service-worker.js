// ExpenseFlow service worker
const CACHE_NAME = 'expenseflow-cache-v3';

const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install new service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

// Remove old caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// Handle requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Always try the network first for page/navigation requests.
  // This ensures the installed app receives the newest index.html.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put('./index.html', clone);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );

    return;
  }

  // Cache-first for supporting files such as icons and manifest.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }

        return response;
      });
    })
  );
});
