// MOTEUR DE PHASES — répond à « ai-je le droit de faire ça aujourd'hui ».
//
// Il ne décide rien de discutable : il applique les phases, les interdits et
// les délais tels qu'ils sont écrits dans config/calendrier.js. Quand il
// refuse, il dit toujours pourquoi.

import { PHASES, COURSES, INTERDITS, TYPES_QUALITE } from "../config/calendrier.js";
import { parId, MATERIEL } from "../config/catalogue-exercices.js";

const jour = (iso) => String(iso).slice(0, 10);

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
        `du ${jour(dateSeanceC)} et la séance de qualité du ${jour(dateCourse)}. ` +
        `Il en faut 48.`,
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
