// ÉCRAN PROGRÈS — chaque chiffre affiché répond à une décision à prendre.
// Rien de décoratif : ni courbe, ni jauge, ni score inventé.

import { html, jourCourt, duree } from "./base.js";
import { parId } from "../config/catalogue-exercices.js";
import { efficienceAerobie, deriveCardiaque, tempsArretS } from "../parseurs/coros.js";
import { stagnation } from "../moteur/progression.js";
import { cranConnu } from "../moteur/phases.js";
import { desequilibres, jamaisFaits } from "../moteur/volume.js";
import { aujourdhui } from "./base.js";
import { semaineDe } from "../export/coach.js";

export function rendreProgres(contexte) {
  const { etat } = contexte;
  return `
    ${chargesEnCours(etat)}
    ${equilibreDuVolume(etat)}
    ${exercicesJamaisFaits(etat)}
    ${volumeHebdomadaire(etat)}
    ${efficienceParType(etat)}`;
}

// ------------------------------------------- Équilibre entre groupes

function equilibreDuVolume(etat) {
  if (!etat.seancesSalle.length) return "";
  const bilan = desequilibres(etat, aujourdhui());

  return `<div class="carte">
    <h2>Équilibre du volume</h2>
    <p class="aide">
      Séries de travail par groupe musculaire sur ${bilan.semaines} semaines,
      comparées à ce que le programme prescrit. Les séries d'échauffement ne comptent pas.
    </p>
    <table class="donnees">
      <tr><th>Groupe</th><th>Fait</th><th>Prescrit</th><th>Part</th></tr>
      ${bilan.ecarts.map((e) => `<tr>
        <td>${html(e.nom)}</td>
        <td>${e.fait}</td>
        <td>${e.attendu}</td>
        <td${e.sousLeSeuil ? ' style="color:var(--alerte);font-weight:700"' : ""}>
          ${Math.round(e.ratio * 100)} %
        </td>
      </tr>`).join("")}
    </table>
    ${bilan.ecarts.some((e) => e.sousLeSeuil)
      ? `<p class="motif-refus" style="margin-top:10px">
           ${bilan.ecarts.filter((e) => e.sousLeSeuil).map((e) => html(e.nom)).join(", ")} :
           moins de la moitié du volume prescrit sur la période.
         </p>`
      : ""}
  </div>`;
}

// ------------------------------------------ Exercices jamais réalisés

function exercicesJamaisFaits(etat) {
  if (!etat.seancesSalle.length) return "";
  const manquants = jamaisFaits(etat);
  if (!manquants.length) return "";

  return `<div class="carte">
    <h2>Prescrits, jamais faits</h2>
    <p class="aide">
      Ces exercices figurent au programme et n'ont jamais été enregistrés.
      Ce n'est pas forcément un oubli : un exercice qu'on évite est une information.
    </p>
    ${manquants.map((m) => `<div class="progres-ligne">
      <span>${html(m.nom)}</span>
      <span class="mode">séance ${html(m.seance)}</span>
    </div>`).join("")}
  </div>`;
}

// -------------------------------------------------------------- Charges

function chargesEnCours(etat) {
  const suivis = Object.values(etat.progression).filter((p) => p.chargeKg !== null);

  if (!suivis.length) {
    return `<div class="carte">
      <h2>Charges</h2>
      <p class="vide">Aucune charge suivie pour l'instant. Importe une séance de salle.</p>
    </div>`;
  }

  const bloques = suivis.filter((p) => !cranConnu(p.exerciceId));

  return `<div class="carte">
    <h2>Charges en cours</h2>
    <p class="aide">Ce que l'application proposera à la prochaine séance.</p>
    ${suivis.map((p) => {
      const fiche = parId[p.exerciceId];
      const arret = stagnation(p, aujourdhui());
      return `<div class="progres-ligne">
        <span>${html(fiche ? fiche.nom : p.exerciceId)}
          ${arret ? `<span class="note">${html(arret.message)}</span>` : ""}
        </span>
        <span>
          <span class="valeur">${p.chargeKg} kg</span>
          <span class="mode">${p.mode === "DOUBLE" ? "double progression" : "linéaire"}</span>
        </span>
      </div>`;
    }).join("")}
    ${bloques.length
      ? `<p class="motif-refus" style="margin-top:10px">
          ${bloques.length} exercice(s) sans cran de machine relevé : aucune progression ne sera proposée dessus.
         </p>`
      : ""}
  </div>`;
}

// ------------------------------------------------------ Charge de course

function volumeHebdomadaire(etat) {
  if (!etat.seancesCourse.length) return "";

  const parSemaine = new Map();
  for (const s of etat.seancesCourse) {
    const lundi = semaineDe(s.date)[0];
    const cumul = parSemaine.get(lundi) || { km: 0, tempsS: 0, dPlus: 0, seances: 0 };
    cumul.km += s.resume.distanceKm || 0;
    cumul.tempsS += s.resume.tempsS || 0;
    cumul.dPlus += s.resume.dPlusM || 0;
    cumul.seances += 1;
    parSemaine.set(lundi, cumul);
  }

  const semaines = [...parSemaine.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);

  return `<div class="carte">
    <h2>Charge hebdomadaire</h2>
    <p class="aide">Un saut brutal d'une semaine à l'autre est le meilleur prédicteur de blessure.</p>
    <table class="donnees">
      <tr><th>Semaine</th><th>Séances</th><th>Km</th><th>Temps</th><th>D+</th></tr>
      ${semaines.map(([lundi, c]) => `<tr>
        <td>${jourCourt(lundi)}</td>
        <td>${c.seances}</td>
        <td>${Math.round(c.km * 10) / 10}</td>
        <td>${duree(c.tempsS)}</td>
        <td>${c.dPlus} m</td>
      </tr>`).join("")}
    </table>
  </div>`;
}

// ------------------------------------------------------------ Efficience

function efficienceParType(etat) {
  if (!etat.seancesCourse.length) return "";

  const parType = new Map();
  for (const s of etat.seancesCourse) {
    const type = s.saisie?.type || "non renseigné";
    if (!parType.has(type)) parType.set(type, []);
    parType.get(type).push(s);
  }

  return `<div class="carte">
    <h2>Efficience aérobie</h2>
    <p class="aide">
      Mètres parcourus par battement. Regroupée par type de séance : l'indicateur monte
      mécaniquement avec l'allure, une séance de seuil n'est pas comparable à une sortie longue.
    </p>
    ${[...parType.entries()].map(([type, seances]) => `
      <h3 style="margin-top:12px">${html(type)}</h3>
      <table class="donnees">
        <tr><th>Date</th><th>Km</th><th>Allure</th><th>FC</th><th>Dérive</th><th>Arrêts</th><th>m/batt.</th></tr>
        ${seances.slice(-6).reverse().map((s) => {
          const eff = efficienceAerobie(s);
          const derive = deriveCardiaque(s);
          return `<tr>
            <td>${jourCourt(s.date)}</td>
            <td>${s.resume.distanceKm}</td>
            <td>${duree(s.resume.allureS)}</td>
            <td>${s.resume.fcMoy}</td>
            <td>${derive && derive.deltaBpm !== null
              ? (derive.deltaBpm > 0 ? "+" : "") + Math.round(derive.deltaBpm)
              : "—"}</td>
            <td>${duree(tempsArretS(s))}</td>
            <td>${eff ? eff.toFixed(2) : "—"}</td>
          </tr>`;
        }).join("")}
      </table>`).join("")}
  </div>`;
}
