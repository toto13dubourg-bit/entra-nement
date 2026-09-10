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
    detail: "Pectoraux / épaules / triceps",
    lignes: [
      { exercice: "developpe-couche-halteres", series: 4, reps: [8, 10], role: "principal",
        consigne: "Haltères plutôt que barre : meilleure amplitude, épaules protégées, plus sûr seul." },
      { exercice: "dips", series: 3, reps: [8, 12], role: "principal",
        alternative: "developpe-incline-halteres",
        consigne: "Maximum à établir avant la première prescription. Si moins de 8 reps propres, basculer sur l'alternative." },
      { exercice: "developpe-epaules-machine", series: 3, reps: [8, 10], role: "secondaire",
        alternative: "developpe-militaire-halteres",
        consigne: "La machine permet une progression au cran, plus régulière que les haltères en solo." },
      { exercice: "elevations-laterales", series: 4, reps: [12, 15], role: "isolation",
        consigne: "Léger, propre, jamais d'élan." },
      { exercice: "extension-triceps-overhead", series: 3, reps: [10, 12], role: "isolation" },
      { exercice: "planche", series: 3, reps: [40, 40], unite: "secondes", role: "gainage" },
    ],
    optionnel: [
      { exercice: "ecarte-poulie-haute", series: 3, reps: [10, 12], role: "isolation",
        consigne: "Si le temps le permet : étirement du pec, complément du développé." },
    ],
  },

  B: {
    id: "B",
    nom: "B — Tirage",
    detail: "Dos / biceps",
    lignes: [
      { exercice: "tirage-vertical", series: 4, reps: [8, 10], role: "principal",
        consigne: "Deviendra « tractions » quand le maximum sera établi. Pas de machine à tractions assistées dans la salle." },
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
      { exercice: "presse-cuisses", series: 3, reps: [10, 12], role: "isolation",
        consigne: "Volume quadriceps sans charge sur la colonne." },
      { exercice: "leg-curl-assis", series: 3, reps: [10, 12], role: "isolation",
        consigne: "Ischios. La machine existe : c'est un leg curl assis." },
      { exercice: "extension-mollet", series: 4, reps: [12, 15], role: "isolation",
        consigne: "Descente lente 3 s. Protège le tendon d'Achille." },
      { exercice: "step-down", series: 3, reps: [10, 10], unite: "reps/jambe", role: "secondaire",
        alternative: "fentes-marchees",
        consigne: "3 s à la descente. Excentrique quadriceps : LA clé des descentes en trail. À garder toute l'année." },
    ],
    optionnel: [
      { exercice: "abducteurs", series: 3, reps: [12, 15], role: "isolation",
        consigne: "Moyen fessier : stabilité du genou sur les longues descentes." },
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

// Pourquoi A le mardi et B le jeudi, et pas l'inverse : la séance C du lundi
// contient le soulevé de terre roumain, qui sollicite le bas du dos. La séance
// B contient le rowing, qui le sollicite aussi. Les espacer de trois jours
// plutôt que d'un seul est le seul argument objectif — arbitré le 10/09/2026,
// l'ordre n'ayant jamais été fixé auparavant.

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
//
// Arbitré le 10/09/2026 : la règle « +2,5 kg haut du corps / +5 kg bas du
// corps » est abandonnée, aucun matériel de la salle ne permettant ces pas.
// Les haltères et les poulies montent par 2 kg, les barres par 2 × le plus
// petit disque, les machines par leur cran de colonne.
// Arbitré le 10/09/2026 : les séries de travail sont des SÉRIES DROITES —
// même charge sur toutes les séries prescrites. La montée en charge se fait
// en échauffement, pas en séries de travail. Les séances du 07 et 08/09
// étaient en pyramide (16-18-20) ; ce n'est plus la méthode retenue.
export const PROGRESSION = {
  seriesDroites: true,
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
