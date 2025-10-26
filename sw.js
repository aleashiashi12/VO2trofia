const CACHE_NAME = 'entrenador-interactivo-cache-v4-minimal';
// Solo cachear el HTML principal y el icono principal
const urlsToCache = [
    './', // El index.html (asumiendo que está en la raíz del scope del SW)
    'icon-192.png' // El icono mínimo requerido por el manifest simple
];

self.addEventListener('install', event => {
    console.log('SW (Minimal): Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW (Minimal): Cache abierto, añadiendo URLs mínimas:', urlsToCache);
                // Intentar cachear solo lo esencialísimo
                return cache.addAll(urlsToCache);
            })
            .then(() => {
               console.log('SW (Minimal): Instalado y archivos mínimos cacheados.');
               return self.skipWaiting(); // Activar inmediatamente
            })
            .catch(error => {
                console.error('SW (Minimal): Fallo CRÍTICO al cachear URLs mínimas:', error);
                // Si esto falla, la PWA no se instalará correctamente.
            })
    );
});

self.addEventListener('activate', event => {
    console.log('SW (Minimal): Activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW (Minimal): Borrando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW (Minimal): Activado y listo.');
            return self.clients.claim(); // Tomar control inmediato
        })
    );
});

self.addEventListener('fetch', event => {
     // Estrategia: Cache First MUY simple, solo para lo cacheado en install
     console.log('SW (Minimal): Fetch interceptado para:', event.request.url);
     
     // Determina si la URL solicitada coincide EXACTAMENTE con las cacheadas
     // Necesitamos resolver './' a la URL completa del scope
     const scopeUrl = self.registration.scope;
     const requestUrl = event.request.url;
     
     const isCachedUrl = urlsToCache.some(url => {
         if (url === './') return requestUrl === scopeUrl;
         // Construir URL completa para comparar
         const fullCachedUrl = new URL(url, scopeUrl).href;
         return requestUrl === fullCachedUrl;
     });

     if (isCachedUrl) {
          console.log('SW (Minimal): Intentando servir desde caché:', requestUrl);
          event.respondWith(
              caches.match(event.request).then(response => {
                  // Si está en caché, devolverlo. Si no, ir a red (y no cachear la respuesta)
                  if (response) {
                      return response;
                  }
                  console.log('SW (Minimal): No encontrado en caché, yendo a red:', requestUrl);
                  return fetch(event.request).catch(err => {
                       console.error('SW (Minimal): Error buscando en red (offline?):', err, requestUrl);
                  });
              })
          );
     } else {
         // Para todo lo demás (Tailwind, Fonts, etc.), simplemente ir a la red
         console.log('SW (Minimal): Petición no cacheada, yendo directo a red:', requestUrl);
         // No llamamos a event.respondWith, dejamos que el navegador lo maneje
     }
});