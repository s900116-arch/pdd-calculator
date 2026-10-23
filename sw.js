const CACHE_NAME = 'pdd-calc-v2';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon.png'
];

// 安裝新版：強制立即接管
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 啟動：清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求：網路優先，API 直通
self.addEventListener('fetch', event => {
  // 1. 忽略所有外部 API 請求，讓瀏覽器自己抓匯率
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // 2. 本地檔案採用「網路優先，無網路才用快取」
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
