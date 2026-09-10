// Ce qui relie une séance importée à l'état de progression.
// C'est ici que « j'ai fait ma séance » devient « voici la charge suivante ».

import { SEANCES } from "../config/programme.js";
import { parId, MATERIEL, pasDe } from "../config/catalogue-exercices.js";
import { etatInitial, prochaineEtape, chargeDeTravail } from "./progression.js";
import { exerciceAutorise, cranConnu } from "./phases.js";

// La ligne du programme qui correspond à un exercice, dans une séance donnée.
export function ligneDe(seanceId, exerciceId) {
  const seance = SEANCES[seanceId];
  if (!seance) return null;
  const toutes = [...seance.lignes, ...(seance.optionnel || [])];
  return toutes.find((l) => l.exercice === exerciceId) || null;
}

// Met à jour l'état de progression à partir d'une séance de salle importée.
// Retourne le nouvel état ET le détail de ce qui a été décidé, pour l'afficher.
export function appliquerSeanceSalle(etat, seance) {
  const progression = { ...etat.progression };
  const decisions = [];

  for (const exercice of seance.exercices) {
    if (!exercice.exerciceId) {
      decisions.push({
        nomBrut: exercice.nomBrut,
        action: "non-associe",
        raison: "Exercice non associé au catalogue : aucune progression suivie.",
      });
      continue;
    }

    const ligne = ligneDe(seance.seance, exercice.exerciceId);

    // Un exercice hors programme reste une charge soulevée : on la retient,
    // sans rien proposer pour la suite faute de séries et de reps prescrites.
    if (!ligne) {
      const charge = chargeDeTravail(exercice.series);
      if (charge !== null) {
        const connu = progression[exercice.exerciceId];
        progression[exercice.exerciceId] = {
          ...(connu || etatInitial(exercice.exerciceId, charge)),
          chargeKg: charge,
          depuis: !connu || connu.chargeKg !== charge ? seance.date.slice(0, 10) : connu.depuis,
        };
      }
      decisions.push({
        exerciceId: exercice.exerciceId,
        nom: parId[exercice.exerciceId]?.nom,
        action: "hors-programme",
        chargeKg: charge,
        raison:
          `Ne figure pas dans la séance ${seance.seance} : charge retenue` +
          `${charge !== null ? ` (${charge} kg)` : ""}, mais aucune progression proposée.`,
      });
      continue;
    }

    const precedent =
      progression[exercice.exerciceId] ||
      etatInitial(exercice.exerciceId, chargeDeTravail(exercice.series));

    const resultat = prochaineEtape(precedent, exercice.series, ligne);

    if (resultat.etat) {
      const chargeChange = resultat.etat.chargeKg !== precedent.chargeKg;
      progression[exercice.exerciceId] = {
        ...resultat.etat,
        depuis: chargeChange ? seance.date.slice(0, 10) : precedent.depuis || seance.date.slice(0, 10),
      };
    }

    decisions.push({
      exerciceId: exercice.exerciceId,
      nom: parId[exercice.exerciceId]?.nom,
      action: resultat.action,
      raison: resultat.raison,
      chargeKg: resultat.chargeKg,
    });
  }

  return { etat: { ...etat, progression }, decisions };
}

// Ce que l'application propose pour un exercice, aujourd'hui. Elle refuse et
// s'explique dès qu'il lui manque une donnée — elle n'invente jamais un chiffre.
export function propositionDuJour(etat, seanceId, ligne, date) {
  const fiche = parId[ligne.exercice];
  const autorisation = exerciceAutorise(ligne.exercice, date);

  const base = {
    exerciceId: ligne.exercice,
    nom: fiche ? fiche.nom : ligne.exercice,
    series: ligne.series,
    reps: ligne.reps,
    unite: ligne.unite || "reps",
    consigne: ligne.consigne || null,
    alternative: ligne.alternative || null,
  };

  if (!autorisation.autorise) {
    return { ...base, disponible: false, raison: autorisation.raison };
  }

  if (fiche.charge === "corps") {
    return { ...base, disponible: true, chargeKg: null, texte: "poids du corps" };
  }

  if (!cranConnu(ligne.exercice)) {
    const materiel = MATERIEL[fiche.materiel];
    return {
      ...base,
      disponible: true,
      chargeKg: null,
      raison:
        `Cran de « ${materiel ? materiel.nom : fiche.materiel} » non relevé : ` +
        `aucune charge proposée. Note ce que tu fais, la progression démarrera après.`,
    };
  }

  const suivi = etat.progression[ligne.exercice];
  if (!suivi || suivi.chargeKg === null) {
    return {
      ...base,
      disponible: true,
      chargeKg: null,
      raison:
        "Charge jamais enregistrée. Calibre : échauffement léger à 12 reps, puis monte " +
        `jusqu'à la charge où la ${ligne.reps[1]}ᵉ répétition est dure mais propre, ` +
        "avec 2 à 3 reps en réserve.",
    };
  }

  return {
    ...base,
    disponible: true,
    chargeKg: suivi.chargeKg,
    mode: suivi.mode,
    pas: pasDe(fiche),
    texte: `${suivi.chargeKg} kg`,
  };
}

// La séance complète telle qu'elle doit être affichée aujourd'hui.
export function seanceAffichable(etat, seanceId, date) {
  const seance = SEANCES[seanceId];
  if (!seance) return null;
  return {
    id: seanceId,
    nom: seance.nom,
    detail: seance.detail,
    lignes: seance.lignes.map((l) => propositionDuJour(etat, seanceId, l, date)),
    optionnel: (seance.optionnel || []).map((l) => propositionDuJour(etat, seanceId, l, date)),
  };
}
