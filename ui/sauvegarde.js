// ÉCRAN SAUVEGARDE — la seule chose qui protège les données si le téléphone
// est perdu ou l'application désinstallée.

import { html, message, copierDansPressePapier } from "./base.js";
import { etatSauvegarde, telechargerSauvegarde, marquerSauvegarde } from "../stockage/depot.js";
import { resumeSauvegarde, exporterJson } from "../modele/donnees.js";
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
      <details style="margin-top:10px">
        <summary>Le téléchargement n'a rien fait ?</summary>
        <p class="aide" style="margin-top:8px">
          iOS bloque parfois les téléchargements depuis une application installée.
          Dans ce cas, copie le texte ci-dessous et colle-le dans une note ou un mail
          que tu t'envoies : c'est exactement le même contenu, et il se restaure pareil.
        </p>
        <button class="bouton secondaire" id="copier-sauvegarde">Copier le texte de la sauvegarde</button>
        <textarea id="texte-sauvegarde" readonly rows="6" style="margin-top:10px"></textarea>
      </details>
    </div>

    <div class="carte">
      <h2>Restaurer</h2>
      <p class="aide">
        Remplace <strong>toutes</strong> les données actuelles par le contenu du fichier.
        À n'utiliser que sur un téléphone neuf ou après une perte.
      </p>
      <input type="file" id="fichier-restauration" accept=".json,application/json">
      <details style="margin-top:10px">
        <summary>Restaurer depuis un texte collé</summary>
        <p class="aide" style="margin-top:8px">
          Si ta sauvegarde est dans une note plutôt que dans un fichier, colle-la ici.
        </p>
        <textarea id="texte-restauration" rows="5" placeholder='{ "format": "entrainement", ... }'></textarea>
        <button class="bouton secondaire" id="restaurer-texte" style="margin-top:10px">
          Restaurer depuis ce texte
        </button>
      </details>
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

function appliquerRestauration(contexte, texte) {
  try {
    const etat = contexte.remplacer(texte);
    return {
      type: "succes",
      texte: "Données restaurées.",
      details: [
        `${etat.seancesCourse.length} sorties`,
        `${etat.seancesSalle.length} séances de salle`,
        `${etat.checkins.length} check-ins`,
      ],
    };
  } catch (e) {
    return { type: "erreur", texte: e.message };
  }
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

  // Porte de secours : le même contenu, en texte, quand iOS refuse le fichier.
  const zone = racine.querySelector("#texte-sauvegarde");
  if (zone) zone.value = exporterJson(contexte.etat);

  racine.querySelector("#copier-sauvegarde")?.addEventListener("click", async () => {
    const texte = exporterJson(contexte.etat);
    if (await copierDansPressePapier(texte)) {
      contexte.enregistrer(marquerSauvegarde(contexte.etat, new Date().toISOString()));
      retour = { type: "succes", texte: "Sauvegarde copiée. Colle-la dans une note ou un mail." };
    } else {
      retour = {
        type: "attention",
        texte: "Copie automatique refusée. Sélectionne le texte à la main dans le cadre ci-dessous.",
      };
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
    retour = appliquerRestauration(contexte, await f.text());
    rafraichir();
  });

  racine.querySelector("#restaurer-texte")?.addEventListener("click", () => {
    const texte = racine.querySelector("#texte-restauration").value.trim();
    if (!texte) {
      retour = { type: "erreur", texte: "Colle d'abord le contenu de ta sauvegarde." };
      rafraichir();
      return;
    }
    if (!confirm("Remplacer toutes les données actuelles par ce texte ?")) return;
    retour = appliquerRestauration(contexte, texte);
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
