// Point d'entrée : charge l'état, affiche l'écran demandé, gère la navigation.

import { creerDepot, etatSauvegarde } from "./stockage/depot.js";
import { phaseDu, prochaineCourse } from "./moteur/phases.js";
import { html, aujourdhui, jourCourt, message } from "./ui/base.js";
import { rendreSemaine, brancherSemaine } from "./ui/semaine.js";
import { rendreImport, brancherImport, reinitialiserImport } from "./ui/import.js";
import { rendreCheckin, brancherCheckin } from "./ui/checkin.js";
import { rendreProgres } from "./ui/progres.js";
import { rendreSauvegarde, brancherSauvegarde } from "./ui/sauvegarde.js";
import { rendreCoach, brancherCoach } from "./ui/coach.js";
import { VERSION } from "./version.js";

const ECRANS = {
  semaine: { titre: "Ma semaine", rendre: rendreSemaine, brancher: brancherSemaine },
  import: { titre: "Importer", rendre: rendreImport, brancher: brancherImport },
  checkin: { titre: "Check-in", rendre: rendreCheckin, brancher: brancherCheckin },
  progres: { titre: "Progrès", rendre: rendreProgres, brancher: null },
  sauvegarde: { titre: "Sauvegarde", rendre: rendreSauvegarde, brancher: brancherSauvegarde },
  coach: { titre: "Export coach", rendre: rendreCoach, brancher: brancherCoach },
};

const entete = document.getElementById("entete");
const ecran = document.getElementById("ecran");

let depot;
let contexte;

function demarrer() {
  try {
    depot = creerDepot(window.localStorage);
    contexte = {
      etat: depot.charger(),
      jour: aujourdhui(),
      aujourdhui: aujourdhui(),
      enregistrer(nouvel) {
        contexte.etat = depot.enregistrer(nouvel);
      },
      remplacer(texte) {
        contexte.etat = depot.remplacer(texte);
        return contexte.etat;
      },
    };
  } catch (e) {
    entete.innerHTML = `<h1>Entraînement</h1>`;
    ecran.innerHTML = message("erreur", e.message);
    return;
  }

  window.addEventListener("hashchange", () => {
    reinitialiserImport();
    afficher();
  });
  afficher();
}

function nomEcran() {
  const nom = location.hash.replace("#", "") || "semaine";
  return ECRANS[nom] ? nom : "semaine";
}

function afficher() {
  const nom = nomEcran();
  const vue = ECRANS[nom];

  entete.innerHTML = enteteHtml(vue.titre);
  ecran.innerHTML = vue.rendre(contexte);

  document.querySelectorAll("#navigation a").forEach((lien) => {
    lien.classList.toggle("actif", lien.getAttribute("href") === `#${nom}`);
  });

  if (vue.brancher) vue.brancher(ecran, contexte, afficher);
  window.scrollTo(0, 0);
}

function enteteHtml(titre) {
  const phase = phaseDu(contexte.aujourdhui);
  const suivante = prochaineCourse(contexte.aujourdhui);
  const bilan = etatSauvegarde(contexte.etat, new Date().toISOString());

  const morceaux = [];
  if (phase) morceaux.push(html(phase.nom));
  if (suivante) {
    morceaux.push(
      `<span class="compte-a-rebours">J−${suivante.joursRestants}</span> ` +
        `${html(suivante.course.nom)} (${jourCourt(suivante.course.date)})`
    );
  }
  if (bilan.necessaire) morceaux.push(`<a href="#sauvegarde" style="color:var(--alerte)">sauvegarde à faire</a>`);

  return `<h1>${html(titre)}</h1>
    <p class="contexte">${morceaux.join(" · ")}</p>`;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // Le mode hors ligne est un confort : son absence ne bloque pas l'application.
  });
}

console.log(`Entraînement ${VERSION}`);
demarrer();
