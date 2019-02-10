const cacheName = 'v1';
const cacheFiles = [
  './',
  './index.html',
  './assets/css/style.css',
  './app.js',
  './eventList.json',
  './assets/img/cartoon.png',
  './assets/img/oops.png',
];

self.addEventListener('install', function(event) {
  console.log('[sw] installed');
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[sw] caching files');
      return cache.addAll(cacheFiles);
    })
  );
});

self.addEventListener('activate', function(event){
  console.log('[sw] activated');
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(cacheNames.map(function (thisCacheName) {
        if (thisCacheName !== cacheName) {
          console.log('[sw] removing cached files');
          return caches.delete(thisCacheName);
        }
      }))
    })
  )
});

self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    // caches.match() always resolves
    // but in case of success response will have value
    if (response !== undefined) {
      console.log("[ServiceWorker] Found in Cache", event.request.url, response);
      return response;
    } else {
      return fetch(event.request).then(function (response) {
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
        const responseClone = response.clone();

        caches.open(cacheName).then(function (cache) {
          cache.put(event.request, responseClone);
          console.log('[ServiceWorker] New Data Cached', event.request.url);
        });
        return response;
      }).catch(function () {
        return caches.match('/assets/img/oops.png');
      });
    }
  }));
});
