// ÉCRAN EXPORT COACH — le texte à coller dans une conversation avec Claude.

import { html, message, copierDansPressePapier, jourCourt } from "./base.js";
import { exportCoach } from "../export/coach.js";

let retour = null;

export function rendreCoach(contexte) {
  const texte = exportCoach(contexte.etat, contexte.jour, contexte.aujourdhui);
  const envois = contexte.etat.exportsCoach || [];

  return `
    ${retour ? message(retour.type, retour.texte) : ""}
    <div class="carte">
      <h2>Export coach</h2>
      <p class="aide">
        Des faits, des écarts constatés et les questions non tranchées. Aucun conseil :
        c'est la conversation qui décide.
      </p>
      <button class="bouton" id="copier">Copier le texte</button>
    </div>

    <div class="carte">
      <h2>Aperçu</h2>
      <pre class="texte-export" id="apercu">${html(texte)}</pre>
    </div>

    ${envois.length
      ? `<div class="carte">
          <h2>Déjà envoyé</h2>
          <p class="aide">Pour ne pas renvoyer deux fois la même semaine.</p>
          ${envois.slice(-8).reverse().map((e) =>
            `<div class="progres-ligne">
               <span>Semaine du ${jourCourt(e.semaine)}</span>
               <span class="mode">envoyé le ${jourCourt(e.envoyeLe)}</span>
             </div>`).join("")}
        </div>`
      : ""}`;
}

export function brancherCoach(racine, contexte, rafraichir) {
  racine.querySelector("#copier")?.addEventListener("click", async () => {
    const texte = racine.querySelector("#apercu").textContent;
    const copie = await copierDansPressePapier(texte);

    if (copie) {
      const envois = [
        ...(contexte.etat.exportsCoach || []).filter((e) => e.semaine !== contexte.jour.slice(0, 10)),
        { semaine: contexte.jour.slice(0, 10), envoyeLe: new Date().toISOString().slice(0, 10) },
      ];
      contexte.enregistrer({ ...contexte.etat, exportsCoach: envois });
      retour = { type: "succes", texte: "Copié. Colle-le dans ta conversation avec Claude." };
    } else {
      retour = {
        type: "attention",
        texte: "Safari a refusé la copie automatique. Sélectionne le texte ci-dessous à la main.",
      };
    }
    rafraichir();
  });
}
