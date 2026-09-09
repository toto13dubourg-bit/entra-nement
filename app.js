const VERSION = "0.1.0";

const lignes = [];

function ajouter(libelle, etat, detail) {
  lignes.push({ libelle, etat, detail });
  rendre();
}

function rendre() {
  const symboles = { ok: "✓", ko: "✗", attente: "…" };
  document.getElementById("diagnostic").innerHTML = lignes
    .map(
      (l) =>
        `<li><span class="pastille ${l.etat}">${symboles[l.etat]}</span><span>${l.libelle}` +
        (l.detail ? `<span class="detail">${l.detail}</span>` : "") +
        `</span></li>`
    )
    .join("");
}

document.getElementById("version").textContent = VERSION;

const installee =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

ajouter(
  installee ? "Ouverte depuis l'écran d'accueil" : "Ouverte dans le navigateur",
  installee ? "ok" : "attente",
  installee
    ? "Le stockage est protégé de l'effacement automatique d'iOS."
    : "Partage → Sur l'écran d'accueil, puis rouvre par l'icône."
);

ajouter(
  location.protocol === "https:" || location.hostname === "localhost"
    ? "Connexion sécurisée"
    : "Connexion non sécurisée",
  location.protocol === "https:" || location.hostname === "localhost" ? "ok" : "ko",
  location.origin
);

let memoOk = false;
try {
  localStorage.setItem("__test__", "1");
  localStorage.removeItem("__test__");
  memoOk = true;
} catch (e) {
  memoOk = false;
}
ajouter(
  memoOk ? "Stockage local accessible" : "Stockage local bloqué",
  memoOk ? "ok" : "ko",
  memoOk ? null : "Navigation privée ? Le stockage y est désactivé."
);

if ("serviceWorker" in navigator) {
  ajouter("Mode hors ligne", "attente", "Installation en cours…");
  const ligne = lignes[lignes.length - 1];
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      ligne.etat = "ok";
      ligne.libelle = "Mode hors ligne actif";
      ligne.detail = "Coupe le wifi et les données, puis recharge : la page doit s'afficher.";
      rendre();
    })
    .catch((e) => {
      ligne.etat = "ko";
      ligne.libelle = "Mode hors ligne indisponible";
      ligne.detail = String(e.message || e);
      rendre();
    });
} else {
  ajouter("Mode hors ligne indisponible", "ko", "Service worker non supporté par ce navigateur.");
}

const memo = document.getElementById("memo");
const memoEtat = document.getElementById("memo-etat");

if (memoOk) {
  memo.value = localStorage.getItem("memo") || "";
  memoEtat.textContent = memo.value
    ? "Texte retrouvé au démarrage : la persistance fonctionne."
    : "Rien en mémoire pour l'instant.";
  memo.addEventListener("input", () => {
    localStorage.setItem("memo", memo.value);
    memoEtat.textContent = "Enregistré.";
  });
} else {
  memo.disabled = true;
  memoEtat.textContent = "Stockage indisponible.";
}
