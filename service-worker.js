const CACHE_NAME = 'stamp-collection-v1';  
const ASSETS = [  
  './',  
  './index.html',  
  './styles.css',  
  './script.js',  
  './manifest.webmanifest',  
  './data/stamps.json',  
  './icons/favicon.png'  
];  
  
self.addEventListener('install', (evt) => {  
  evt.waitUntil(  
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{})  
  );  
});  
  
self.addEventListener('activate', (evt) => {  
  evt.waitUntil(  
    caches.keys().then(keys =>  
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))  
    )  
  );  
});  
  
self.addEventListener('fetch', (evt) => {  
  const url = new URL(evt.request.url);  
  // Network-first for data and images, cache-first for app shell  
  if (url.pathname.includes('/data/') || url.pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {  
    evt.respondWith(  
      fetch(evt.request).then(r => {  
        const copy = r.clone();  
        caches.open(CACHE_NAME).then(c => c.put(evt.request, copy));  
        return r;  
      }).catch(() => caches.match(evt.request))  
    );  
  } else {  
    evt.respondWith(  
      caches.match(evt.request).then(cached => cached || fetch(evt.request))  
    );  
  }  
});  