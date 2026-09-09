// ZONES, ALLURES ET NUTRITION — donnée de configuration, jamais du code.
// Source : recalibrage du 30/08/2026 sur données de terrain, validé par trois
// sorties longues. NE PAS remplacer par un découpage générique en % d'âge.

export const REPERES = {
  fcMax: 188, // mesurée, jamais estimée d'après l'âge
  vmaKmH: 16.4, // test 6 min du 14/07/2026
  allureVma: "3:39/km",
  vo2maxEstime: 60,
  poidsKg: 71,
  tailleM: 1.81,
};

// Les bornes de FC font foi. Les allures sont indicatives : Thomas court
// systématiquement 5 à 10 s/km plus vite que prescrit, mais exactement à la
// FC demandée. La FC est la variable de commande, l'allure est observée.
export const ZONES = [
  { id: "recup", nom: "Récup / footing lent", fc: [null, 140], allure: "5:45-6:00",
    usage: "Échauffement, retour au calme, semaine de récup" },
  { id: "ef", nom: "Endurance fondamentale", fc: [140, 150], allure: "5:20-5:40",
    usage: "Gros du volume, sorties longues" },
  { id: "endurance-active", nom: "Endurance active", fc: [150, 158], allure: "5:00-5:15",
    usage: "Fin de sortie longue, blocs progressifs" },
  { id: "seuil", nom: "Seuil (tempo)", fc: [160, 168], allure: "4:15-4:20",
    usage: "La séance la plus rentable pour les deux objectifs" },
  { id: "allure-10km", nom: "Allure 10 km", fc: [172, 180], allure: "4:11",
    usage: "Course du 18/10" },
  { id: "vma-longue", nom: "VMA longue", fc: [175, 185], allure: "3:50-4:00",
    usage: "Fractionné long" },
  { id: "vma-courte", nom: "VMA courte (30\"-1')", fc: [185, 188], allure: "3:30-3:40",
    usage: "Vivacité, lignes droites" },
];

export const REGLES_ZONES = [
  "Piloter à la FC, l'allure suit.",
  "Les zones affichées par Strava sont estimées d'après l'âge et sont fausses. Toujours recaler sur 188.",
  "Au-dessus de 25-28 °C, ajouter 5 à 10 bpm à toutes les cibles : c'est de la dérive thermique, pas de l'excès d'intensité.",
];

export const CORRECTION_CHALEUR = { seuilCelsius: 25, bpmAjoutes: [5, 10] };

export const CADENCE = {
  actuelleEf: [149, 152], // pas/min
  actuelleRapide: [160, 162],
  objectif: [165, 170],
  consigne:
    "À travailler uniquement sur les lignes droites de fin de footing, " +
    "jamais pendant une sortie longue.",
};

// ---------------------------------------------------------------- NUTRITION

export const GLUCIDES = {
  // Cibles en grammes par heure, selon la durée prévue de la séance.
  cibles: [
    { dureeMaxMinutes: 90, gParHeure: 0 },
    { dureeMaxMinutes: 120, gParHeure: 60 },
    { dureeMaxMinutes: null, gParHeure: 70 },
  ],
  plafondGlucoseSeul: 60,
  plafondGlucoseFructose: 90, // ratio 2:1
  regleSimple:
    "1 gel OU 2 pâtes de fruit toutes les 30 minutes, + boisson en continu " +
    "par petites gorgées toutes les 10 min. Donne 65-75 g/h naturellement.",
};

// Valeurs de référence pour convertir ce qui a été pris en grammes.
export const ALIMENTS = {
  gel: 25,
  "pate-de-fruit": 15,
  "boisson-iso-500ml": 30,
  banane: 25,
  "barre-cereales": 20,
};

export const HYDRATATION = {
  normale: [500, 750], // ml/h
  chaleur: [750, 1000], // ml/h au-dessus de 25 °C, avec sel ou électrolytes
  seuilChaleurCelsius: 25,
};

export const REGLES_NUTRITION = [
  "Commencer à manger à 30 minutes, même sans faim. Alerte répétée toutes les 30 min sur la COROS.",
  "Toujours quelques gorgées d'eau pure avec chaque gel, jamais avec la boisson iso : trop concentré, nausées.",
  "Alterner liquide / gel / solide. Ne pas tout miser sur les gels.",
  "Manger et boire en marchant, pas à l'arrêt.",
  "Rien de nouveau le jour J. Tout ce qui sera pris le 26/09 doit avoir été testé les 13 et 20/09.",
  "Varier les saveurs : jamais 5 gels du même parfum.",
  "Introduire du salé (TUC, chips, gâteaux apéro). Les ravitos servent coca et TUC.",
  "Séparer l'eau pure de la boisson sucrée : une flasque de chaque.",
];

// Problème identifié le 04/09 : le volume de glucides est atteint (62 g/h)
// mais saturation sucrée en fin de sortie dès 2h45. Sur 5h10 c'est un risque
// d'abandon nutritionnel. Les trois derniers points ci-dessus sont les
// correctifs, à tester le 13/09.

export const QUOTIDIEN = {
  kcalMaintien: 3000,
  kcalConstruction: 3250, // à partir du 19/10
  proteinesG: [115, 135], // ≈ 1,6-1,9 g/kg à 71 kg
  postSeanceSalle: "Glucides + protéines dans l'heure.",
  prisePoidsCibleGParSemaine: [200, 300], // en bloc construction
  jourDePesee: "mardi", // au réveil, à jeun
  poidsReference: { date: "2026-09-01", kg: 70.8 },
};

// Dotation prévue pour le trail du 26/09 (~5h10) :
// 5 gels + 6 pâtes de fruit + 1,5 L de boisson + 2 prises aux ravitaillements
// = ~355 g, soit ~69 g/h.
export const DOTATION_TRAIL = {
  course: "trail-54",
  gel: 5,
  "pate-de-fruit": 6,
  boissonMl: 1500,
  prisesRavitaillement: 2,
  totalGEstime: 355,
  gParHeureEstime: 69,
};
