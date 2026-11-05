// App de vendedores sin internet: guarda la página y sus archivos en el teléfono para que abra
// aunque no haya señal. Las ventas se guardan aparte (IndexedDB) y la página las sube después.
// Solo controla /vendedores: el resto del sitio funciona como siempre.

const CACHE = 'parrandon-vendedores-v1';
const PAGINA = '/vendedores';
const ESPERA_RED_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(PAGINA))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('parrandon-vendedores-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// La página avisa qué archivos cargó (los que bajó antes de que este service worker existiera).
self.addEventListener('message', (event) => {
  if (!event.data || event.data.tipo !== 'guardar') return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        (event.data.urls || []).map(async (u) => {
          try {
            const url = new URL(u, self.location.origin);
            if (url.origin !== self.location.origin || !guardable(url)) return;
            if (await cache.match(url, { ignoreVary: true })) return;
            const res = await fetch(url, { credentials: 'same-origin' });
            if (res.ok) await cache.put(url, res);
          } catch {
            // se intenta de nuevo la próxima vez que abra con internet
          }
        })
      );
      if (event.source) event.source.postMessage({ tipo: 'guardado' });
    })()
  );
});

function guardable(url) {
  return (
    url.pathname === PAGINA ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/vendedores.webmanifest'
  );
}

function conLimite(promesa, ms) {
  return Promise.race([promesa, new Promise((_, reject) => setTimeout(() => reject(new Error('lento')), ms))]);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // La página: primero la red (para tener la versión nueva), y si no hay o tarda, la guardada.
  if (req.mode === 'navigate' && url.pathname.startsWith(PAGINA)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await conLimite(fetch(req), ESPERA_RED_MS);
          if (res.ok) await cache.put(PAGINA, res.clone());
          return res;
        } catch {
          return (await cache.match(PAGINA, { ignoreVary: true })) || Response.error();
        }
      })()
    );
    return;
  }

  // Archivos con nombre único por versión: si ya están guardados, no hace falta la red.
  // ignoreVary: las imágenes de Next responden «Vary: Accept» y el navegador pide con otro Accept.
  if (guardable(url) && url.pathname !== PAGINA) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(req, { ignoreVary: true });
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })()
    );
  }
});
