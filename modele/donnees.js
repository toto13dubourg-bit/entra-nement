// MODÈLE DE DONNÉES — la forme de tout ce que l'application conserve.
//
// Principe : on stocke ce qui a été MESURÉ ou SAISI, jamais ce qui se calcule.
// La dérive cardiaque, l'efficience aérobie, le temps d'arrêt, la série de
// travail : tout cela se recalcule à la volée à partir des données brutes.
// Un chiffre calculé qu'on stockerait deviendrait faux le jour où la règle
// de calcul change.
//
// Ce fichier ne contient aucune règle d'entraînement. Il décrit des formes.

export const VERSION_FORMAT = 1;

// ===========================================================================
// SÉANCE DE COURSE — issue d'un CSV COROS
// ===========================================================================
// {
//   id: "course-2026-09-04T10:47:33",
//   date: "2026-09-04T10:47:33",   // extraite du NOM du fichier, jamais du contenu
//   source: { type: "coros", fichier: "Loire-AtlantiqueCourse20260904104733.csv" },
//
//   structure: "kilometres" | "etapes",
//   structureDetecteeAutomatiquement: true,   // false si Thomas a corrigé
//
//   splits: [ Split ],      // lignes du fichier, hors ligne "Summary"
//   resume: Split,          // la ligne "Summary"
//
//   // Ce que le fichier ne contient pas et que Thomas saisit à l'import :
//   saisie: {
//     type: "sortie-longue",       // voir TYPES_QUALITE / TYPES_SANS_DELAI
//     titre: "SL pic",
//     temperatureC: 26,            // OBLIGATOIRE : le capteur COROS est au
//                                  // poignet et surestime de 5 à 10 °C
//     ressenti: 3,                 // 1 à 5
//     glucides: [ { aliment: "gel", quantite: 2 } ],
//     douleurs: "",
//     note: "",
//   },
// }
//
// Split — un objet par ligne du CSV :
// {
//   libelle: "1" | "Summary",
//   tempsS: 8621,            // "Time", converti en secondes
//   tempsMobileS: 8420,      // "Moving Time"
//   distanceKm: 1,           // "GetDistance"
//   dPlusM: 12, dMoinsM: 13,
//   allureS: 375,            // "Avg Pace", secondes par km
//   allureMobileS: 372,
//   meilleureAllureS: 344,
//   cadence: 150,            // "Avg Run Cadence" × 2 — le fichier donne les
//   cadenceMax: 160,         // FOULÉES, pas les pas
//   fouleeCm: 107,           // "Avg Stride Length"
//   fcMoy: 141, fcMax: 163,
//   calories: 515,
// }
//
// La colonne "Avg Temperature" du CSV est délibérément absente du modèle :
// elle est fausse et ne doit jamais être lue.

// ===========================================================================
// SÉANCE DE SALLE — issue d'un texte Hevy
// ===========================================================================
// {
//   id: "salle-2026-09-08T16:44",
//   date: "2026-09-08T16:44",
//   source: { type: "hevy", texteBrut: "..." },   // le texte collé, conservé tel quel
//   seance: "B",                                  // A · B · C_chargee · C_legere · libre
//
//   exercices: [
//     {
//       exerciceId: "curl-poulie",   // null tant que le nom n'est pas associé
//       nomBrut: "Curl biceps poulie",
//       series: [
//         { chargeKg: 16, reps: 15, echauffement: false },
//         { chargeKg: 18, reps: 12, echauffement: false },
//         { dureeS: 40 },            // séries au temps (gainage)
//         { reps: 10 },              // séries au poids du corps
//       ],
//     },
//   ],
//
//   saisie: { rir: 2, douleurs: "", ressenti: 4, note: "" },
// }

// ===========================================================================
// CHECK-IN DU DIMANCHE SOIR
// ===========================================================================
// {
//   date: "2026-09-13",
//   poidsKg: 70.8,          // pesée du MATIN, à jeun
//   sommeilH: 7.5,
//   alcool: 0,              // nombre de verres dans la semaine
//   proteinesG: 120,        // moyenne quotidienne estimée
//   etatJambes: 3,          // 1 (détruites) à 5 (fraîches)
//   douleurs: "",
//   note: "",
// }

// ===========================================================================
// ÉTAT DE PROGRESSION — un enregistrement par exercice
// ===========================================================================
// {
//   exerciceId: "curl-poulie",
//   mode: "LINEAIRE" | "DOUBLE",
//   chargeKg: 20,
//   echecsConsecutifs: 0,
//   depuis: "2026-09-08",       // date de la dernière évolution de charge
// }

// ===========================================================================
// L'ÉTAT COMPLET
// ===========================================================================

export function etatVide() {
  return {
    meta: {
      versionFormat: VERSION_FORMAT,
      creeLe: new Date().toISOString(),
      derniereSauvegarde: null,
    },
    seancesCourse: [],
    seancesSalle: [],
    checkins: [],
    progression: {},
    // Séances cochées à la main, quand la donnée n'a pas encore été importée.
    // Clé : "2026-09-09:course" ou "2026-09-09:salle".
    coches: {},
    // Noms Hevy déjà associés à un exercice du catalogue.
    // Alimenté par Thomas à l'import, jamais deviné : { "Squat (Barre)": "squat-guide" }
    associationsHevy: {},
    // Ce qui a déjà été envoyé au coach, pour ne pas renvoyer deux fois la
    // même chose : [ { date, jusquA } ]
    exportsCoach: [],
  };
}

// ===========================================================================
// EXPORT ET IMPORT JSON
// ===========================================================================
// Format documenté, stable, relisible par un humain. C'est la seule
// sauvegarde : elle doit pouvoir tout restaurer, seule.

export function exporterJson(etat) {
  const paquet = {
    format: "entrainement",
    version: VERSION_FORMAT,
    exporteLe: new Date().toISOString(),
    donnees: etat,
  };
  return JSON.stringify(paquet, null, 2);
}

export function importerJson(texte) {
  let paquet;
  try {
    paquet = JSON.parse(texte);
  } catch (e) {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }

  if (paquet.format !== "entrainement") {
    throw new Error("Ce fichier n'est pas une sauvegarde de l'application.");
  }

  if (typeof paquet.version !== "number") {
    throw new Error("Sauvegarde sans numéro de version : impossible à relire.");
  }

  if (paquet.version > VERSION_FORMAT) {
    throw new Error(
      `Cette sauvegarde vient d'une version plus récente de l'application ` +
        `(format ${paquet.version}, cette version lit jusqu'au ${VERSION_FORMAT}). ` +
        `Mets l'application à jour avant de l'importer.`
    );
  }

  const etat = migrer(paquet.donnees, paquet.version);

  for (const cle of ["seancesCourse", "seancesSalle", "checkins"]) {
    if (!Array.isArray(etat[cle])) {
      throw new Error(`Sauvegarde incomplète : « ${cle} » est absent ou corrompu.`);
    }
  }

  // Champs ajoutés après coup : une sauvegarde ancienne reste lisible.
  etat.progression = etat.progression || {};
  etat.associationsHevy = etat.associationsHevy || {};
  etat.exportsCoach = etat.exportsCoach || [];
  etat.coches = etat.coches || {};

  return etat;
}

// Quand le format évoluera, chaque montée de version ajoutera une étape ici.
// Une sauvegarde ancienne doit rester lisible : c'est le seul filet de Thomas.
function migrer(donnees, depuis) {
  let etat = donnees;
  if (depuis === VERSION_FORMAT) return etat;
  // if (depuis < 2) { etat = ... ; }
  return etat;
}

export function resumeSauvegarde(etat) {
  return {
    courses: etat.seancesCourse.length,
    salles: etat.seancesSalle.length,
    checkins: etat.checkins.length,
    derniereSauvegarde: etat.meta.derniereSauvegarde,
  };
}
