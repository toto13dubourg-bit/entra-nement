// LE PLANNING D'UNE SEMAINE — une seule construction, lue par la vue et par
// l'export coach, pour qu'ils ne puissent jamais raconter deux choses.
//
// Un créneau est une séance PRÉVUE. Il porte deux dates : celle où le
// programme la place, et celle où elle se tient réellement après déplacement.

import { SEMAINE_TYPE } from "../config/programme.js";
import { TYPES_QUALITE } from "../config/calendrier.js";
import { coursePrevue, verifierDelai, verifierRecuperation, versionSeanceC } from "./phases.js";

export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export function cleCreneau(dateOrigine, genre) {
  return `${dateOrigine}:${genre}`;
}

export function creneauxDeLaSemaine(etat, jours) {
  const deplacements = etat.deplacements || {};
  const creneaux = [];

  jours.forEach((j, index) => {
    const course = coursePrevue(j);
    if (course) {
      const cle = cleCreneau(j, "course");
      creneaux.push({
        genre: "course",
        cle,
        dateOrigine: j,
        date: deplacements[cle] || j,
        deplacee: Boolean(deplacements[cle]),
        prevue: course,
        type: course.type,
      });
    }

    const salleBrute = SEMAINE_TYPE[JOURS[index]]?.salle;
    if (salleBrute) {
      const cle = cleCreneau(j, "salle");
      const date = deplacements[cle] || j;
      creneaux.push({
        genre: "salle",
        cle,
        dateOrigine: j,
        date,
        deplacee: Boolean(deplacements[cle]),
        // La version de la séance C dépend de la phase du jour où elle se tient.
        seanceId: salleBrute === "C" ? versionSeanceC(date) : salleBrute,
        seanceBrute: salleBrute,
      });
    }
  });

  return creneaux;
}

export function deplacer(etat, cle, nouvelleDate) {
  const deplacements = { ...(etat.deplacements || {}) };
  const [dateOrigine] = cle.split(":");
  if (nouvelleDate === dateOrigine) delete deplacements[cle];
  else deplacements[cle] = nouvelleDate;
  return { ...etat, deplacements };
}

// Les conflits de délai de la semaine, calculés sur le planning RÉEL —
// déplacements compris. C'est tout l'intérêt : décaler une séance doit
// pouvoir déclencher une alerte, pas la faire disparaître.
export function conflitsDeLaSemaine(etat, jours, creneaux) {
  const conflits = [];

  const joursJambes = new Set(
    creneaux.filter((c) => c.genre === "salle" && String(c.seanceBrute)[0] === "C").map((c) => c.date)
  );
  for (const s of etat.seancesSalle) {
    if (jours.includes(s.date.slice(0, 10)) && String(s.seance)[0] === "C") {
      joursJambes.add(s.date.slice(0, 10));
    }
  }

  const typeCourseDu = (date) => {
    const faite = etat.seancesCourse.find((s) => s.date.slice(0, 10) === date);
    if (faite?.saisie?.type) return faite.saisie.type;
    const creneau = creneaux.find((c) => c.genre === "course" && c.date === date);
    if (creneau) return creneau.type;
    return coursePrevue(date)?.type || null;
  };

  for (const jambes of joursJambes) {
    // En aval : une séance de qualité trop proche APRÈS les jambes.
    for (const j of jours) {
      const type = typeCourseDu(j);
      if (type && TYPES_QUALITE.includes(type)) {
        const verdict = verifierDelai(jambes, j, type);
        if (verdict.conflit) conflits.push(verdict.raison);
      }
    }

    // En amont : une sortie longue ou une course trop proche AVANT les jambes.
    // On remonte deux jours, donc éventuellement sur la semaine précédente.
    for (const recul of [1, 2]) {
      const veille = decalerJours(jambes, -recul);
      const type = typeCourseDu(veille);
      if (!type) continue;
      const verdict = verifierRecuperation(veille, jambes, type);
      if (verdict.conflit) conflits.push(verdict.raison);
    }
  }

  return [...new Set(conflits)];
}

export function decalerJours(iso, nombre) {
  const d = new Date(iso.slice(0, 10) + "T12:00:00Z");
  return new Date(d.getTime() + nombre * 86400000).toISOString().slice(0, 10);
}
