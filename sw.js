// Eigene Dateien: Netz zuerst (Cache nur für offline). Fremde (Schriften): Cache zuerst.
const CACHE = 'flipper';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png', './schaedel.png', './start.jpg', './schleuder.png', './flipper.png', './rampe.png', './kopf.jpg', './zeiger_h.png', './zeiger_m.png', './zeiger_n.png', './strudel.png',
  // 0.93: Echt-Ansicht (Standard) offline: Bild der Schleuder-Kunststoffe, three.js und Nachbearbeitung
  './bilder/eingang/schleuder_v1.png', './lib/three.module.min.js', './lib/jsm/postprocessing/EffectComposer.js', './lib/jsm/postprocessing/RenderPass.js',
  './lib/jsm/postprocessing/UnrealBloomPass.js', './lib/jsm/postprocessing/OutputPass.js', './lib/jsm/postprocessing/Pass.js', './lib/jsm/postprocessing/ShaderPass.js',
  './lib/jsm/postprocessing/MaskPass.js', './lib/jsm/shaders/CopyShader.js', './lib/jsm/shaders/LuminosityHighPassShader.js', './lib/jsm/shaders/OutputShader.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const eigen = new URL(req.url).origin === self.location.origin;
  if (eigen) {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
