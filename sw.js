const CACHE = "entrainement-1.1.0";

const FICHIERS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./version.js",
  "./manifest.webmanifest",
  "./icones/icone-180.png",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
  "./config/calendrier.js",
  "./config/catalogue-exercices.js",
  "./config/donnees-initiales.js",
  "./config/physiologie.js",
  "./config/programme.js",
  "./config/schemas.js",
  "./modele/donnees.js",
  "./moteur/application.js",
  "./moteur/phases.js",
  "./moteur/planning.js",
  "./moteur/progression.js",
  "./parseurs/coros.js",
  "./parseurs/hevy.js",
  "./stockage/depot.js",
  "./export/coach.js",
  "./ui/base.js",
  "./ui/checkin.js",
  "./ui/coach.js",
  "./ui/import.js",
  "./ui/progres.js",
  "./ui/schema.js",
  "./ui/sauvegarde.js",
  "./ui/semaine.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Le réseau d'abord, le cache en secours : en salle, le réseau est mauvais
// mais l'application doit rester à jour dès qu'il revient.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copie));
        return reponse;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
