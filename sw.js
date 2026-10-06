/* Service worker de Question Lab — NETWORK-FIRST, calcado del que usa el Hub.
   Con red disponible siempre sirve la versión recién publicada (nunca queda
   pegado en una vieja, el problema que tuvo Desgram con cache-first); sin red,
   cae a la última copia cacheada. Existe para que la app sea instalable y
   funcione offline. */
/* v2: la app salió de index.html a app.js. Subir la versión bota la caché vieja
   entera en `activate` — incluidas las entradas que fue dejando el runtime, que
   apuntan a una estructura de archivos que ya no existe. */
const CACHE_VERSION = 'v2';
const CACHE_NAME = `question-lab-${CACHE_VERSION}`;
const BASE = '/question-lab/';

const urlsToCache = [
  BASE,
  `${BASE}index.html`,
  `${BASE}app.js`,
  `${BASE}tokens.css`,
  `${BASE}cefr.generated.js`,
  `${BASE}bank.js`,
  `${BASE}answers.js`,
  `${BASE}gamification.generated.js`,
  `${BASE}phrasal.generated.js`,
  `${BASE}spelling.generated.js`,

  `${BASE}capitals.generated.js`,
  `${BASE}vocabulary.generated.js`,
  `${BASE}fonts/Lexend.woff2`,
  `${BASE}fonts/AtkinsonHyperlegible-Regular.woff2`,
  `${BASE}fonts/AtkinsonHyperlegible-Bold.woff2`,
  `${BASE}favicon.svg`,
  `${BASE}logo.svg`,
  `${BASE}site.webmanifest`,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(name => {
        if (name !== CACHE_NAME) return caches.delete(name);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match(`${BASE}index.html`);
          }
          return new Response('Offline', { status: 503 });
        })
      )
  );
});
