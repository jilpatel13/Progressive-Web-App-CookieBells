const staticCache = 'site-static-v18';
const dynamicCache = 'site-dynamic-v20';

const assets = [
    '/',
    '/css/styles.css',
    '/index.html',
    '/img/dish.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    '/js/app.js',
    '/js/ui.js',
    '/js/materialize.min.js',
    '/css/materialize.min.css',
    'https://fonts.gstatic.com/s/materialicons/v55/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
    'pages/fallback.html',
    'pages/about.html'
]

const limitCacheSize = (name, size) => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        if(keys.length > size){
          cache.delete(keys[0]).then(limitCacheSize(name, size));
        }
      });
    });
};
  
//install sw
self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(staticCache).then(cache => {
        cache.addAll(assets);
    }))
});

//activate sw
self.addEventListener('activate', evt => {
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== staticCache && key !== dynamicCache)
                .map(key => caches.delete(key))
            )
        })
    );
});

//fetch event
self.addEventListener('fetch', evt => {
    if (evt.request.url.indexOf('firestore.googleapis.com') === -1) {
        evt.respondWith(
            caches.match(evt.request).then(cacheRes => {
                return cacheRes || fetch(evt.request).then(fetchRes => {
                    return caches.open(dynamicCache).then(cache => {
                        cache.put(evt.request.url, fetchRes.clone());
                        limitCacheSize(dynamicCache, 5);
                        return fetchRes;
                    })
                });
            }).catch(() => {
                if (evt.request.url.indexOf('.html') > -1) {
                    return caches.match('/pages/fallback.html')
                }
            }
            )
        );
    }
});
