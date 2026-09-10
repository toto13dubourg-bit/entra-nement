// MOTEUR DE PROGRESSION — machine à états déterministe.
//
// Mode LINÉAIRE (défaut)
//   réussite -> charge + pas ; compteur d'échecs remis à 0
//   échec    -> charge inchangée ; compteur + 1
//   2 échecs -> bascule en mode DOUBLE, compteur remis à 0
//
// Mode DOUBLE
//   charge bloquée jusqu'à atteindre le haut de la fourchette sur TOUTES les
//   séries ; alors charge + pas et retour au bas de la fourchette.
//
// Le moteur ne juge jamais. Il constate, applique, et refuse quand il manque
// une donnée plutôt que d'inventer un chiffre.

import { parId, MATERIEL, pasDe, plafondDe } from "../config/catalogue-exercices.js";
import { PROGRESSION } from "../config/programme.js";

export function etatInitial(exerciceId, chargeKg) {
  return {
    exerciceId,
    mode: PROGRESSION.modeParDefaut,
    chargeKg: chargeKg ?? null,
    echecsConsecutifs: 0,
    depuis: null,
  };
}

// La charge de travail d'une séance : la plus fréquente ; à égalité, la plus
// lourde. Les séries d'échauffement ne comptent pas.
export function chargeDeTravail(series) {
  const charges = series
    .filter((s) => !s.echauffement && typeof s.chargeKg === "number")
    .map((s) => s.chargeKg);
  if (!charges.length) return null;

  const compte = new Map();
  for (const c of charges) compte.set(c, (compte.get(c) || 0) + 1);
  const max = Math.max(...compte.values());
  return Math.max(...[...compte.entries()].filter(([, n]) => n === max).map(([c]) => c));
}

// Trois issues possibles, pas deux :
//   "reussite"  toutes les séries prescrites atteignent le bas de la fourchette
//   "echec"     au moins une série tombe en dessous
//   "structure" la séance n'a pas la forme prescrite — ni réussite ni échec,
//               c'est une observation à remonter, pas un verdict
export function evaluerSeance(seriesRealisees, ligne) {
  const [repsMin, repsMax] = ligne.reps;
  const attendues = ligne.series;

  const travail = seriesRealisees.filter((s) => !s.echauffement);
  if (!travail.length) {
    return { resultat: "structure", raison: "Aucune série de travail enregistrée." };
  }

  const charge = chargeDeTravail(travail);
  const auPoidsDuCorps = charge === null;
  const seriesALaCharge = auPoidsDuCorps
    ? travail
    : travail.filter((s) => s.chargeKg === charge);

  if (seriesALaCharge.length < attendues) {
    const chargesVues = [...new Set(travail.map((s) => s.chargeKg))].join(", ");
    return {
      resultat: "structure",
      charge,
      raison:
        `${attendues} séries prescrites à ${charge} kg, ${seriesALaCharge.length} réalisée(s) ` +
        `à cette charge (charges de la séance : ${chargesVues}).`,
    };
  }

  const mesure = (s) => (typeof s.reps === "number" ? s.reps : s.dureeS);
  const retenues = seriesALaCharge.slice(0, attendues);
  const sousLeMinimum = retenues.filter((s) => mesure(s) < repsMin);

  if (sousLeMinimum.length) {
    return {
      resultat: "echec",
      charge,
      raison: `${sousLeMinimum.length} série(s) sous ${repsMin} répétitions.`,
    };
  }

  return {
    resultat: "reussite",
    charge,
    hautDeFourchetteAtteint: retenues.every((s) => mesure(s) >= repsMax),
  };
}

// L'étape suivante pour un exercice, après une séance.
export function prochaineEtape(etat, seriesRealisees, ligne) {
  const fiche = parId[etat.exerciceId];
  if (!fiche) {
    return { action: "impossible", raison: `Exercice inconnu : ${etat.exerciceId}.` };
  }

  const pas = pasDe(fiche);
  const materiel = MATERIEL[fiche.materiel];

  const evaluation = evaluerSeance(seriesRealisees, ligne);

  if (evaluation.resultat === "structure") {
    return {
      action: "observation",
      etat: { ...etat },
      evaluation,
      raison: evaluation.raison,
    };
  }

  // Sans le cran réel de la machine, aucune charge ne peut être proposée.
  if (pas === null) {
    return {
      action: "impossible",
      etat: { ...etat },
      evaluation,
      raison:
        `Le cran de progression de « ${materiel ? materiel.nom : fiche.materiel} » n'est pas ` +
        `renseigné. Relève-le en salle, puis complète MATERIEL dans ` +
        `config/catalogue-exercices.js.`,
    };
  }

  const charge = evaluation.charge ?? etat.chargeKg;

  if (etat.mode === "DOUBLE") {
    if (evaluation.resultat === "reussite" && evaluation.hautDeFourchetteAtteint) {
      return monter(etat, charge, pas, fiche, ligne, evaluation, "DOUBLE", {
        raison:
          `Haut de fourchette (${ligne.reps[1]} reps) atteint sur toutes les séries : ` +
          `charge + ${pas} kg, retour à ${ligne.reps[0]} reps.`,
      });
    }
    return {
      action: "maintenir",
      etat: { ...etat, chargeKg: charge, echecsConsecutifs: 0 },
      evaluation,
      raison:
        `Mode double progression : charge bloquée à ${charge} kg jusqu'à ` +
        `${ligne.reps[1]} répétitions sur les ${ligne.series} séries.`,
    };
  }

  // Mode LINÉAIRE
  if (evaluation.resultat === "reussite") {
    return monter(etat, charge, pas, fiche, ligne, evaluation, "LINEAIRE", {
      raison: `Toutes les séries passées : charge + ${pas} kg.`,
    });
  }

  const echecs = etat.echecsConsecutifs + 1;

  if (echecs >= PROGRESSION.echecsAvantBascule) {
    return {
      action: "basculer",
      etat: { ...etat, chargeKg: charge, mode: "DOUBLE", echecsConsecutifs: 0 },
      evaluation,
      raison:
        `${echecs} échecs consécutifs : passage en double progression. ` +
        `Charge maintenue à ${charge} kg, objectif ${ligne.reps[1]} répétitions.`,
    };
  }

  return {
    action: "maintenir",
    etat: { ...etat, chargeKg: charge, echecsConsecutifs: echecs },
    evaluation,
    raison: `${evaluation.raison} Charge maintenue à ${charge} kg.`,
  };
}

function monter(etat, charge, pas, fiche, ligne, evaluation, mode, info) {
  // Au poids du corps, il n'y a aucune charge à incrémenter : la progression
  // passe par les répétitions, puis par le lest.
  if (charge === null) {
    return {
      action: "maintenir",
      etat: { ...etat, chargeKg: null, mode, echecsConsecutifs: 0 },
      evaluation,
      raison:
        `Au poids du corps : la progression se fait en répétitions. Ajoute du lest ` +
        `quand tu tiens ${ligne.reps[1]} répétitions sur les ${ligne.series} séries.`,
    };
  }

  const nouvelle = charge + pas;
  const plafond = plafondDe(fiche);

  if (plafond !== null && nouvelle > plafond) {
    return {
      action: "plafond",
      etat: { ...etat, chargeKg: charge, mode, echecsConsecutifs: 0 },
      evaluation,
      raison:
        `${nouvelle} kg dépasse le maximum disponible (${plafond} kg). ` +
        `Il faut changer d'exercice ou de méthode.`,
    };
  }

  return {
    action: "monter",
    etat: { ...etat, chargeKg: nouvelle, mode, echecsConsecutifs: 0 },
    evaluation,
    chargeKg: nouvelle,
    raison: info.raison,
  };
}

// Une charge qui ne bouge plus depuis trois semaines. L'appli le constate ;
// elle ne dit pas quoi faire — c'est le rôle du coach.
export function stagnation(etat, aujourdhui) {
  if (!etat.depuis) return null;
  const jours = Math.round((Date.parse(aujourdhui) - Date.parse(etat.depuis)) / 86400000);
  const seuil = PROGRESSION.stagnationSemaines * 7;
  if (jours < seuil) return null;
  return {
    exerciceId: etat.exerciceId,
    jours,
    chargeKg: etat.chargeKg,
    message: PROGRESSION.stagnationMessage,
  };
}
