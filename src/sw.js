const version = "v3.0.4";

self.addEventListener("install", (event) => {
	self.skipWaiting();
	event.waitUntil(
		caches
			.open(version)
			.then((cache) =>
				cache.addAll([
					"keyframes.css",
					"index.ts",
					"card.jpg",
					"96.png",
					"192.png",
					"512.png",
					"logo.svg",
					"mask.svg",
					"/",
					"/:lang",
				])
			)
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((key) => key !== version).map((key) => caches.delete(key))
				)
			)
			.then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", function (event) {
	if (!isCacheableRequest(event.request)) return;
	event.respondWith(cacheOrNetwork(event.request));
	event.waitUntil(updateCache(event.request).catch(() => undefined));
});

function isCacheableRequest(request) {
	if (request.method !== "GET") return false;

	const url = new URL(request.url);
	return url.origin === self.location.origin;
}

function fromNetwork(request) {
	return fetch(request);
}

function cacheOrNetwork(request) {
	return fromCache(request).catch(() => fromNetwork(request));
}

function fromCache(request) {
	return caches
		.open(version)
		.then((cache) =>
			cache
				.match(request)
				.then((matching) => matching || Promise.reject(request))
		);
}

function updateCache(request) {
	if (!isCacheableRequest(request)) return Promise.resolve();

	return caches.open(version).then((cache) =>
		fetch(request).then((response) => {
			if (!response || !response.ok) return response;
			return cache.put(request, response.clone()).then(() => response);
		})
	);
}
