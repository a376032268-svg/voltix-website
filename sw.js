const CACHE_NAME = 'voltix-v1.5.0';
const VERSION = '1.5.0';

// 预缓存的核心文件
const urlsToCache = [
  '/',
  '/index.html',
  '/products.html',
  '/about.html',
  '/partnership.html',
  '/contact.html',
  '/profile.html',
  '/login.html',
  '/changelog.html',
  '/admin.html',
  '/style.css',
  '/admin.js',
  '/nav-user.js',
  '/logo.svg'
];

// 安装时预缓存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 拦截请求：Cache First（缓存优先，后台更新）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 无论是否命中缓存，都去网络拉取最新版并更新缓存
      const fetchPromise = fetch(event.request).then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, fetchResponse.clone()));
        }
        return fetchResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});

// 激活时删除旧缓存，通知所有页面
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // 删除旧版本缓存
      const deletePromises = cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();  // 相等时返回 resolved Promise
      });
      return Promise.all(deletePromises)
        .then(() => self.clients.claim())
        .then(() => {
          // 通知所有已打开的页面：新版本已激活
          return self.clients.matchAll({ type: 'window' }).then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'NEW_VERSION_READY', version: VERSION });
            });
          });
        });
    })
  );
});

// 监听来自页面的消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
