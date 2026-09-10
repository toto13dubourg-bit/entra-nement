// Tests du parseur Hevy. Le texte de référence est l'export réel envoyé par
// Thomas le 10/09/2026, reproduit ici caractère pour caractère.

import { test, egal, vrai } from "./executer.js";
import {
  parserHevy,
  dateDepuisEntete,
  serieDeTravail,
  chargesImpossibles,
} from "../parseurs/hevy.js";

// Export réel du mardi 08/09/2026.
const EXPORT_08_09 = `Entraînement d'après-midi 💪
Le mardi, sept. 08, 2026 à 4:44pm

Curl Biceps (Poulie)
Série 1: 16 kg x 15
Série 2: 18 kg x 12
Série 3: 20 kg x 12

Rowing Poulie Assis - Prise en V
Série 1: 32 kg x 10
Série 2: 36 kg x 10
Série 3: 36 kg x 10
Série 4: 36 kg x 10

Tirage Poitrine Bras Tendus (Poulie)
Série 1: 14 kg x 10
Série 2: 14 kg x 10
Série 3: 14 kg x 10
Série 4: 16 kg x 10

Curl Pupitre (Machine)
Série 1: 20 kg x 10
Série 2: 18 kg x 10
Série 3: 18 kg x 10

Curl Marteau (Haltère)
Série 1: 7 kg x 10
Série 2: 6 kg x 10
Série 3: 6 kg x 10

@hevyapp`;

// Extrait réel du lundi 07/09/2026.
const EXPORT_07_09 = `Entraînement d'après-midi 💪
Le lundi, sept. 07, 2026 à 5:12pm

Squat (Barre)
Série 1: 30 kg x 8
Série 2: 30 kg x 8

Presse à Cuisses Horizontale
Série 1: 70 kg x 10`;

// --------------------------------------------------------------- La date

test("Hevy — la date française abrégée est lue", () => {
  egal(dateDepuisEntete("Le mardi, sept. 08, 2026 à 4:44pm"), "2026-09-08T16:44", "08/09 16h44");
  egal(dateDepuisEntete("Le lundi, sept. 07, 2026 à 5:12pm"), "2026-09-07T17:12", "07/09 17h12");
});

test("Hevy — les douze mois abrégés sont reconnus", () => {
  const attendus = [
    ["janv.", "01"], ["févr.", "02"], ["mars", "03"], ["avr.", "04"],
    ["mai", "05"], ["juin", "06"], ["juil.", "07"], ["août", "08"],
    ["sept.", "09"], ["oct.", "10"], ["nov.", "11"], ["déc.", "12"],
  ];
  for (const [mois, numero] of attendus) {
    const obtenu = dateDepuisEntete(`Le lundi, ${mois} 05, 2026 à 9:30am`);
    egal(obtenu, `2026-${numero}-05T09:30`, `mois « ${mois} »`);
  }
});

test("Hevy — matin et soir ne sont pas confondus", () => {
  egal(dateDepuisEntete("Le lundi, sept. 07, 2026 à 9:05am"), "2026-09-07T09:05", "9h05 du matin");
  egal(dateDepuisEntete("Le lundi, sept. 07, 2026 à 12:30am"), "2026-09-07T00:30", "minuit trente");
  egal(dateDepuisEntete("Le lundi, sept. 07, 2026 à 12:30pm"), "2026-09-07T12:30", "midi trente");
});

// -------------------------------------------------------- L'export réel

test("Hevy — l'export du 08/09 donne 5 exercices et 17 séries", () => {
  const s = parserHevy(EXPORT_08_09);
  egal(s.date, "2026-09-08T16:44", "date");
  egal(s.exercices.length, 5, "nombre d'exercices");
  egal(s.exercices.map((e) => e.series.length).join(","), "3,4,4,3,3", "séries par exercice");
  egal(s.exercices.reduce((t, e) => t + e.series.length, 0), 17, "séries au total");
  egal(s.lignesNonReconnues.length, 0, "aucune ligne non reconnue");
});

test("Hevy — la ligne @hevyapp n'est pas prise pour un exercice", () => {
  const s = parserHevy(EXPORT_08_09);
  vrai(!s.exercices.some((e) => e.nomBrut.includes("hevyapp")), "@hevyapp ignoré");
  vrai(!s.exercices.some((e) => e.series.length === 0), "aucun exercice vide");
});

test("Hevy — les cinq noms du 08/09 sont associés au catalogue", () => {
  const s = parserHevy(EXPORT_08_09);
  egal(s.nomsInconnus.length, 0, `noms non associés : ${s.nomsInconnus.join(", ")}`);
  egal(s.exercices.map((e) => e.exerciceId).join(","),
    "curl-poulie,tirage-horizontal,tirage-bras-tendus,curl-incline,curl-marteau",
    "association des noms");
});

test("Hevy — « Curl Pupitre (Machine) » pointe vers le curl incliné", () => {
  const s = parserHevy(EXPORT_08_09);
  const ex = s.exercices.find((e) => e.nomBrut === "Curl Pupitre (Machine)");
  egal(ex.exerciceId, "curl-incline",
    "Hevy nomme l'exercice « pupitre », mais il n'y a pas de banc pupitre dans la salle");
});

test("Hevy — l'extrait du 07/09 se lit aussi", () => {
  const s = parserHevy(EXPORT_07_09);
  egal(s.date, "2026-09-07T17:12", "date");
  egal(s.exercices.length, 2, "nombre d'exercices");
  egal(s.exercices[0].exerciceId, "squat-guide", "squat associé");
  egal(s.exercices[1].exerciceId, "presse-cuisses", "presse associée");
});

// ------------------------------------------------- La série de travail

test("Hevy — série de travail : la plus fréquente, à égalité la plus lourde", () => {
  const s = parserHevy(EXPORT_08_09);
  const parNom = Object.fromEntries(s.exercices.map((e) => [e.exerciceId, serieDeTravail(e)]));
  // 16, 18, 20 vus une fois chacun : égalité, donc la plus lourde.
  egal(parNom["curl-poulie"], 20, "curl poulie (16-18-20)");
  egal(parNom["tirage-horizontal"], 36, "rowing (32-36-36-36)");
  egal(parNom["tirage-bras-tendus"], 14, "bras tendus (14-14-14-16)");
  egal(parNom["curl-incline"], 18, "curl incliné (20-18-18)");
  egal(parNom["curl-marteau"], 6, "curl marteau (7-6-6)");
});

// Thomas ne marque PAS ses séries d'échauffement dans Hevy : elles arrivent
// donc comme des séries ordinaires. C'est la règle de la série de travail —
// la plus fréquente, à égalité la plus lourde — qui doit les neutraliser
// toute seule. Ces trois cas sont la vraie protection du moteur.
test("Hevy — un échauffement non marqué ne fausse pas la série de travail", () => {
  const seance = (lignes) =>
    parserHevy(`Séance\nLe lundi, sept. 14, 2026 à 6:00pm\n\nCurl Biceps (Poulie)\n${lignes}`)
      .exercices[0];

  egal(
    serieDeTravail(seance("Série 1: 12 kg x 12\nSérie 2: 20 kg x 12\nSérie 3: 20 kg x 11\nSérie 4: 20 kg x 10")),
    20,
    "un échauffement léger, trois séries droites"
  );

  egal(
    serieDeTravail(seance("Série 1: 10 kg x 12\nSérie 2: 16 kg x 12\nSérie 3: 20 kg x 12\nSérie 4: 20 kg x 12\nSérie 5: 20 kg x 12")),
    20,
    "deux échauffements en montée, trois séries droites"
  );

  // Le cas retors : autant d'échauffements que de séries de travail.
  // À égalité de fréquence, c'est la charge la plus lourde qui gagne.
  egal(
    serieDeTravail(seance("Série 1: 12 kg x 12\nSérie 2: 12 kg x 12\nSérie 3: 12 kg x 12\nSérie 4: 20 kg x 12\nSérie 5: 20 kg x 12\nSérie 6: 20 kg x 12")),
    20,
    "trois échauffements identiques contre trois séries lourdes"
  );
});

test("Hevy — un échauffement non marqué n'empêche pas la progression", async () => {
  const { prochaineEtape, etatInitial } = await import("../moteur/progression.js");
  const seance = parserHevy(
    `Séance\nLe lundi, sept. 14, 2026 à 6:00pm\n\nCurl Biceps (Poulie)\n` +
      `Série 1: 12 kg x 12\nSérie 2: 20 kg x 12\nSérie 3: 20 kg x 11\nSérie 4: 20 kg x 10`
  );
  const r = prochaineEtape(
    etatInitial("curl-poulie", null),
    seance.exercices[0].series,
    { series: 3, reps: [10, 12] }
  );
  egal(r.action, "monter", "les trois séries à 20 kg comptent comme la séance prescrite");
  egal(r.chargeKg, 22, "20 kg + le cran de 2 kg de la poulie");
});

test("Hevy — une série d'échauffement marquée ne compte pas non plus", () => {
  const s = parserHevy(`Séance
Le lundi, sept. 07, 2026 à 5:12pm

Curl Marteau (Haltère)
Échauffement 1: 20 kg x 12
Série 1: 8 kg x 10
Série 2: 8 kg x 10`);
  const ex = s.exercices[0];
  egal(ex.series.length, 3, "trois séries enregistrées");
  egal(ex.series[0].echauffement, true, "la première est un échauffement");
  egal(serieDeTravail(ex), 8, "l'échauffement à 20 kg ne fausse pas la série de travail");
});

// ------------------------------------------------- Charges impossibles

test("Hevy — un curl marteau à 7 kg est signalé : les haltères vont par 2", () => {
  const s = parserHevy(EXPORT_08_09);
  const anomalies = chargesImpossibles(s);
  const marteau = anomalies.find((a) => a.exercice === "Curl Marteau (Haltère)");
  vrai(marteau, `le 7 kg doit être signalé, anomalies vues : ${anomalies.length}`);
  egal(marteau.chargeKg, 7, "charge en cause");
  vrai(/par 2 kg/.test(marteau.raison), `message explicite, obtenu : ${marteau.raison}`);
});

test("Hevy — la charge n'est jamais corrigée d'office", () => {
  const s = parserHevy(EXPORT_08_09);
  const marteau = s.exercices.find((e) => e.exerciceId === "curl-marteau");
  egal(marteau.series[0].chargeKg, 7, "la donnée brute reste 7 kg, telle qu'elle a été loggée");
});

test("Hevy — les charges valides ne déclenchent aucune alerte", () => {
  const s = parserHevy(EXPORT_08_09);
  const anomalies = chargesImpossibles(s).map((a) => a.exercice);
  vrai(!anomalies.includes("Curl Biceps (Poulie)"), "16, 18, 20 kg existent sur une poulie par 2");
  vrai(!anomalies.includes("Rowing Poulie Assis - Prise en V"), "32 et 36 kg existent");
});

test("Hevy — un haltère au-delà de 40 kg est signalé", () => {
  const s = parserHevy(`Séance
Le lundi, sept. 07, 2026 à 5:12pm

Curl Marteau (Haltère)
Série 1: 44 kg x 10`);
  const anomalie = chargesImpossibles(s).find((a) => /dépasse le maximum/.test(a.raison));
  vrai(anomalie, "la salle ne monte qu'à 40 kg");
});

// ------------------------------------------ Ce qui n'est jamais deviné

test("Hevy — un nom d'exercice inconnu n'est jamais rapproché par ressemblance", () => {
  const s = parserHevy(`Séance
Le lundi, sept. 07, 2026 à 5:12pm

Curl Biceps (Haltère)
Série 1: 10 kg x 10`);
  egal(s.exercices[0].exerciceId, null, "aucune association");
  egal(s.nomsInconnus.join(","), "Curl Biceps (Haltère)", "le nom est remonté pour arbitrage");
});

test("Hevy — une ligne de série illisible est rapportée, pas ignorée", () => {
  const s = parserHevy(`Séance
Le lundi, sept. 07, 2026 à 5:12pm

Curl Marteau (Haltère)
Série 1: 8 kg x 10
Série 2: 12 livres x 8`);
  egal(s.exercices[0].series.length, 1, "seule la série lisible est enregistrée");
  egal(s.lignesNonReconnues.length, 1, "la série illisible est rapportée");
  egal(s.lignesNonReconnues[0].exercice, "Curl Marteau (Haltère)", "rattachée à son exercice");
});

test("Hevy — un texte sans en-tête de date est refusé", () => {
  let refuse = false;
  try {
    parserHevy("Curl Marteau (Haltère)\nSérie 1: 8 kg x 10");
  } catch (e) {
    refuse = true;
    vrai(/en-tête/.test(e.message), `message explicite, obtenu : ${e.message}`);
  }
  vrai(refuse, "un texte tronqué doit être refusé");
});

// -------------------------------- Formats décrits par Thomas, non encore vus

test("Hevy — série au poids du corps (format décrit, à confirmer)", () => {
  const s = parserHevy(`Séance
Le lundi, sept. 07, 2026 à 5:12pm

Tractions
Série 1: 10 répétitions
Série 2: 8 répétitions`);
  egal(s.lignesNonReconnues.length, 0, "les deux séries sont lues");
  egal(s.exercices[0].series[0].reps, 10, "répétitions");
  egal(s.exercices[0].series[0].chargeKg, undefined, "aucune charge");
});

test("Hevy — série au temps (format décrit, à confirmer)", () => {
  const s = parserHevy(`Séance
Le lundi, sept. 07, 2026 à 5:12pm

Planche
Série 1: 0:40
Série 2: 1:05`);
  egal(s.lignesNonReconnues.length, 0, "les deux séries sont lues");
  egal(s.exercices[0].series[0].dureeS, 40, "40 secondes");
  egal(s.exercices[0].series[1].dureeS, 65, "1 minute 5");
});
