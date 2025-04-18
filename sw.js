self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('olaris-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/css/tailwind.css',
        '/static/js/react.min.js',
        '/static/js/react-dom.min.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});