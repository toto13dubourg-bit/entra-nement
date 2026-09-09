// CATALOGUE DES EXERCICES — c'est une donnée, pas du code.
// Modifiable librement sans toucher au reste de l'application.
//
// disponible : false  -> l'exercice ne sera jamais proposé (machine absente de la salle).
// pas        : incrément de charge en kg. null = valeur inconnue, aucune progression
//              ne sera proposée tant qu'elle n'est pas remplie.
// charge     : "ajoutee" (seuls les disques comptent) · "totale" (colonne de plaques)
//              "corps" (poids du corps) · "corps-leste" (poids du corps + lest possible)
// nomsHevy   : noms exacts vus dans un export Hevy réel. Les noms inconnus rencontrés
//              à l'import sont proposés à l'association, jamais devinés.

export const GROUPES = {
  jambes: "Jambes",
  mollets: "Mollets",
  dos: "Dos",
  pecs: "Pectoraux",
  epaules: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
};

export const CATALOGUE = [
  // ---------------------------------------------------------------- JAMBES
  {
    id: "squat-guide",
    nom: "Squat (barre guidée)",
    groupe: "jambes",
    materiel: "Barre de squat guidé (rails)",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : plus petit disque disponible
    nomsHevy: ["Squat (Barre)"],
  },
  {
    id: "souleve-terre-roumain",
    nom: "Soulevé de terre roumain",
    groupe: "jambes",
    materiel: "Barre",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : plus petit disque disponible
    nomsHevy: [],
  },
  {
    id: "presse-cuisses",
    nom: "Presse à cuisses horizontale",
    groupe: "jambes",
    materiel: "Presse horizontale (broche)",
    disponible: true,
    charge: "totale",
    pas: null, // à confirmer : cran réel de la colonne
    nomsHevy: ["Presse à Cuisses Horizontale"],
  },
  {
    id: "leg-curl",
    nom: "Leg curl",
    groupe: "jambes",
    materiel: "Machine leg curl (broche)",
    disponible: true,
    charge: "totale",
    pas: null, // à confirmer : cran réel de la colonne
    nomsHevy: [],
  },
  {
    id: "abducteurs",
    nom: "Abducteurs assis",
    groupe: "jambes",
    materiel: "Machine abducteurs (broche)",
    disponible: true,
    charge: "totale",
    pas: null, // à confirmer : cran réel de la colonne
    nomsHevy: [],
  },
  {
    id: "step-up",
    nom: "Step-up",
    groupe: "jambes",
    materiel: "Cube + haltères",
    disponible: true,
    charge: "corps-leste",
    pas: 2, // paire d'haltères, plus petit écart réel
    nomsHevy: [],
  },
  {
    id: "fentes-halteres",
    nom: "Fentes (haltères)",
    groupe: "jambes",
    materiel: "Haltères",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
  },

  // --------------------------------------------------------------- MOLLETS
  {
    id: "extension-mollet-1-jambe",
    nom: "Extension mollet une jambe",
    groupe: "mollets",
    materiel: "Cube ou marche",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
  },

  // ------------------------------------------------------------------- DOS
  {
    id: "tractions",
    nom: "Tractions",
    groupe: "dos",
    materiel: "Barre de tractions",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
    note: "Jamais testé à ce jour. Établir un maximum avant toute prescription.",
  },
  {
    id: "tirage-vertical",
    nom: "Tirage vertical",
    groupe: "dos",
    materiel: "Poulie verticale assis",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "rowing-poulie-v",
    nom: "Rowing poulie prise V",
    groupe: "dos",
    materiel: "Poulie horizontale assis",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "tirage-bras-tendus",
    nom: "Tirage bras tendus",
    groupe: "dos",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "rowing-barre",
    nom: "Rowing barre",
    groupe: "dos",
    materiel: "Barre",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : plus petit disque disponible
    nomsHevy: [],
  },
  {
    id: "rowing-haltere",
    nom: "Rowing haltère unilatéral",
    groupe: "dos",
    materiel: "Haltères + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },

  // -------------------------------------------------------------- PECTORAUX
  {
    id: "developpe-couche",
    nom: "Développé couché",
    groupe: "pecs",
    materiel: "Barre + banc",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : plus petit disque disponible
    nomsHevy: [],
  },
  {
    id: "developpe-incline-halteres",
    nom: "Développé incliné (haltères)",
    groupe: "pecs",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "developpe-halteres",
    nom: "Développé couché (haltères)",
    groupe: "pecs",
    materiel: "Haltères + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "ecarte-halteres",
    nom: "Écarté (haltères)",
    groupe: "pecs",
    materiel: "Haltères + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "ecarte-poulie",
    nom: "Écarté à la poulie",
    groupe: "pecs",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "dips",
    nom: "Dips",
    groupe: "pecs",
    materiel: "Barre à dips",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
  },

  // ---------------------------------------------------------------- ÉPAULES
  {
    id: "developpe-epaules-machine",
    nom: "Développé épaules (machine)",
    groupe: "epaules",
    materiel: "Machine épaules (broche)",
    disponible: true,
    charge: "totale",
    pas: null, // à confirmer : cran réel de la colonne
    nomsHevy: [],
  },
  {
    id: "developpe-epaules-halteres",
    nom: "Développé épaules (haltères)",
    groupe: "epaules",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "elevations-laterales",
    nom: "Élévations latérales",
    groupe: "epaules",
    materiel: "Haltères",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "oiseau",
    nom: "Oiseau (arrière d'épaule)",
    groupe: "epaules",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },

  // ----------------------------------------------------------------- BICEPS
  {
    id: "curl-incline",
    nom: "Curl incliné (haltères)",
    groupe: "biceps",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
    note: "Remplace le « curl pupitre » loggé le 08/09 : pas de banc pupitre dans la salle.",
  },
  {
    id: "curl-barre-w",
    nom: "Curl barre en W",
    groupe: "biceps",
    materiel: "Barre en W",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : plus petit disque disponible
    nomsHevy: [],
  },
  {
    id: "curl-marteau",
    nom: "Curl marteau (haltères)",
    groupe: "biceps",
    materiel: "Haltères",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "curl-poulie",
    nom: "Curl biceps poulie",
    groupe: "biceps",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },

  // ---------------------------------------------------------------- TRICEPS
  {
    id: "extension-triceps-poulie",
    nom: "Extension triceps poulie",
    groupe: "triceps",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "barre-au-front",
    nom: "Barre au front",
    groupe: "triceps",
    materiel: "Barre en W + banc",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : plus petit disque disponible
    nomsHevy: [],
  },
  {
    id: "extension-nuque-haltere",
    nom: "Extension nuque (haltère)",
    groupe: "triceps",
    materiel: "Haltère + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
];

// Matériel présent dans la salle mais volontairement absent du catalogue de
// musculation : vélo, rameur, tapis de course (cardio, gérés côté course).
//
// Matériel ABSENT de la salle, confirmé le 09/09/2026 — ne jamais proposer
// d'exercice qui en dépend : machine à pectoraux (développé assis, pec deck),
// leg extension, machine à mollets, banc pupitre, machine à tractions assistées.
