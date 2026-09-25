/*
 * Rehearse service worker: makes the app installable and usable offline.
 * - App files (/_next/static, fonts, images, animations) are cached the first time they load.
 * - Pages load from the network, and from the cache when offline.
 * - /api is never cached: answers and AI calls always go to the network.
 * Nothing here sends data anywhere.
 */
// Bump to throw away every cached file. v2: v1 kept copies of scripts without the
// cross-origin headers, which made Chrome block the voice worker.
const VERSION = "rehearse-v2";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const OFFLINE = "/offline";
const WARM = ["/", "/offline", "/practice/new", "/prepare", "/prepare/packs", "/calm", "/remember", "/archive", "/me"];

/*
 * Pages for one practice round, saved answer or session (/practice/<id>) all share one
 * shell; the id inside it is swapped, so rounds started offline still open.
 */
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function shellKey(path) {
  const m = path.match(UUID);
  return m ? { key: path.replace(UUID, ":id"), id: m[0] } : null;
}

async function saveShell(cache, path, res) {
  const shell = shellKey(path);
  if (!shell) return;
  const headers = new Headers(res.headers);
  headers.set("x-shell-id", shell.id);
  await cache.put(shell.key, new Response(await res.blob(), { status: 200, headers }));
}

async function fromShell(cache, path) {
  const shell = shellKey(path);
  if (!shell) return undefined;
  const hit = await cache.match(shell.key);
  const oldId = hit && hit.headers.get("x-shell-id");
  if (!hit || !oldId) return undefined;
  const html = (await hit.text()).split(oldId).join(shell.id);
  return new Response(html, { status: 200, headers: hit.headers });
}

async function cacheWithAssets(cache, url) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return;
  await cache.put(url, res.clone());
  // Also keep the scripts and styles the page needs, so it looks right offline.
  const html = await res.text();
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
  const assetCache = await caches.open(ASSETS);
  await Promise.all(assets.map((a) => assetCache.add(a).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => Promise.all(WARM.map((url) => cacheWithAssets(cache, url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/*
 * The page is cross-origin isolated (for the on-device voice), so Chrome only runs scripts,
 * workers included, that carry matching headers. Add them to anything served from here.
 */
function isolated(res) {
  if (!res || res.type !== "basic" || res.headers.get("Cross-Origin-Embedder-Policy")) return res;
  const headers = new Headers(res.headers);
  headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function isAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/lottie/") ||
    /\.(woff2?|png|svg|ico|json)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // In-app navigation data: fail fast offline so the browser falls back to a full page load.
  if (req.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (isAsset(url)) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return isolated(hit);
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return isolated(res);
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES);
        try {
          const res = await fetch(req);
          if (res.ok) {
            if (shellKey(url.pathname)) saveShell(cache, url.pathname, res.clone());
            else cache.put(url.pathname, res.clone());
          }
          return res;
        } catch {
          return isolated(
            (await cache.match(url.pathname)) ||
              (await fromShell(cache, url.pathname)) ||
              (await cache.match(OFFLINE)) ||
              Response.error(),
          );
        }
      })(),
    );
  }
});
