// Define un nombre y versión para el caché
const CACHE_NAME = 'entrenador-vo2trofia-v1'; // Cambié el nombre para forzar la actualización

// Lista de archivos fundamentales de la app para guardar en caché
// ¡RUTAS RELATIVAS ACTUALIZADAS!
const assetsToCache = [
    '.',
    'index.html',
    'manifest.json'
    // Los recursos externos (Tailwind, Google Fonts) se cachearán dinámicamente
    // la primera vez que se soliciten.
];

// Evento 'install': Se dispara cuando el Service Worker se instala
self.addEventListener('install', event => {
    // Espera hasta que el caché se abra y todos los assets fundamentales se añadan
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto. Añadiendo assets fundamentales.');
                return cache.addAll(assetsToCache);
            })
            .catch(err => {
                console.error('Fallo al cachear assets durante la instalación:', err);
            })
    );
});

// Evento 'fetch': Se dispara cada vez que la app pide un recurso (CSS, JS, imagen, etc.)
self.addEventListener('fetch', event => {
    // Ignorar peticiones que no sean GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        // 1. Intenta encontrar el recurso en el caché
        caches.match(event.request)
            .then(response => {
                // Si el recurso está en caché, lo devuelve
                if (response) {
                    return response;
                }

                // 2. Si no está en caché, lo busca en la red
                return fetch(event.request).then(
                    networkResponse => {
                        // 3. Y si la respuesta de red es válida, la guarda en caché para el futuro
                        // Comprobamos que es una respuesta válida y no de un CDN de terceros (opaco)
                        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                            return networkResponse; // Devuelve la respuesta aunque no sea válida, sin cachearla
                        }

                        // Clona la respuesta porque se va a consumir
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                );
            })
            .catch(err => {
                // Manejo de error si falla tanto el caché como la red
                console.error('Error en el fetch del Service Worker:', err);
                // Podrías devolver una página offline.html personalizada aquí si la tuvieras
            })
    );
});

// Evento 'activate': Se usa para limpiar cachés antiguos si la versión cambia
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Si el nombre del caché no está en nuestra "lista blanca", se borra
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Borrando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
