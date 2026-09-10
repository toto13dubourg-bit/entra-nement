// DONNÉES DE DÉPART — les deux séances saisies à la main par Thomas,
// antérieures à l'application. Injectées une seule fois, au tout premier
// lancement, pour que le moteur de progression ait un point de départ réel.

export const SEANCES_SALLE_INITIALES = [
  {
    id: "salle-2026-09-07T17:12",
    date: "2026-09-07T17:12",
    source: { type: "saisie-manuelle", texteBrut: null },
    seance: "C_chargee",
    note:
      "Séance C chargée faite le 07/09, soit six semaines avant l'ouverture " +
      "du bas du corps prévue au 19/10. Conservée telle quelle : c'est ce " +
      "qui s'est passé.",
    exercices: [
      {
        exerciceId: "squat-guide",
        nomBrut: "Squat (Barre)",
        series: [
          { chargeKg: 30, reps: 8, echauffement: false },
          { chargeKg: 30, reps: 8, echauffement: false },
          { chargeKg: 30, reps: 8, echauffement: false },
          { chargeKg: 30, reps: 8, echauffement: false },
        ],
      },
      {
        exerciceId: "souleve-terre-roumain",
        nomBrut: "Soulevé de terre roumain",
        series: [
          { chargeKg: 30, reps: 10, echauffement: false },
          { chargeKg: 30, reps: 10, echauffement: false },
          { chargeKg: 30, reps: 10, echauffement: false },
        ],
      },
      {
        exerciceId: "step-up",
        nomBrut: "Step-up",
        series: [
          { reps: 10, echauffement: false },
          { reps: 10, echauffement: false },
        ],
      },
      {
        exerciceId: "extension-mollet",
        nomBrut: "Extension mollet 1 jambe",
        series: [
          { reps: 12, echauffement: false },
          { reps: 12, echauffement: false },
          { reps: 12, echauffement: false },
          { reps: 12, echauffement: false },
        ],
      },
      {
        exerciceId: "presse-cuisses",
        nomBrut: "Presse à Cuisses Horizontale",
        series: [
          { chargeKg: 70, reps: 10, echauffement: false },
          { chargeKg: 70, reps: 10, echauffement: false },
        ],
      },
    ],
    saisie: { rir: null, douleurs: "", ressenti: null, note: "" },
  },

  {
    id: "salle-2026-09-08T16:44",
    date: "2026-09-08T16:44",
    source: { type: "saisie-manuelle", texteBrut: null },
    seance: "B",
    exercices: [
      {
        exerciceId: "curl-poulie",
        nomBrut: "Curl biceps poulie",
        series: [
          { chargeKg: 16, reps: 15, echauffement: false },
          { chargeKg: 18, reps: 12, echauffement: false },
          { chargeKg: 20, reps: 12, echauffement: false },
        ],
      },
      {
        exerciceId: "tirage-horizontal",
        nomBrut: "Rowing poulie prise V",
        series: [
          { chargeKg: 32, reps: 10, echauffement: false },
          { chargeKg: 36, reps: 10, echauffement: false },
          { chargeKg: 36, reps: 10, echauffement: false },
          { chargeKg: 36, reps: 10, echauffement: false },
        ],
      },
      {
        exerciceId: "tirage-bras-tendus",
        nomBrut: "Tirage bras tendus",
        series: [
          { chargeKg: 14, reps: 10, echauffement: false },
          { chargeKg: 14, reps: 10, echauffement: false },
          { chargeKg: 14, reps: 10, echauffement: false },
          { chargeKg: 16, reps: 10, echauffement: false },
        ],
      },
      {
        exerciceId: "curl-incline",
        nomBrut: "Curl pupitre",
        series: [
          { chargeKg: 20, reps: 10, echauffement: false },
          { chargeKg: 18, reps: 10, echauffement: false },
          { chargeKg: 18, reps: 10, echauffement: false },
        ],
        note: "Loggé « curl pupitre », réalisé sur banc incliné : pas de pupitre dans la salle.",
      },
      {
        exerciceId: "curl-marteau",
        nomBrut: "Curl marteau haltères",
        series: [
          { chargeKg: 8, reps: 10, echauffement: false },
          { chargeKg: 6, reps: 10, echauffement: false },
          { chargeKg: 6, reps: 10, echauffement: false },
        ],
        note: "Première série corrigée de 7 à 8 kg le 10/09 : les haltères vont de 2 en 2 kg, le 7 kg n'existe pas.",
      },
    ],
    saisie: { rir: null, douleurs: "", ressenti: null, note: "" },
  },
];

// Séries de travail attendues (charge la plus fréquente ; à égalité, la plus
// lourde). Sert de jeu de tests au moteur de progression.
export const SERIES_DE_TRAVAIL_ATTENDUES = {
  "squat-guide": 30,
  "souleve-terre-roumain": 30,
  "presse-cuisses": 70,
  "curl-poulie": 20, // 16, 18, 20 vus une fois chacun -> la plus lourde
  "tirage-horizontal": 36, // vu 3 fois
  "tirage-bras-tendus": 14, // vu 3 fois
  "curl-incline": 18, // vu 2 fois
  "curl-marteau": 6, // vu 2 fois
};
