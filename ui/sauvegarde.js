// ÉCRAN SAUVEGARDE — la seule chose qui protège les données si le téléphone
// est perdu ou l'application désinstallée.

import { html, message } from "./base.js";
import { etatSauvegarde, telechargerSauvegarde, marquerSauvegarde } from "../stockage/depot.js";
import { resumeSauvegarde } from "../modele/donnees.js";
import { VERSION } from "../version.js";

let retour = null;

export function rendreSauvegarde(contexte) {
  const { etat } = contexte;
  const bilan = etatSauvegarde(etat, new Date().toISOString());
  const resume = resumeSauvegarde(etat);

  return `
    ${retour ? message(retour.type, retour.texte, retour.details) : ""}
    ${bilan.necessaire ? message("attention", bilan.message + " Il est temps d'en faire une.") : ""}

    <div class="carte">
      <h2>Sauvegarder</h2>
      <p class="aide">
        Un fichier JSON qui contient tout. Range-le dans tes Fichiers ou envoie-le-toi
        par mail. ${html(bilan.message)}
      </p>
      <div class="progres-ligne"><span>Sorties course</span><span class="valeur">${resume.courses}</span></div>
      <div class="progres-ligne"><span>Séances de salle</span><span class="valeur">${resume.salles}</span></div>
      <div class="progres-ligne"><span>Check-ins</span><span class="valeur">${resume.checkins}</span></div>
      <button class="bouton" id="exporter" style="margin-top:12px">Télécharger la sauvegarde</button>
    </div>

    <div class="carte">
      <h2>Restaurer</h2>
      <p class="aide">
        Remplace <strong>toutes</strong> les données actuelles par le contenu du fichier.
        À n'utiliser que sur un téléphone neuf ou après une perte.
      </p>
      <input type="file" id="fichier-restauration" accept=".json,application/json">
    </div>

    <div class="carte">
      <h2>État de l'application</h2>
      <div class="progres-ligne"><span>Version</span><span class="valeur">${html(VERSION)}</span></div>
      <div class="progres-ligne"><span>Mode hors ligne</span>
        <span class="valeur" id="etat-hors-ligne">vérification…</span></div>
      <div class="progres-ligne"><span>Installée sur l'écran d'accueil</span>
        <span class="valeur">${estInstallee() ? "oui" : "non"}</span></div>
      ${estInstallee()
        ? ""
        : `<p class="motif-refus" style="margin-top:10px">
             Tant que l'application n'est pas ajoutée à l'écran d'accueil, iOS efface ses
             données au bout de 7 jours sans visite. Partage → Sur l'écran d'accueil.
           </p>`}
    </div>`;
}

function estInstallee() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function brancherSauvegarde(racine, contexte, rafraichir) {
  racine.querySelector("#exporter")?.addEventListener("click", () => {
    try {
      const marque = telechargerSauvegarde(contexte.etat);
      contexte.enregistrer(marquerSauvegarde(contexte.etat, marque.meta.derniereSauvegarde));
      retour = { type: "succes", texte: "Sauvegarde téléchargée." };
    } catch (e) {
      retour = { type: "erreur", texte: e.message };
    }
    rafraichir();
  });

  const fichier = racine.querySelector("#fichier-restauration");
  fichier?.addEventListener("change", async () => {
    const f = fichier.files[0];
    if (!f) return;
    if (!confirm("Remplacer toutes les données actuelles par ce fichier ?")) {
      fichier.value = "";
      return;
    }
    try {
      const etat = contexte.remplacer(await f.text());
      retour = {
        type: "succes",
        texte: "Données restaurées.",
        details: [
          `${etat.seancesCourse.length} sorties`,
          `${etat.seancesSalle.length} séances de salle`,
          `${etat.checkins.length} check-ins`,
        ],
      };
    } catch (e) {
      retour = { type: "erreur", texte: e.message };
    }
    rafraichir();
  });

  const indicateur = racine.querySelector("#etat-hors-ligne");
  if (indicateur) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => { indicateur.textContent = "actif"; })
        .catch(() => { indicateur.textContent = "indisponible"; });
    } else {
      indicateur.textContent = "non supporté";
    }
  }
}
