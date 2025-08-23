// @ts-nocheck

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  clients.claim();
});

self.addEventListener("fetch", () => {
  // No-op, but needed so Chrome knows SW is active
});
