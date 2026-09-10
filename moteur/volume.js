// VOLUME DE MUSCULATION — ce qui est prescrit, ce qui est réellement fait,
// et ce qui ne l'est jamais.
//
// Le volume se compte en SÉRIES DE TRAVAIL par groupe musculaire. Les séries
// d'échauffement ne comptent pas : elles ne font pas progresser.

import { SEANCES, PROGRESSION } from "../config/programme.js";
import { parId, GROUPES } from "../config/catalogue-exercices.js";

// Le volume qu'une semaine de programme prescrit, groupe par groupe.
// L'optionnel n'est pas compté : il n'est pas dû.
export function volumePrescrit(seances = ["A", "B", "C_chargee"]) {
  const parGroupe = {};
  for (const id of seances) {
    const seance = SEANCES[id];
    if (!seance) continue;
    for (const ligne of seance.lignes) {
      const fiche = parId[ligne.exercice];
      if (!fiche) continue;
      parGroupe[fiche.groupe] = (parGroupe[fiche.groupe] || 0) + ligne.series;
    }
  }
  return parGroupe;
}

// Le volume réellement réalisé sur une fenêtre de dates.
export function volumeRealise(etat, depuis, jusqua) {
  const parGroupe = {};
  for (const seance of etat.seancesSalle) {
    const d = seance.date.slice(0, 10);
    if (d < depuis || d > jusqua) continue;
    for (const exercice of seance.exercices) {
      const fiche = exercice.exerciceId ? parId[exercice.exerciceId] : null;
      if (!fiche) continue;
      const travail = exercice.series.filter((s) => !s.echauffement).length;
      parGroupe[fiche.groupe] = (parGroupe[fiche.groupe] || 0) + travail;
    }
  }
  return parGroupe;
}

// Les groupes dont le volume réalisé décroche du volume prescrit.
// L'appli constate l'écart ; elle ne dit pas quoi en faire.
export function desequilibres(etat, jusqua, semaines = PROGRESSION.fenetreVolumeSemaines) {
  const depuis = new Date(Date.parse(jusqua.slice(0, 10) + "T00:00:00Z") - semaines * 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  const prescrit = volumePrescrit();
  const realise = volumeRealise(etat, depuis, jusqua.slice(0, 10));

  const ecarts = [];
  for (const [groupe, series] of Object.entries(prescrit)) {
    const attendu = series * semaines;
    const fait = realise[groupe] || 0;
    const ratio = attendu === 0 ? 1 : fait / attendu;
    ecarts.push({
      groupe,
      nom: GROUPES[groupe] || groupe,
      attendu,
      fait,
      ratio,
      sousLeSeuil: ratio < PROGRESSION.seuilDesequilibre,
    });
  }

  return {
    depuis,
    jusqua: jusqua.slice(0, 10),
    semaines,
    ecarts: ecarts.sort((a, b) => a.ratio - b.ratio),
  };
}

// Les exercices que le programme prescrit et qui n'ont jamais été faits.
// Un exercice qu'on évite est une information, pas un oubli du programme.
export function jamaisFaits(etat, seances = ["A", "B", "C_chargee", "C_legere"]) {
  const dejaVus = new Set();
  for (const seance of etat.seancesSalle) {
    for (const exercice of seance.exercices) {
      if (exercice.exerciceId) dejaVus.add(exercice.exerciceId);
    }
  }

  const manquants = [];
  for (const id of seances) {
    const seance = SEANCES[id];
    if (!seance) continue;
    for (const ligne of seance.lignes) {
      if (dejaVus.has(ligne.exercice)) continue;
      if (manquants.some((m) => m.exerciceId === ligne.exercice)) continue;
      manquants.push({
        exerciceId: ligne.exercice,
        nom: parId[ligne.exercice]?.nom || ligne.exercice,
        seance: id,
      });
    }
  }
  return manquants;
}
