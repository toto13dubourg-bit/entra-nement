// MOTEUR DE PHASES — répond à « ai-je le droit de faire ça aujourd'hui ».
//
// Il ne décide rien de discutable : il applique les phases, les interdits et
// les délais tels qu'ils sont écrits dans config/calendrier.js. Quand il
// refuse, il dit toujours pourquoi.

import {
  PHASES,
  COURSES,
  INTERDITS,
  TYPES_QUALITE,
  SEANCES_COURSE_PREVUES,
} from "../config/calendrier.js";
import { SEMAINE_TYPE } from "../config/programme.js";
import { parId, MATERIEL } from "../config/catalogue-exercices.js";

const jour = (iso) => String(iso).slice(0, 10);

// Format lisible pour les messages : 19/10 plutôt que 2026-10-19.
const enClair = (iso) => {
  const [, mois, j] = jour(iso).split("-");
  return `${j}/${mois}`;
};

const JOURS_SEMAINE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const LIBELLES_COURSE = {
  ef: "Endurance fondamentale",
  qualite: "Séance de qualité",
  "sortie-longue": "Sortie longue",
};

const FIN_DU_PLAN_DATE = SEANCES_COURSE_PREVUES.map((p) => p.date).sort().slice(-1)[0] || "";

// La séance de course d'un jour : celle du plan daté tant qu'il en reste,
// puis celle que la semaine type prévoit. Sans ce relais, l'application
// n'aurait plus rien à afficher passé la dernière date du plan.
//
// Le relais ne démarre qu'APRÈS la fin du plan : à l'intérieur, une semaine
// où seules deux séances sur trois sont datées ne doit pas voir la semaine
// type lui en ajouter une troisième par-dessus.
export function coursePrevue(date) {
  const d = jour(date);

  const datee = SEANCES_COURSE_PREVUES.find((p) => p.date === d);
  if (datee) return { ...datee, origine: "plan" };
  if (d <= FIN_DU_PLAN_DATE) return null;

  const nomJour = JOURS_SEMAINE[(new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7];
  const type = SEMAINE_TYPE[nomJour]?.course;
  if (!type) return null;

  return {
    date: d,
    type,
    titre: LIBELLES_COURSE[type] || type,
    detail: "D'après ta semaine type — contenu à définir",
    origine: "gabarit",
  };
}

export function phaseDu(date) {
  const d = jour(date);
  return PHASES.find((p) => d >= p.debut && d <= p.fin) || null;
}

export function prochaineCourse(date) {
  const d = jour(date);
  const course = COURSES.filter((c) => c.date >= d).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!course) return null;
  return { course, joursRestants: ecartEnJours(d, course.date) };
}

export function ecartEnJours(depuis, jusqua) {
  const ms = Date.parse(jour(jusqua) + "T00:00:00Z") - Date.parse(jour(depuis) + "T00:00:00Z");
  return Math.round(ms / 86400000);
}

// La séance C existe en deux versions ; c'est la phase qui tranche.
export function versionSeanceC(date) {
  const p = phaseDu(date);
  if (!p) return null;
  return p.basDuCorpsCharge ? "C_chargee" : "C_legere";
}

export function salleAutorisee(date, seanceId) {
  const d = jour(date);
  const p = phaseDu(d);

  if (!p) {
    return {
      autorise: false,
      raison: `Aucune phase n'est définie pour le ${d}. Complète config/calendrier.js.`,
    };
  }

  if (p.salle === "interdite") {
    return { autorise: false, phase: p, raison: p.raisonRefus };
  }

  if (p.dernierJourSalle && d > p.dernierJourSalle) {
    return { autorise: false, phase: p, raison: p.raisonRefus };
  }

  const estBasDuCorps = seanceId === "C" || seanceId === "C_chargee" || seanceId === "C_legere";

  if (estBasDuCorps && p.salle === "haut-du-corps-seul") {
    return {
      autorise: false,
      phase: p,
      raison: `Phase « ${p.nom} » : haut du corps uniquement, pas de séance de jambes.`,
    };
  }

  if (seanceId === "C_chargee" && !p.basDuCorpsCharge) {
    return {
      autorise: false,
      phase: p,
      raison:
        `Phase « ${p.nom} » : le bas du corps chargé n'ouvre pas avant le 19/10. ` +
        `C'est la version au poids du corps qui s'applique.`,
      remplacerPar: "C_legere",
    };
  }

  return { autorise: true, phase: p };
}

export function exerciceAutorise(exerciceId, date) {
  const d = jour(date);
  const fiche = parId[exerciceId];

  if (!fiche) {
    return { autorise: false, raison: `Exercice inconnu au catalogue : ${exerciceId}.` };
  }

  if (!fiche.disponible) {
    return {
      autorise: false,
      raison: `${fiche.nom} : le matériel n'existe pas dans la salle.`,
    };
  }

  for (const interdit of INTERDITS) {
    if (interdit.quoi.includes(exerciceId) && d <= interdit.jusquA) {
      return { autorise: false, raison: interdit.raison, jusquA: interdit.jusquA };
    }
  }

  return { autorise: true };
}

// 48 h minimum entre une séance de jambes et une séance de qualité en course.
// Le délai se compte en jours pleins : lundi puis mercredi passe, lundi puis
// mardi ne passe pas. Compter en heures donnerait une fausse précision, les
// horaires exacts n'étant pas connus à l'avance.
export function verifierDelai(dateSeanceC, dateCourse, typeCourse) {
  if (!TYPES_QUALITE.includes(typeCourse)) {
    return { conflit: false, raison: `Une séance de type « ${typeCourse} » n'impose aucun délai.` };
  }

  const jours = ecartEnJours(dateSeanceC, dateCourse);

  if (jours < 0) return { conflit: false, raison: "La course précède la séance de jambes." };

  if (jours < 2) {
    return {
      conflit: true,
      jours,
      raison:
        `Seulement ${jours === 0 ? "le même jour" : "24 h"} entre la séance de jambes ` +
        `du ${enClair(dateSeanceC)} et la séance de qualité du ${enClair(dateCourse)}. ` +
        `Il en faut 48.`,
    };
  }

  return { conflit: false, jours };
}

// Les séances de course qui vident assez les jambes pour qu'une séance de
// force ne puisse pas suivre le lendemain.
const EPUISE_LES_JAMBES = ["sortie-longue", "course"];

// L'autre sens du même délai : une séance de jambes ne peut pas suivre de
// trop près une sortie longue ou une course. C'est la règle qui manquait
// quand la séance C avait été placée au lendemain de la sortie longue.
export function verifierRecuperation(dateCourse, dateSeanceC, typeCourse) {
  if (!EPUISE_LES_JAMBES.includes(typeCourse)) {
    return { conflit: false, raison: `Une séance de type « ${typeCourse} » ne bloque rien.` };
  }

  const jours = ecartEnJours(dateCourse, dateSeanceC);
  if (jours < 0) return { conflit: false, raison: "La séance de jambes précède la course." };

  if (jours < 2) {
    return {
      conflit: true,
      jours,
      raison:
        `Séance de jambes le ${enClair(dateSeanceC)}, soit ` +
        `${jours === 0 ? "le jour même de" : "le lendemain de"} la sortie longue du ` +
        `${enClair(dateCourse)}. Il faut 48 h : des jambes vidées font une mauvaise ` +
        `séance de force et récupèrent moins bien.`,
    };
  }

  return { conflit: false, jours };
}

// Ce que l'appli peut proposer aujourd'hui, et ce qu'elle refuse, avec la
// raison de chaque refus. C'est cette liste qui alimente l'export coach.
export function seanceDuJour(date, seanceId) {
  const autorisation = salleAutorisee(date, seanceId);
  if (!autorisation.autorise) return autorisation;

  const version = seanceId === "C" ? versionSeanceC(date) : seanceId;
  return { ...autorisation, seance: version };
}

// Un exercice dont le cran de progression est inconnu ne peut pas être
// programmé avec une charge. Il reste faisable, mais l'appli ne proposera
// aucun chiffre.
export function cranConnu(exerciceId) {
  const fiche = parId[exerciceId];
  if (!fiche) return false;
  if (fiche.pas !== undefined) return fiche.pas !== null;
  return (MATERIEL[fiche.materiel]?.pas ?? null) !== null;
}
