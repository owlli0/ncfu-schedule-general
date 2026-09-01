const CACHE_NAME = 'skfu-schedule-v15';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Установка: кэшируем оболочку приложения
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Активация: удаляем старые версии кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Сетевые запросы к воркеру/API не блокируем (у них свой localStorage-кэш)
  if (url.href.includes('workers.dev') || url.href.includes('ecampus.ncfu.ru')) {
    return;
  }

  // Для остальных файлов отдаем из кэша, если нет — загружаем из сети
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
