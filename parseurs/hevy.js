// PARSEUR DU TEXTE DE PARTAGE DE L'APPLICATION HEVY.
//
// Règle absolue : ce parseur ne devine JAMAIS. Toute ligne qu'il ne
// reconnaît pas est rapportée dans « lignesNonReconnues » et remontée à
// l'écran pour arbitrage. Mieux vaut une question qu'une donnée inventée.

import { parId, MATERIEL, pasDe } from "../config/catalogue-exercices.js";

const MOIS = {
  "janv": 1, "févr": 2, "fevr": 2, "mars": 3, "avr": 4, "mai": 5, "juin": 6,
  "juil": 7, "août": 8, "aout": 8, "sept": 9, "oct": 10, "nov": 11, "déc": 12, "dec": 12,
};

// "Le mardi, sept. 08, 2026 à 4:44pm" -> "2026-09-08T16:44"
export function dateDepuisEntete(texte) {
  const jour = texte.match(/([A-Za-zÀ-ÿ]+)\.?\s+(\d{1,2}),\s*(\d{4})/);
  if (!jour) return null;

  const mois = MOIS[jour[1].toLowerCase().replace(/\.$/, "")];
  if (!mois) return null;

  let heures = 0;
  let minutes = 0;
  const heure = texte.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (heure) {
    heures = Number(heure[1]) % 12;
    minutes = Number(heure[2]);
    if (heure[3].toLowerCase() === "pm") heures += 12;
  }

  const d2 = (n) => String(n).padStart(2, "0");
  return `${jour[3]}-${d2(mois)}-${d2(Number(jour[2]))}T${d2(heures)}:${d2(minutes)}`;
}

// Les formes de série observées ou décrites :
//   "16 kg x 15"      charge et répétitions
//   "10 répétitions"  poids du corps
//   "0:40"            série au temps
function analyserValeur(valeur) {
  const v = valeur.trim();

  const chargeReps = v.match(/^([\d.,]+)\s*kg\s*[x×]\s*(\d+)$/i);
  if (chargeReps) {
    return { chargeKg: Number(chargeReps[1].replace(",", ".")), reps: Number(chargeReps[2]) };
  }

  const repsSeules = v.match(/^(\d+)\s*(?:répétitions|repetitions|reps?)$/i);
  if (repsSeules) return { reps: Number(repsSeules[1]) };

  const duree = v.match(/^(\d{1,2}):(\d{2})$/);
  if (duree) return { dureeS: Number(duree[1]) * 60 + Number(duree[2]) };

  const chargeDuree = v.match(/^([\d.,]+)\s*kg\s*[x×]\s*(\d{1,2}):(\d{2})$/i);
  if (chargeDuree) {
    return {
      chargeKg: Number(chargeDuree[1].replace(",", ".")),
      dureeS: Number(chargeDuree[2]) * 60 + Number(chargeDuree[3]),
    };
  }

  return null;
}

// Une ligne de série commence par un libellé, puis « : », puis la valeur.
// Libellé normal : "Série 3". Échauffement : le libellé le dit.
function analyserLigneSerie(ligne) {
  const sep = ligne.indexOf(":");
  if (sep === -1) return null;

  const libelle = ligne.slice(0, sep).trim();
  const valeur = ligne.slice(sep + 1).trim();

  const estSerie = /^s[ée]rie\s*\d*$/i.test(libelle);
  const estEchauffement = /[ée]chauffement|warm/i.test(libelle);
  if (!estSerie && !estEchauffement) return null;

  const mesure = analyserValeur(valeur);
  if (!mesure) return { nonReconnue: true, ligne };

  return { ...mesure, echauffement: estEchauffement };
}

export function parserHevy(texte) {
  const lignes = String(texte)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "@hevyapp");

  if (!lignes.length) throw new Error("Texte Hevy vide.");

  const titre = lignes[0];
  const date = dateDepuisEntete(lignes.slice(0, 3).join(" "));
  if (!date) {
    throw new Error(
      "Date introuvable dans l'en-tête. Colle bien le texte complet, en-tête compris."
    );
  }

  const exercices = [];
  const lignesNonReconnues = [];
  let courant = null;

  // On saute l'en-tête : le titre, et la ligne de date.
  const debut = lignes.findIndex((l) => dateDepuisEntete(l) !== null) + 1;

  for (const ligne of lignes.slice(debut)) {
    const serie = analyserLigneSerie(ligne);

    if (serie === null) {
      // Ni une série, ni une ligne à ignorer : c'est un nom d'exercice.
      courant = { nomBrut: ligne, exerciceId: associer(ligne), series: [] };
      exercices.push(courant);
      continue;
    }

    if (serie.nonReconnue) {
      lignesNonReconnues.push({
        ligne: serie.ligne,
        exercice: courant ? courant.nomBrut : null,
        raison: "Format de série inconnu : cette ligne n'a pas été enregistrée.",
      });
      continue;
    }

    if (!courant) {
      lignesNonReconnues.push({
        ligne,
        exercice: null,
        raison: "Série rencontrée avant tout nom d'exercice.",
      });
      continue;
    }

    courant.series.push(serie);
  }

  return {
    date,
    titre,
    exercices,
    lignesNonReconnues,
    nomsInconnus: exercices.filter((e) => e.exerciceId === null).map((e) => e.nomBrut),
    source: { type: "hevy", texteBrut: texte },
  };
}

// Association d'un nom Hevy vers un exercice du catalogue. Elle ne repose que
// sur les noms déjà confirmés par Thomas. Un nom inconnu retourne null : il
// sera proposé à l'association à l'écran, jamais rapproché par ressemblance.
function associer(nomBrut) {
  const cible = nomBrut.trim().toLowerCase();
  for (const exercice of Object.values(parId)) {
    if ((exercice.nomsHevy || []).some((n) => n.trim().toLowerCase() === cible)) {
      return exercice.id;
    }
  }
  return null;
}

// La série de travail : la charge la plus fréquente de l'exercice ;
// à égalité, la plus lourde. Les séries d'échauffement ne comptent pas.
export function serieDeTravail(exercice) {
  const charges = exercice.series
    .filter((s) => !s.echauffement && typeof s.chargeKg === "number")
    .map((s) => s.chargeKg);
  if (!charges.length) return null;

  const compte = new Map();
  for (const c of charges) compte.set(c, (compte.get(c) || 0) + 1);

  const maxOccurrences = Math.max(...compte.values());
  return Math.max(...[...compte.entries()].filter(([, n]) => n === maxOccurrences).map(([c]) => c));
}

// Une charge doit exister sur le matériel. Les haltères de Thomas vont de 2
// en 2 kg : un 7 kg loggé est une faute de saisie, pas une charge.
// C'est signalé pour correction, jamais corrigé d'office.
export function chargesImpossibles(seance) {
  const anomalies = [];

  for (const ex of seance.exercices) {
    const fiche = ex.exerciceId ? parId[ex.exerciceId] : null;
    if (!fiche) continue;

    const pas = pasDe(fiche);
    const materiel = MATERIEL[fiche.materiel];
    if (!pas) continue; // cran inconnu : on ne peut rien affirmer

    for (const s of ex.series) {
      if (typeof s.chargeKg !== "number") continue;

      const base = materiel && typeof materiel.min === "number" ? materiel.min : 0;
      const ecarts = Math.abs((s.chargeKg - base) / pas);
      if (Math.abs(ecarts - Math.round(ecarts)) > 0.001) {
        anomalies.push({
          exercice: ex.nomBrut,
          chargeKg: s.chargeKg,
          raison:
            `${s.chargeKg} kg n'existe pas sur ${materiel ? materiel.nom.toLowerCase() : "ce matériel"} : ` +
            `la progression se fait par ${pas} kg.`,
        });
      }

      if (materiel && typeof materiel.max === "number" && s.chargeKg > materiel.max) {
        anomalies.push({
          exercice: ex.nomBrut,
          chargeKg: s.chargeKg,
          raison: `${s.chargeKg} kg dépasse le maximum disponible (${materiel.max} kg).`,
        });
      }
    }
  }

  return anomalies;
}
