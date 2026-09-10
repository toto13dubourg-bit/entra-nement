// PROGRAMME DE MUSCULATION — donnée de configuration, jamais du code.
// Source : réponses de Thomas du 09/09/2026 (Plan VF.xlsx rév. 29/08 + récap 07/09).
//
// Chaque ligne de séance porte sa propre fourchette de répétitions et son
// nombre de séries : c'est ce couple qui pilote le moteur de progression.
// unite : "reps" (défaut) · "secondes" · "reps/cote" · "reps/jambe" · "reps/bras"

// POURQUOI CES SÉANCES SONT CE QU'ELLES SONT — établi le 10/09/2026.
//
// Thomas est un coureur de fond expérimenté, mais un DÉBUTANT en force
// (squat à 30 kg, curl marteau à 6 kg). Les deux statuts commandent des
// choses différentes, et c'est l'arbitrage central du programme.
//
// 1. Le haut et le bas du corps ne suivent pas la même logique.
//    Le haut du corps n'entre pas en concurrence avec la course : il peut
//    recevoir un vrai volume d'hypertrophie (objectif été 2027).
//    Le bas du corps, si : chaque série de jambes est du carburant pris à
//    la sortie longue. On y va donc LOURD et COURT, jamais en volume.
//
// 2. Pour un coureur, la musculation des jambes sert l'économie de course,
//    pas le volume musculaire. La littérature est constante là-dessus :
//    charges lourdes, répétitions basses, peu de séries. D'où le squat en
//    5-8 reps et non en 10-12, et la presse à cuisses reléguée en optionnel
//    — elle fait de la fatigue sans rien apporter que le squat n'apporte déjà.
//
// 3. Trois priorités spécifiques au trail, absentes d'un programme générique :
//    l'excentrique quadriceps (descentes), les mollets une jambe (tendon
//    d'Achille), et le moyen fessier (tenue du genou en descente longue).
//
// 4. Ce que l'ancien programme faisait de travers : trois exercices de
//    biceps pour deux de dos. Le rapport est inversé.
//
// 5. Aucune machine assistée dans la salle : la traction se construit donc
//    par le tirage vertical et les négatives, seul chemin disponible.

export const SEANCES = {
  A: {
    id: "A",
    nom: "A — Poussée",
    detail: "Pectoraux / épaules / triceps",
    lignes: [
      { exercice: "developpe-couche-halteres", series: 4, reps: [6, 10], role: "principal",
        consigne:
          "Haltères et non barre : amplitude supérieure, épaules protégées, et surtout " +
          "aucun risque de rester coincé sous la barre en s'entraînant seul." },
      { exercice: "developpe-militaire-halteres", series: 3, reps: [8, 12], role: "principal",
        alternative: "developpe-epaules-machine",
        consigne:
          "Assis, dossier redressé. La machine est une alternative valable les jours " +
          "de fatigue : elle demande moins de stabilisation." },
      { exercice: "dips", series: 3, reps: [6, 12], role: "secondaire",
        alternative: "ecarte-poulie-haute",
        consigne:
          "Maximum à établir avant toute prescription. En dessous de 6 répétitions " +
          "propres, faire des négatives de 5 s et basculer sur l'écarté." },
      { exercice: "elevations-laterales", series: 4, reps: [12, 20], role: "isolation",
        consigne:
          "Le seul exercice qui élargit vraiment les épaules. Léger, propre, jamais " +
          "d'élan : monter en répétitions avant de monter en charge." },
      { exercice: "extension-triceps-overhead", series: 3, reps: [10, 15], role: "isolation",
        consigne: "Bras au-dessus de la tête : c'est la seule position qui étire le chef long." },
      { exercice: "planche", series: 3, reps: [45, 45], unite: "secondes", role: "gainage" },
    ],
    optionnel: [
      { exercice: "ecarte-poulie-haute", series: 3, reps: [12, 15], role: "isolation",
        consigne: "Pec en position étirée, tension constante. À ajouter si le temps le permet." },
    ],
  },

  B: {
    id: "B",
    nom: "B — Tirage",
    detail: "Dos / biceps / arrière d'épaule",
    lignes: [
      { exercice: "tirage-vertical", series: 4, reps: [8, 12], role: "principal",
        consigne:
          "Prise large. C'est le chemin vers la traction : quand tu tires ton poids " +
          "de corps pour 8 répétitions propres, la traction est à portée." },
      { exercice: "rowing-haltere", series: 4, reps: [8, 12], unite: "reps/bras", role: "principal",
        consigne:
          "En appui sur le banc, jamais penché libre : ton bas du dos travaille déjà " +
          "au soulevé de terre du lundi et à chaque sortie longue." },
      { exercice: "tirage-horizontal", series: 3, reps: [10, 12], role: "secondaire",
        consigne: "Buste calé, tension constante sur le milieu du dos." },
      { exercice: "face-pull", series: 3, reps: [15, 20], role: "isolation",
        consigne:
          "Non négociable quand on pousse une fois par semaine : c'est ce qui garde " +
          "l'épaule saine face au volume de développé." },
      { exercice: "curl-incline", series: 3, reps: [8, 12], role: "isolation",
        consigne: "Banc incliné : biceps en étirement, c'est là qu'il travaille le plus." },
      { exercice: "planche-laterale", series: 2, reps: [40, 40], unite: "secondes", role: "gainage",
        consigne: "Stabilité du bassin : ce qui tient la foulée dans les dix derniers kilomètres." },
    ],
    optionnel: [
      { exercice: "curl-marteau", series: 2, reps: [10, 12], role: "isolation",
        consigne: "Brachial et avant-bras : l'épaisseur du bras, pas seulement le pic." },
      { exercice: "tractions-negatives", series: 3, reps: [3, 5], role: "secondaire",
        consigne:
          "Monter sur le cube, descendre en 5 s. Seul chemin vers la traction : " +
          "il n'y a pas de machine assistée dans la salle." },
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
      { exercice: "squat-guide", series: 4, reps: [5, 8], role: "principal",
        consigne:
          "Lourd et court. Chez un coureur, la force des jambes sert l'économie de " +
          "course : 5 à 8 répétitions, jamais 12. Deux minutes trente de repos." },
      { exercice: "souleve-terre-roumain", series: 3, reps: [8, 10], role: "secondaire",
        consigne:
          "Descente 3 s, dos plat, barre au contact des cuisses. L'excentrique ischio " +
          "est la meilleure prévention de claquage qui existe." },
      { exercice: "split-squat-bulgare", series: 3, reps: [8, 10], unite: "reps/jambe", role: "secondaire",
        alternative: "fentes-marchees",
        consigne:
          "Unilatéral : c'est le meilleur transfert vers la course, parce qu'on ne " +
          "court jamais sur deux jambes à la fois." },
      { exercice: "step-down", series: 2, reps: [10, 10], unite: "reps/jambe", role: "secondaire",
        consigne:
          "3 s à la descente. Excentrique quadriceps, la clé des descentes de trail. " +
          "À garder toute l'année, y compris en pleine prépa." },
      { exercice: "extension-mollet", series: 4, reps: [12, 15], role: "isolation",
        consigne:
          "Une jambe, 3 s à la descente, amplitude complète. C'est ce qui tient le " +
          "tendon d'Achille sur 54 km." },
      { exercice: "abducteurs", series: 3, reps: [12, 15], role: "isolation",
        consigne:
          "Moyen fessier. C'est lui qui empêche le genou de rentrer en descente " +
          "quand la fatigue arrive." },
    ],
    optionnel: [
      { exercice: "leg-curl-assis", series: 3, reps: [10, 12], role: "isolation",
        consigne: "Ischios en complément du soulevé de terre, si les jambes le supportent." },
      { exercice: "presse-cuisses", series: 3, reps: [8, 12], role: "isolation",
        consigne:
          "Volontairement optionnelle : elle fait double emploi avec le squat et le " +
          "split squat, et ajoute de la fatigue sans rien apporter de plus au coureur. " +
          "À utiliser surtout si le rack de squat est occupé." },
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

// SEMAINE TYPE — 3 courses + 3 séances de salle, fixée avec Thomas le 10/09/2026.
//
// Course : EF le mardi, qualité le jeudi, sortie longue le dimanche.
// Salle  : lundi, mardi, jeudi.
//
// Pourquoi la séance C tombe le lundi : c'est le seul jour sans course de la
// semaine, donc celui qui laisse le plus de marge avant les deux séances qui
// comptent. Lundi → jeudi fait trois jours, lundi → dimanche six : les 48 h
// réglementaires sont largement dépassées dans les deux cas. L'EF du mardi
// sur des jambes de la veille est sans risque, c'est même ce qui les vide.
//
// Pourquoi A le mardi et B le jeudi : le soulevé de terre roumain du lundi
// sollicite le bas du dos et la poigne, le tirage du jeudi aussi. Les séparer
// de trois jours vaut mieux que d'un seul. Le mardi reçoit donc la poussée,
// qui ne partage rien avec la séance de la veille.
//
// Mardi et jeudi cumulent course et salle. Dans les deux cas la course passe
// en premier : c'est elle qui décide de la saison.
export const SEMAINE_TYPE = {
  lundi: { salle: "C", course: null },
  mardi: { salle: "A", course: "ef" },
  mercredi: { salle: null, course: null, note: "Repos" },
  jeudi: { salle: "B", course: "qualite" },
  vendredi: { salle: null, course: null, note: "Repos" },
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
