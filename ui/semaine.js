// ÉCRAN « MA SEMAINE » — course et salle mêlées dans l'ordre des jours.

import { html, JOURS, jourCourt, decalerJours, duree, message } from "./base.js";
import { TYPES_QUALITE } from "../config/calendrier.js";
import { SEMAINE_TYPE, SEANCES } from "../config/programme.js";
import {
  salleAutorisee,
  versionSeanceC,
  verifierDelai,
  verifierRecuperation,
  coursePrevue,
} from "../moteur/phases.js";
import { seanceAffichable } from "../moteur/application.js";
import { semaineDe } from "../export/coach.js";
import { tempsArretS, efficienceAerobie, deriveCardiaque } from "../parseurs/coros.js";

export function rendreSemaine(contexte) {
  const { etat, jour, aujourdhui } = contexte;
  const jours = semaineDe(jour);
  const L = [];

  L.push(`<div class="barre-semaine">
    <button class="bouton secondaire" style="width:auto;padding:12px 16px" data-semaine="-7">‹</button>
    <span class="intitule">du ${jourCourt(jours[0])} au ${jourCourt(jours[6])}</span>
    <button class="bouton secondaire" style="width:auto;padding:12px 16px" data-semaine="7">›</button>
  </div>`);

  const conflits = detecterConflits(etat, jours);
  if (conflits.length) L.push(message("attention", "Conflit de délai :", conflits));

  // Une séance déplacée dans la semaine reste faite : on ne la repropose pas
  // le jour où le programme la plaçait.
  const typesFaits = new Set(
    etat.seancesSalle
      .filter((s) => jours.includes(s.date.slice(0, 10)))
      .map((s) => String(s.seance)[0])
  );

  let quelqueChose = false;

  jours.forEach((j, index) => {
    const blocs = [];

    const course = blocCourse(etat, j, aujourdhui);
    if (course) blocs.push(course);

    blocs.push(...blocsSalle(etat, j, index, aujourdhui, typesFaits));

    if (!blocs.length) return;
    quelqueChose = true;

    L.push(`<section class="jour${j === aujourdhui ? " aujourdhui" : ""}">
      <div class="entete-jour"><span>${JOURS[index]} ${jourCourt(j)}</span></div>
      ${blocs.join("")}
    </section>`);
  });

  if (!quelqueChose) {
    L.push(`<p class="vide">Rien de prévu cette semaine.</p>`);
  }

  L.push(`<div class="boutons" style="margin-top:18px">
    <a class="bouton" href="#coach" style="text-align:center;text-decoration:none;line-height:22px">
      Préparer l'export coach
    </a>
  </div>`);

  return L.join("");
}

// ------------------------------------------------------------------ Course

function blocCourse(etat, j, aujourdhui) {
  const prevue = coursePrevue(j);
  const faite = etat.seancesCourse.find((s) => s.date.slice(0, 10) === j);
  const cochee = etat.coches[`${j}:course`];

  if (!prevue && !faite) return null;

  const estFaite = Boolean(faite) || Boolean(cochee);
  const sautee = !estFaite && j < aujourdhui;

  const titre = faite
    ? faite.saisie?.titre || prevue?.titre || "Sortie"
    : prevue.titre;

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
      ${faite ? detailCourse(faite) : ""}
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

function blocsSalle(etat, j, index, aujourdhui, typesFaits) {
  const blocs = [];
  const faite = etat.seancesSalle.find((s) => s.date.slice(0, 10) === j);
  const prevueBrute = SEMAINE_TYPE[JOURS[index]]?.salle;

  if (faite) blocs.push(carteSalle(etat, j, faite.seance, faite, aujourdhui));

  // La séance prévue n'est reproposée que si aucune séance de ce type n'a été
  // faite ailleurs dans la semaine.
  if (prevueBrute && !typesFaits.has(prevueBrute[0])) {
    const seanceId = prevueBrute === "C" ? versionSeanceC(j) : prevueBrute;
    if (seanceId) blocs.push(carteSalle(etat, j, seanceId, null, aujourdhui));
  }

  return blocs;
}

function carteSalle(etat, j, seanceId, faite, aujourdhui) {
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
        ? `<p class="sous-titre">${html(SEANCES[seanceId]?.detail || "")}</p>${detailSalle(affichable, faite)}`
        : `<p class="motif-refus">${html(autorisation.raison)}</p>` +
          (autorisation.remplacerPar
            ? `<p class="sous-titre">Version applicable : ${html(SEANCES[autorisation.remplacerPar]?.nom || autorisation.remplacerPar)}</p>`
            : "")}
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

  const ligne = (p) => {
    const unite = p.unite === "secondes" ? "s" : "";
    const prescription = `${p.series} × ${p.reps[0] === p.reps[1] ? p.reps[0] : p.reps.join("-")}${unite}`;
    return `<div class="exercice">
      <span>${html(p.nom)}
        <span class="prescription">${html(prescription)}</span>
        ${p.raison ? `<span class="note">${html(p.raison)}</span>` : ""}
        ${!p.raison && p.consigne ? `<span class="prescription">${html(p.consigne)}</span>` : ""}
      </span>
      <span class="charge${p.chargeKg === null ? " inconnue" : ""}">
        ${p.disponible ? html(p.texte || "à calibrer") : "indisponible"}
      </span>
    </div>`;
  };

  return `<details><summary>Voir la séance</summary>
    ${affichable.lignes.map(ligne).join("")}
    ${affichable.optionnel.length
      ? `<h3 style="margin-top:12px">Optionnel</h3>${affichable.optionnel.map(ligne).join("")}`
      : ""}
  </details>`;
}

// ---------------------------------------------------------------- Conflits

function detecterConflits(etat, jours) {
  const conflits = [];

  const joursJambes = jours.filter((j, i) => {
    const prevue = SEMAINE_TYPE[JOURS[i]]?.salle;
    const faite = etat.seancesSalle.find((s) => s.date.slice(0, 10) === j);
    return prevue === "C" || (faite && String(faite.seance).startsWith("C"));
  });

  const joursQualite = jours.filter((j) => {
    const faite = etat.seancesCourse.find((s) => s.date.slice(0, 10) === j);
    const type = faite?.saisie?.type || coursePrevue(j)?.type;
    return type && TYPES_QUALITE.includes(type);
  });

  for (const jambes of joursJambes) {
    for (const qualite of joursQualite) {
      const verdict = verifierDelai(jambes, qualite, "vma");
      if (verdict.conflit) conflits.push(verdict.raison);
    }

    // L'autre sens : une sortie longue trop proche AVANT la séance de jambes.
    // On regarde les deux jours précédents, y compris la fin de la semaine
    // passée, puisque la sortie longue tombe le dimanche.
    for (const recul of [1, 2]) {
      const veille = decalerJours(jambes, -recul);
      const faite = etat.seancesCourse.find((s) => s.date.slice(0, 10) === veille);
      const type = faite?.saisie?.type || coursePrevue(veille)?.type;
      if (!type) continue;
      const verdict = verifierRecuperation(veille, jambes, type);
      if (verdict.conflit) conflits.push(verdict.raison);
    }
  }

  return conflits;
}

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
}
