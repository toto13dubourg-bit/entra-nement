// PROGRAMME DE MUSCULATION — donnée de configuration, jamais du code.
// Source : réponses de Thomas du 09/09/2026 (Plan VF.xlsx rév. 29/08 + récap 07/09).
//
// Chaque ligne de séance porte sa propre fourchette de répétitions et son
// nombre de séries : c'est ce couple qui pilote le moteur de progression.
// unite : "reps" (défaut) · "secondes" · "reps/cote" · "reps/jambe" · "reps/bras"

export const SEANCES = {
  A: {
    id: "A",
    nom: "A — Poussée",
    detail: "Pectoraux / triceps / épaules",
    lignes: [
      { exercice: "developpe-couche-halteres", series: 4, reps: [8, 10], role: "principal" },
      { exercice: "developpe-militaire-halteres", series: 3, reps: [8, 10], role: "secondaire" },
      { exercice: "ecarte-poulie-haute", series: 3, reps: [10, 12], role: "isolation" },
      { exercice: "elevations-laterales", series: 4, reps: [12, 15], role: "isolation" },
      { exercice: "extension-triceps-overhead", series: 3, reps: [10, 12], role: "isolation" },
      { exercice: "planche", series: 3, reps: [40, 40], unite: "secondes", role: "gainage" },
    ],
  },

  B: {
    id: "B",
    nom: "B — Tirage",
    detail: "Dos / biceps",
    lignes: [
      { exercice: "tirage-vertical", series: 4, reps: [8, 10], role: "principal" },
      { exercice: "rowing-haltere", series: 4, reps: [10, 10], unite: "reps/bras", role: "principal" },
      { exercice: "tirage-horizontal", series: 3, reps: [10, 12], role: "secondaire" },
      { exercice: "curl-incline", series: 3, reps: [10, 12], role: "isolation" },
      { exercice: "face-pull", series: 3, reps: [15, 15], role: "isolation" },
      { exercice: "planche-laterale", series: 2, reps: [30, 30], unite: "secondes", role: "gainage" },
    ],
  },

  // La séance C existe en deux versions. Laquelle s'applique dépend de la
  // phase en cours (voir config/calendrier.js) : version allégée jusqu'au
  // 18/10/2026, version chargée à partir du 19/10/2026.
  C_chargee: {
    id: "C_chargee",
    nom: "C — Bas du corps (chargée)",
    detail: "À partir du 19/10/2026 uniquement",
    lignes: [
      { exercice: "squat-guide", series: 4, reps: [6, 8], role: "principal" },
      { exercice: "souleve-terre-roumain", series: 3, reps: [8, 10], role: "secondaire",
        consigne: "Descente 3 s, dos plat." },
      { exercice: "presse-cuisses", series: 3, reps: [10, 12], role: "isolation" },
      { exercice: "fentes-marchees", series: 3, reps: [10, 10], unite: "reps/jambe", role: "secondaire",
        alternative: "split-squat-bulgare" },
      { exercice: "extension-mollet", series: 4, reps: [12, 15], role: "isolation",
        consigne: "Descente lente 3 s." },
      { exercice: "step-down", series: 2, reps: [10, 10], unite: "reps/jambe", role: "secondaire",
        consigne: "3 s à la descente. À garder toute l'année." },
    ],
  },

  C_legere: {
    id: "C_legere",
    nom: "C — Bas du corps (poids du corps)",
    detail: "Version sans charge, en vigueur jusqu'au 18/10/2026",
    lignes: [
      { exercice: "step-down", series: 3, reps: [10, 10], unite: "reps/jambe", role: "secondaire" },
      { exercice: "fentes-marchees", series: 3, reps: [10, 10], unite: "reps/jambe", role: "secondaire" },
      { exercice: "chaise", series: 3, reps: [45, 45], unite: "secondes", role: "isolation" },
      { exercice: "mollets-excentriques", series: 3, reps: [12, 12], role: "isolation" },
      { exercice: "pont-fessier", series: 3, reps: [12, 12], role: "isolation" },
      { exercice: "planche", series: 3, reps: [40, 40], unite: "secondes", role: "gainage" },
      { exercice: "planche-laterale", series: 2, reps: [30, 30], unite: "secondes", role: "gainage" },
      { exercice: "equilibre-unipodal", series: 2, reps: [30, 30], unite: "secondes", role: "gainage" },
    ],
  },
};

// SEMAINE TYPE — 3 courses + 3 séances de salle.
//
// Contrainte structurelle qui gouverne tout le placement : la séance C
// (jambes) doit tomber le lundi tant que la qualité course est le mercredi.
// 48 h minimum entre les deux. Jamais l'inverse.
export const SEMAINE_TYPE = {
  lundi: { salle: "C", course: null },
  mardi: { salle: "A", course: null },
  mercredi: { salle: null, course: "qualite" },
  jeudi: { salle: "B", course: null },
  vendredi: { salle: null, course: "ef" },
  samedi: { salle: null, course: null, note: "Repos ou mobilité" },
  dimanche: { salle: null, course: "sortie-longue", note: "Séance clé de la semaine" },
};

// À TRANCHER — le programme place A le mardi et B le jeudi, mais le log Hevy
// du mardi 08/09/2026 est une séance de tirage (B). Soit l'ordre a été inversé
// durablement, soit c'était ponctuel. En attendant l'arbitrage de Thomas,
// SEMAINE_TYPE suit le programme écrit.
export const A_TRANCHER = [
  {
    id: "ordre-A-B",
    sujet: "Ordre des séances A et B dans la semaine",
    constat:
      "Programme : A mardi, B jeudi. Réel du 08/09 (mardi) : séance de tirage, donc B.",
    enAttente: true,
  },
  {
    id: "increment-progression",
    sujet: "Incrément de progression réel",
    constat:
      "La règle annoncée est +2,5 kg en haut du corps et +5 kg en bas du corps. " +
      "Or aucun matériel de la salle ne permet ces pas : les haltères montent " +
      "par 2 kg, les poulies par 2 kg, les barres par 2 × le plus petit disque. " +
      "Le catalogue fait foi (champ « pas »), la règle des 2,5/5 kg est ignorée.",
    enAttente: true,
  },
];

// MOTEUR DE PROGRESSION — machine à états déterministe.
//
// Réussite : TOUTES les séries prescrites atteignent au moins reps[0], à RIR 2-3.
// Échec    : au moins une série tombe sous reps[0].
//
// Mode LINÉAIRE (défaut)
//   réussite -> charge + pas ; compteur d'échecs remis à 0
//   échec    -> charge inchangée ; compteur + 1
//   compteur atteint 2 -> bascule en mode DOUBLE, compteur remis à 0
//
// Mode DOUBLE
//   charge bloquée jusqu'à atteindre reps[1] sur TOUTES les séries
//   reps[1] atteint partout -> charge + pas, retour à reps[0], on reste en DOUBLE
//
// L'incrément appliqué est TOUJOURS le champ « pas » du catalogue, c'est-à-dire
// le cran réel de la machine. Si « pas » vaut null, aucune progression n'est
// proposée et l'appli affiche pourquoi.
export const PROGRESSION = {
  modeParDefaut: "LINEAIRE",
  echecsAvantBascule: 2,
  rirCible: [2, 3],
  jamaisEchecMusculaire: true,

  // Série de travail : la charge la plus fréquente de l'exercice ;
  // à égalité, la plus lourde. Neutralise échauffements et séries ratées.
  serieDeTravail: { regle: "plus-frequente", egalite: "plus-lourde" },

  reposSecondes: {
    principal: [120, 150],
    secondaire: [120, 150],
    isolation: [60, 90],
    gainage: [60, 60],
  },

  // Signalement, pas décision : l'appli constate, le coach tranche.
  stagnationSemaines: 3,
  stagnationMessage:
    "Charge inchangée depuis 3 semaines. La cause est la récupération ou " +
    "l'alimentation, pas le programme.",
};

// CALIBRATION DES CHARGES INCONNUES (séance A notamment).
// Méthode à la première séance : série d'échauffement légère à 12 reps, puis
// montée progressive jusqu'à la charge où la dernière rep de la fourchette
// haute est dure mais propre, avec 2-3 reps en réserve. Cette charge devient
// le point de départ.
export const CHARGES_CONNUES = {
  // Relevés au 08/09/2026. Séries de travail, en kg.
  "squat-guide": 30, // charge ajoutée, hors barre
  "souleve-terre-roumain": 30,
  "presse-cuisses": 70,
  "tirage-horizontal": 36,
  "curl-poulie": 18,
  "tirage-bras-tendus": 14,
  "curl-incline": 18,
  "curl-marteau": 6,
};
