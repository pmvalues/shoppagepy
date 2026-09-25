// Shoppage Merchant service worker: keeps the app shell available offline.
// Static assets are cache-first; pages are network-first with an offline
// fallback. Writes (POST) are never cached or replayed here — the counter
// sale screen queues offline sales itself and syncs them on reconnect.
const CACHE = "shoppage-merchant-v1";
const SHELL = ["/merchant-static/css/workspace.css", "/merchant-static/js/workspace.js", "/merchant-static/js/htmx.min.js", "/merchant-static/offline.html"];
// Only workspace pages get the offline fallback; when mounted behind the
// consumer gateway this worker must not intercept shopper pages.
const WORKSPACE = ["/desk", "/tab/", "/catalog", "/orders", "/inventory", "/customers", "/pos", "/settings"];

self.addEventListener("install", (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
	e.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", (e) => {
	const req = e.request;
	if (req.method !== "GET") return;
	const url = new URL(req.url);
	if (url.origin !== location.origin) return;
	if (url.pathname.startsWith("/merchant-static/")) {
		e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
			const copy = res.clone();
			caches.open(CACHE).then((c) => c.put(req, copy));
			return res;
		})));
		return;
	}
	if (req.mode === "navigate" && WORKSPACE.some((p) => url.pathname === p || url.pathname.startsWith(p))) {
		e.respondWith(fetch(req).catch(() => caches.match("/merchant-static/offline.html")));
	}
});
