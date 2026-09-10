// Petits outils partagés par les écrans. Rien de plus qu'il n'en faut.

export function html(chaine) {
  return String(chaine ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export function aujourdhui() {
  const d = new Date();
  const d2 = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${d2(d.getMonth() + 1)}-${d2(d.getDate())}`;
}

export function maintenant() {
  const d = new Date();
  const d2 = (n) => String(n).padStart(2, "0");
  return `${aujourdhui()}T${d2(d.getHours())}:${d2(d.getMinutes())}`;
}

export function jourCourt(iso) {
  const [a, m, j] = iso.slice(0, 10).split("-");
  return `${j}/${m}`;
}

export function decalerJours(iso, nombre) {
  const d = new Date(iso.slice(0, 10) + "T12:00:00Z");
  return new Date(d.getTime() + nombre * 86400000).toISOString().slice(0, 10);
}

export function duree(secondes) {
  if (secondes === null || secondes === undefined) return "—";
  const s = Math.round(secondes);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const d2 = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${d2(m)}:${d2(r)}` : `${m}:${d2(r)}`;
}

export function message(type, texte, details) {
  const liste = details && details.length
    ? `<ul>${details.map((d) => `<li>${html(d)}</li>`).join("")}</ul>`
    : "";
  return `<div class="message ${type}">${html(texte)}${liste}</div>`;
}

// Sélecteur de note de 1 à 5, pensé pour le pouce.
export function compteur(nom, valeur, min = 1, max = 5) {
  const boutons = [];
  for (let i = min; i <= max; i++) {
    boutons.push(
      `<button type="button" data-compteur="${html(nom)}" data-valeur="${i}"` +
        `${Number(valeur) === i ? ' class="choisi"' : ""}>${i}</button>`
    );
  }
  return `<div class="compteur">${boutons.join("")}</div>`;
}

// Branche les compteurs d'un écran : ils écrivent dans un champ caché.
export function brancherCompteurs(racine, surChangement) {
  racine.querySelectorAll("[data-compteur]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const nom = bouton.dataset.compteur;
      racine
        .querySelectorAll(`[data-compteur="${nom}"]`)
        .forEach((b) => b.classList.remove("choisi"));
      bouton.classList.add("choisi");
      surChangement(nom, Number(bouton.dataset.valeur));
    });
  });
}

export async function copierDansPressePapier(texte) {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch (e) {
    // Safari refuse hors geste utilisateur direct : on retombe sur la
    // sélection manuelle, que l'appelant proposera.
    return false;
  }
}
