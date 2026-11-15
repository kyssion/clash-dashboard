// This file intentionally replaces the old dashboard PWA service worker.
// It removes cached assets and unregisters itself, so the browser always
// loads the dashboard embedded in the running clash binary.
self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
        await self.registration.unregister()
    })())
})
