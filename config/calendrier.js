// CALENDRIER, PHASES ET ARBITRAGE — donnée de configuration, jamais du code.
// Source : réponses de Thomas du 09/09/2026, corrigées des écarts réels
// (la sortie longue pic prévue le 06/09 a été faite le 04/09).
//
// Les dates sont au format ISO AAAA-MM-JJ, bornes incluses.

export const COURSES = [
  {
    id: "trail-54",
    nom: "Trail Nantes → Montaigu",
    date: "2026-09-26",
    heureDepart: "11:00",
    distanceKm: 54,
    deniveleM: 630,
    objectif: "sub 5h15",
    allureCible: "5:50/km ravitos compris",
    planB: "5h15 à 5h30",
    pointDeControle: "~2h37 au km 27. Au-delà de 2h42, basculer sur 5h30 sans forcer.",
    fcPlafond: [
      { jusquAuKm: 25, max: 155 },
      { jusquAuKm: 40, max: 162 },
      { jusquAuKm: 54, max: null },
    ],
  },
  {
    id: "10km",
    nom: "10 km Saint-Jean-de-Monts",
    date: "2026-10-18",
    distanceKm: 10,
    profil: "plat, bord de mer",
    objectif: "sub 42:00",
    allureCible: "4:11/km",
    planB: "42:30 à 43:00",
  },
  {
    id: "marathon",
    nom: "Marathon",
    date: "2027-04-04",
    distanceKm: 42.195,
    objectif: null,
  },
];

// PHASES — pilotées par les dates de course. Déterminent ce qui est autorisé.
//
// salle : "libre"              -> A, B et C (version autorisée par basDuCorpsCharge)
//         "haut-du-corps-seul" -> A et B uniquement, jamais C
//         "interdite"          -> aucune séance, l'appli refuse et dit pourquoi
// dernierJourSalle : dernière date où la salle est ouverte dans la phase.
//                    Au-delà, plus rien jusqu'à la fin de la phase.
//
// Arbitré le 10/09/2026 : le haut du corps n'est plus bloqué par le calendrier
// course. Seul le BAS du corps l'est, parce que lui seul entre en concurrence
// avec les jambes. Le haut du corps ne s'interrompt qu'à l'approche immédiate
// d'une course et le temps de la récupération post-trail.
export const PHASES = [
  {
    id: "S4",
    nom: "Affûtage 1",
    debut: "2026-09-07",
    fin: "2026-09-13",
    autorite: "course",
    salle: "libre",
    basDuCorpsCharge: false,
  },
  {
    id: "S5",
    nom: "Affûtage 2",
    debut: "2026-09-14",
    fin: "2026-09-20",
    autorite: "course",
    salle: "libre",
    basDuCorpsCharge: false,
  },
  {
    id: "SC",
    nom: "Semaine de course",
    debut: "2026-09-21",
    fin: "2026-09-26",
    autorite: "course",
    salle: "haut-du-corps-seul",
    dernierJourSalle: "2026-09-23", // J-3 avant le trail
    basDuCorpsCharge: false,
    raisonRefus:
      "Trail 54 km le 26/09 : plus aucune séance de salle à partir du 24/09, " +
      "pour arriver frais au départ.",
  },
  {
    id: "R1",
    nom: "Récupération post-trail",
    debut: "2026-09-27",
    fin: "2026-10-01",
    autorite: "course",
    salle: "interdite",
    basDuCorpsCharge: false,
    raisonRefus:
      "Récupération sacrée après 54 km : repos quasi total jusqu'au 01/10. " +
      "Reprise du haut du corps le 02/10.",
  },
  {
    id: "R1b",
    nom: "Reprise haut du corps",
    debut: "2026-10-02",
    fin: "2026-10-04",
    autorite: "course",
    salle: "haut-du-corps-seul",
    basDuCorpsCharge: false,
  },
  {
    id: "R2",
    nom: "Réactivation",
    debut: "2026-10-05",
    fin: "2026-10-11",
    autorite: "course",
    salle: "haut-du-corps-seul",
    basDuCorpsCharge: false,
  },
  {
    id: "R3",
    nom: "Affûtage court",
    debut: "2026-10-12",
    fin: "2026-10-18",
    autorite: "course",
    salle: "haut-du-corps-seul",
    dernierJourSalle: "2026-10-13", // puis plus rien jusqu'au 10 km
    basDuCorpsCharge: false,
    raisonRefus: "10 km le 18/10 : plus aucune séance de salle à partir du 14/10.",
  },
  {
    id: "CONSTRUCTION",
    nom: "Bloc construction musculaire",
    debut: "2026-10-19",
    fin: "2026-12-31",
    autorite: "salle",
    salle: "libre",
    basDuCorpsCharge: true,
  },
];

// INTERDITS DATÉS — l'appli refuse de proposer, et dit pourquoi.
export const INTERDITS = [
  {
    quoi: ["squat-guide", "souleve-terre-roumain", "presse-cuisses"],
    jusquA: "2026-10-18",
    raison: "Aucune charge lourde sur le bas du corps avant la fin du bloc course (19/10).",
  },
  {
    quoi: ["nordic-curl"],
    jusquA: "2026-10-18",
    raison: "Jamais pratiqué : 4 à 6 jours de courbatures profondes. Pas avant le 19/10.",
  },
];

// DÉLAIS ENTRE SÉANCES — en heures.
export const DELAIS = [
  {
    de: "seance-C",
    vers: "course-qualite",
    heures: 48,
    raison: "48 h minimum entre une séance de jambes et une séance de qualité en course.",
  },
  {
    de: "seance-C",
    vers: "sortie-longue",
    heures: 48,
    raison: "Volume d'impacts sur jambes courbaturées : la foulée se dégrade.",
  },
  {
    de: "seance-A",
    vers: "course",
    heures: 0,
    raison: "Haut du corps : aucun délai. Même journée possible, la course passe en premier.",
  },
  {
    de: "seance-B",
    vers: "course",
    heures: 0,
    raison: "Haut du corps : aucun délai. Même journée possible, la course passe en premier.",
  },
  {
    de: "groupe-musculaire",
    vers: "lui-meme",
    heures: 48,
    heuresMax: 72,
    raison: "48 à 72 h entre deux sollicitations du même groupe musculaire.",
  },
];

// SÉANCES DE COURSE QUALIFIÉES « QUALITÉ » — déclenchent le délai de 48 h
// après une séance C. Toute séance non listée ici n'impose aucun délai.
export const TYPES_QUALITE = ["seuil", "vma", "fractionne", "cotes", "test", "sortie-longue"];

export const TYPES_SANS_DELAI = ["ef", "recuperation", "lignes-droites", "activation", "deverrouillage"];

// RÈGLES DE FONCTIONNEMENT — affichées à l'utilisateur, jamais appliquées
// automatiquement par le code. Ce sont des règles de jugement.
export const REGLES = [
  "Régularité : 3 sorties par semaine, toutes les semaines.",
  "Si une séance saute, c'est la qualité qui saute, jamais la sortie longue. On ne rattrape pas la semaine suivante.",
  "La vie passe avant le plan : on décale, on ne cumule pas.",
  "Douleur vive ou qui modifie la foulée = arrêt de la séance. Une gêne qui part à l'échauffement, on continue en surveillant.",
  "Jusqu'au 18/10, le plan course commande, pas le programme salle. En cas de conflit, la course tranche.",
];

// PLAN DE COURSE PRÉVU — état au 09/09/2026.
// type : voir TYPES_QUALITE et TYPES_SANS_DELAI.
export const SEANCES_COURSE_PREVUES = [
  {
    date: "2026-09-09",
    type: "vma",
    titre: "VMA 8×1'",
    detail: "20' EF + 8×1' à 3:50-3:55 (r1') + 10' RC",
    condition: "À valider au réveil selon les courbatures, sinon décalée au vendredi.",
  },
  { date: "2026-09-11", type: "ef", titre: "EF 40'", detail: "EF 40' + 4 lignes droites" },
  {
    date: "2026-09-13",
    type: "sortie-longue",
    titre: "SL réduite 1h30",
    detail: "~16 km, FC < 150",
    condition: "Test des nouvelles saveurs de nutrition.",
  },
  {
    date: "2026-09-16",
    type: "activation",
    titre: "Activation 5×1'",
    detail: "20' EF + 5×1' à allure course (r1') + 10' RC",
  },
  { date: "2026-09-18", type: "ef", titre: "EF 35'", detail: "EF 35' + 4 lignes" },
  {
    date: "2026-09-20",
    type: "sortie-longue",
    titre: "Sortie 1h10 dont 15' allure course",
    detail: "~12 km",
    condition: "Répétition du timing jour J : petit-déjeuner 3 h avant, départ simulé 11h.",
  },
  { date: "2026-09-22", type: "ef", titre: "EF 30'", detail: "EF 30' + 4 lignes" },
  { date: "2026-09-24", type: "ef", titre: "Footing 25'", detail: "Footing 25' + 2 lignes" },
  { date: "2026-09-25", type: "repos", titre: "Repos total", detail: "Dossard, matériel, nutrition pré-comptée" },
  { date: "2026-09-26", type: "course", titre: "TRAIL 54 KM", detail: "Départ 11h00", course: "trail-54" },
  {
    date: "2026-10-01",
    type: "test",
    titre: "Test de l'escalier",
    detail: "Descendre un escalier sans douleur",
  },
  {
    date: "2026-10-03",
    type: "recuperation",
    titre: "Footing test 30'",
    detail: "Très lent, 5:45-6:00",
    condition: "Uniquement si le test de l'escalier passe.",
  },
  { date: "2026-10-04", type: "ef", titre: "EF 45'", detail: "Tranquille — ou repos si ça tire" },
  {
    date: "2026-10-07",
    type: "vma",
    titre: "Réveil vitesse 8×45\"",
    detail: "20' EF + 8×45\" à 4:05-4:10 (r1'15) + 10' RC",
  },
  { date: "2026-10-09", type: "ef", titre: "EF 45'", detail: "EF 45' + 6 lignes" },
  {
    date: "2026-10-11",
    type: "test",
    titre: "SÉANCE TEST 3×8'",
    detail: "20' EF + 3×8' à 4:10-4:12 (r2') + 10' RC",
    condition: "Décide de la stratégie de chrono du 18/10. Doit être faite sur jambes fraîches.",
  },
  {
    date: "2026-10-14",
    type: "seuil",
    titre: "Rappel 5×2'",
    detail: "20' EF + 5×2' à 4:05-4:10 (r1'30) + 10' RC",
  },
  { date: "2026-10-16", type: "ef", titre: "EF 30'", detail: "EF 30' + 4 lignes" },
  { date: "2026-10-17", type: "deverrouillage", titre: "Déverrouillage 15'", detail: "15' + 3 lignes" },
  { date: "2026-10-18", type: "course", titre: "10 KM", detail: "Objectif sub 42:00", course: "10km" },
];

// SÉANCES DE SALLE PRÉVUES — état au 09/09/2026.
export const SEANCES_SALLE_PREVUES = [
  { date: "2026-09-07", seance: "C_legere", fait: true },
  { date: "2026-09-08", seance: "B", fait: true },
  { date: "2026-09-15", seance: "A", detail: "Haut du corps léger + gainage" },
  { date: "2026-10-13", seance: "A", detail: "Haut du corps très léger, puis plus rien avant le 18/10" },
];

// Les séances de salle prévues ci-dessus datent du plan initial, qui fermait
// la salle pendant tout le bloc course. Elles seront régénérées à partir de
// SEMAINE_TYPE et des phases, maintenant que le haut du corps est ouvert.
