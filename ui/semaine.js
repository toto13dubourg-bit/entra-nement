// ÉCRAN « MA SEMAINE » — course et salle mêlées dans l'ordre des jours.

import { html, JOURS, jourCourt, decalerJours, duree, message } from "./base.js";
import { SEANCES } from "../config/programme.js";
import { salleAutorisee } from "../moteur/phases.js";
import { seanceAffichable } from "../moteur/application.js";
import { creneauxDeLaSemaine, conflitsDeLaSemaine, deplacer } from "../moteur/planning.js";
import { semaineDe } from "../export/coach.js";
import { tempsArretS, efficienceAerobie, deriveCardiaque } from "../parseurs/coros.js";
import { schemaSvg } from "./schema.js";

export function rendreSemaine(contexte) {
  const { etat, jour, aujourdhui } = contexte;
  const jours = semaineDe(jour);
  const creneaux = creneauxDeLaSemaine(etat, jours);
  const L = [];

  L.push(`<div class="barre-semaine">
    <button class="bouton secondaire" style="width:auto;padding:12px 16px" data-semaine="-7">‹</button>
    <span class="intitule">du ${jourCourt(jours[0])} au ${jourCourt(jours[6])}</span>
    <button class="bouton secondaire" style="width:auto;padding:12px 16px" data-semaine="7">›</button>
  </div>`);

  const conflits = conflitsDeLaSemaine(etat, jours, creneaux);
  if (conflits.length) L.push(message("attention", "Conflit de délai :", conflits));

  // Une séance de salle déplacée dans la semaine reste faite : on ne la
  // repropose pas là où le programme la plaçait.
  const typesFaits = new Set(
    etat.seancesSalle
      .filter((s) => jours.includes(s.date.slice(0, 10)))
      .map((s) => String(s.seance)[0])
  );

  let quelqueChose = false;

  jours.forEach((j, index) => {
    const blocs = [];

    const faiteCourse = etat.seancesCourse.find((s) => s.date.slice(0, 10) === j);
    const creneauCourse = creneaux.find((c) => c.genre === "course" && c.date === j);
    if (faiteCourse || creneauCourse) {
      blocs.push(carteCourse(etat, j, creneauCourse, faiteCourse, aujourdhui, jours));
    }

    const faiteSalle = etat.seancesSalle.find((s) => s.date.slice(0, 10) === j);
    if (faiteSalle) blocs.push(carteSalle(etat, j, faiteSalle.seance, faiteSalle, null, aujourdhui, jours));

    const creneauSalle = creneaux.find((c) => c.genre === "salle" && c.date === j);
    if (creneauSalle && !faiteSalle && !typesFaits.has(String(creneauSalle.seanceBrute)[0])) {
      blocs.push(carteSalle(etat, j, creneauSalle.seanceId, null, creneauSalle, aujourdhui, jours));
    }

    if (!blocs.length) return;
    quelqueChose = true;

    L.push(`<section class="jour${j === aujourdhui ? " aujourdhui" : ""}">
      <div class="entete-jour"><span>${JOURS[index]} ${jourCourt(j)}</span></div>
      ${blocs.join("")}
    </section>`);
  });

  if (!quelqueChose) L.push(`<p class="vide">Rien de prévu cette semaine.</p>`);

  L.push(`<div class="boutons" style="margin-top:18px">
    <a class="bouton" href="#coach" style="text-align:center;text-decoration:none;line-height:22px">
      Préparer l'export coach
    </a>
  </div>`);

  return L.join("");
}

// ---------------------------------------------------------- Le déplacement

function boutonsDeplacement(creneau, jours) {
  if (!creneau) return "";
  const initiales = ["L", "M", "M", "J", "V", "S", "D"];

  const chips = jours
    .map((j, i) => {
      const actif = j === creneau.date;
      return `<button type="button" data-deplacer="${html(creneau.cle)}" data-vers="${j}"
        class="${actif ? "choisi" : ""}" aria-label="${JOURS[i]} ${jourCourt(j)}">${initiales[i]}</button>`;
    })
    .join("");

  const retour = creneau.deplacee
    ? `<p class="sous-titre">Déplacée depuis le ${jourCourt(creneau.dateOrigine)}.
       <button type="button" class="lien-annuler" data-deplacer="${html(creneau.cle)}"
               data-vers="${creneau.dateOrigine}">Remettre à sa place</button></p>`
    : "";

  return `<details><summary>Décaler</summary>
    <div class="compteur" style="margin-top:6px">${chips}</div>
    ${retour}
  </details>`;
}

// ------------------------------------------------------------------ Course

function carteCourse(etat, j, creneau, faite, aujourdhui, jours) {
  const cochee = etat.coches[`${j}:course`];
  const estFaite = Boolean(faite) || Boolean(cochee);
  const sautee = !estFaite && j < aujourdhui;
  const prevue = creneau?.prevue;

  const titre = faite ? faite.saisie?.titre || prevue?.titre || "Sortie" : prevue.titre;
  const sousTitre = faite
    ? `${faite.resume.distanceKm} km en ${duree(faite.resume.tempsS)} à ${duree(faite.resume.allureS)}/km`
    : prevue.detail;

  return `<article class="seance">
    <button class="coche${estFaite ? " faite" : ""}" data-cocher="${j}:course"
            aria-label="Marquer comme faite">✓</button>
    <div class="corps-seance">
      <div class="titre-seance">
        <span>${html(titre)}</span>
        <span class="etiquette ${estFaite ? "faite" : sautee ? "sautee" : "course"}">
          ${estFaite ? "FAITE" : sautee ? "SAUTÉE" : "COURSE"}
        </span>
      </div>
      <p class="sous-titre">${html(sousTitre)}</p>
      ${prevue?.condition ? `<p class="sous-titre">${html(prevue.condition)}</p>` : ""}
      ${faite ? detailCourse(faite) : boutonsDeplacement(creneau, jours)}
    </div>
  </article>`;
}

function detailCourse(seance) {
  const r = seance.resume;
  const saisie = seance.saisie || {};
  const derive = deriveCardiaque(seance);
  const eff = efficienceAerobie(seance);
  const lignes = [
    ["FC moyenne / max", `${r.fcMoy} / ${r.fcMax}`],
    ["Temps d'arrêt", duree(tempsArretS(seance))],
    ["Efficience", eff ? `${eff.toFixed(2)} m/battement` : "—"],
    ["Dénivelé", `+${r.dPlusM} / −${r.dMoinsM} m`],
  ];
  if (derive && derive.deltaBpm !== null) {
    lignes.push(["Dérive cardiaque", `${derive.deltaBpm > 0 ? "+" : ""}${Math.round(derive.deltaBpm)} bpm`]);
  }
  if (typeof saisie.temperatureC === "number") lignes.push(["Température réelle", `${saisie.temperatureC} °C`]);
  if (saisie.ressenti) lignes.push(["Ressenti", `${saisie.ressenti}/5`]);

  return `<details><summary>Détail</summary>
    ${lignes.map(([nom, valeur]) =>
      `<div class="exercice"><span>${html(nom)}</span><span class="charge">${html(valeur)}</span></div>`
    ).join("")}
  </details>`;
}

// ------------------------------------------------------------------- Salle

function carteSalle(etat, j, seanceId, faite, creneau, aujourdhui, jours) {
  const autorisation = salleAutorisee(j, seanceId);
  const estFaite = Boolean(faite) || Boolean(etat.coches[`${j}:salle`]);
  const sautee = !estFaite && j < aujourdhui && autorisation.autorise;
  const affichable = autorisation.autorise ? seanceAffichable(etat, seanceId, j) : null;
  const nom = SEANCES[seanceId]?.nom || `Séance ${seanceId}`;

  return `<article class="seance${autorisation.autorise ? "" : " refusee"}">
    <button class="coche${estFaite ? " faite" : ""}" data-cocher="${j}:salle"
            ${autorisation.autorise ? "" : "disabled"} aria-label="Marquer comme faite">✓</button>
    <div class="corps-seance">
      <div class="titre-seance">
        <span>${html(nom)}</span>
        <span class="etiquette ${estFaite ? "faite" : sautee ? "sautee" : ""}">
          ${estFaite ? "FAITE" : sautee ? "SAUTÉE" : autorisation.autorise ? "SALLE" : "FERMÉE"}
        </span>
      </div>
      ${autorisation.autorise
        ? `<p class="sous-titre">${html(SEANCES[seanceId]?.detail || "")}</p>` +
          detailSalle(affichable, faite) +
          (faite ? "" : boutonsDeplacement(creneau, jours))
        : `<p class="motif-refus">${html(autorisation.raison)}</p>` +
          (autorisation.remplacerPar
            ? `<p class="sous-titre">Version applicable : ${html(SEANCES[autorisation.remplacerPar]?.nom || autorisation.remplacerPar)}</p>`
            : "") +
          (faite ? "" : boutonsDeplacement(creneau, jours))}
    </div>
  </article>`;
}

function detailSalle(affichable, faite) {
  if (faite) {
    return `<details><summary>Ce qui a été fait</summary>
      ${faite.exercices.map((e) => {
        const series = e.series
          .filter((s) => !s.echauffement)
          .map((s) => (typeof s.reps === "number" ? s.reps : duree(s.dureeS)))
          .join("-");
        const charges = [...new Set(e.series.filter((s) => !s.echauffement).map((s) => s.chargeKg))]
          .filter((c) => typeof c === "number");
        return `<div class="exercice">
          <span>${html(e.nomBrut)}<span class="prescription">${html(series)}</span></span>
          <span class="charge">${charges.length ? html(charges.join(" / ")) + " kg" : "PdC"}</span>
        </div>`;
      }).join("")}
    </details>`;
  }

  if (!affichable) return "";

  const ligne = (p) => {
    const unite = p.unite === "secondes" ? "s" : "";
    const prescription = `${p.series} × ${p.reps[0] === p.reps[1] ? p.reps[0] : p.reps.join("-")}${unite}`;
    const corps = `<div class="exercice">
      <span>${html(p.nom)}
        <span class="prescription">${html(prescription)}</span>
        ${p.raison ? `<span class="note">${html(p.raison)}</span>` : ""}
        ${!p.raison && p.consigne ? `<span class="prescription">${html(p.consigne)}</span>` : ""}
      </span>
      <span class="charge${p.chargeKg === null ? " inconnue" : ""}">
        ${p.disponible ? html(p.texte || "à calibrer") : "indisponible"}
      </span>
    </div>`;

    const schema = schemaSvg(p.exerciceId);
    return schema
      ? `<div class="exercice-avec-schema">${schema}${corps}</div>`
      : `<div class="exercice-avec-schema">${corps}</div>`;
  };

  const aCalibrer = [...affichable.lignes, ...affichable.optionnel].some((p) => p.aCalibrer);

  return `<details><summary>Voir la séance</summary>
    ${aCalibrer
      ? `<p class="legende-schema" style="margin:8px 0 0">
           À calibrer : échauffement léger à 12 répétitions, puis monte jusqu'à la charge
           où la dernière répétition de la fourchette est dure mais propre, avec 2 à 3
           répétitions en réserve. Cette charge devient le point de départ.
         </p>`
      : ""}
    ${affichable.lignes.map(ligne).join("")}
    ${affichable.optionnel.length
      ? `<h3 style="margin-top:12px">Optionnel</h3>${affichable.optionnel.map(ligne).join("")}`
      : ""}
    <p class="legende-schema">
      Trait gris : départ. Trait blanc : arrivée. Flèche : sens du mouvement moteur.
    </p>
  </details>`;
}

// ------------------------------------------------------------- Branchement

export function brancherSemaine(racine, contexte, rafraichir) {
  racine.querySelectorAll("[data-semaine]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      contexte.jour = decalerJours(contexte.jour, Number(bouton.dataset.semaine));
      rafraichir();
    });
  });

  racine.querySelectorAll("[data-cocher]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const cle = bouton.dataset.cocher;
      const coches = { ...contexte.etat.coches };
      if (coches[cle]) delete coches[cle];
      else coches[cle] = true;
      contexte.enregistrer({ ...contexte.etat, coches });
      rafraichir();
    });
  });

  racine.querySelectorAll("[data-deplacer]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      contexte.enregistrer(deplacer(contexte.etat, bouton.dataset.deplacer, bouton.dataset.vers));
      rafraichir();
    });
  });
}
