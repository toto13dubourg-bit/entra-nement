// Tests de l'export coach. On vérifie ce qu'il rapporte, et surtout ce qu'il
// ne fait pas : aucun conseil, aucune décision.

import { test, egal, vrai } from "./executer.js";
import { exportCoach, semaineDe, anomalies, questionsOuvertes, duree } from "../export/coach.js";
import { parserCoros, champsASaisir } from "../parseurs/coros.js";
import { etatVide } from "../modele/donnees.js";
import { SEANCES_SALLE_INITIALES } from "../config/donnees-initiales.js";

const DOSSIER = "./fichiers-coros/";

async function course(fichier, saisie) {
  const texte = await (await fetch(DOSSIER + fichier)).text();
  const s = parserCoros(texte, fichier);
  s.saisie = { ...champsASaisir(), ...saisie };
  return s;
}

function etatDeBase() {
  const etat = etatVide();
  etat.seancesSalle = JSON.parse(JSON.stringify(SEANCES_SALLE_INITIALES));
  return etat;
}

test("Export — la semaine va du lundi au dimanche", () => {
  const s = semaineDe("2026-09-13"); // un dimanche
  egal(s[0], "2026-09-07", "lundi");
  egal(s[6], "2026-09-13", "dimanche");
  egal(semaineDe("2026-09-07")[0], "2026-09-07", "un lundi reste le lundi");
  egal(semaineDe("2026-09-09")[0], "2026-09-07", "depuis un mercredi");
});

test("Export — l'en-tête donne la phase et les jours avant la course", async () => {
  const texte = exportCoach(etatDeBase(), "2026-09-13");
  vrai(/Phase : Affûtage 1/.test(texte), "phase");
  vrai(/dans 13 jours/.test(texte), "13 jours avant le trail du 26/09");
  vrai(/sub 5h15/.test(texte), "objectif rappelé");
});

test("Export — il tient en un écran", async () => {
  const etat = etatDeBase();
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260907190348.csv", {
    type: "ef", titre: "EF 40'", temperatureC: 22, ressenti: 4 }));
  etat.checkins.push({ date: "2026-09-13", poidsKg: 70.4, sommeilH: 7.5, alcool: 1,
    proteinesG: 118, etatJambes: 4, douleurs: "", note: "RAS" });
  const texte = exportCoach(etat, "2026-09-13");
  vrai(texte.split("\n").length < 60, `${texte.split("\n").length} lignes, il en faut moins de 60`);
});

test("Export — les sept sections apparaissent dans l'ordre demandé", async () => {
  const etat = etatDeBase();
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260907190348.csv", {
    type: "ef", temperatureC: 22 }));
  etat.checkins.push({ date: "2026-09-13", poidsKg: 70.4 });
  const texte = exportCoach(etat, "2026-09-13");
  const ordre = ["SEMAINE", "COURSE", "SALLE", "CHECK-IN", "ANOMALIES", "QUESTIONS OUVERTES"];
  let position = -1;
  for (const section of ordre) {
    const trouve = texte.indexOf("\n" + section);
    vrai(trouve > position, `section « ${section} » présente et dans l'ordre`);
    position = trouve;
  }
});

test("Export — une séance déplacée n'est pas comptée comme sautée", () => {
  // La séance B a été faite le mardi, alors que le programme la place le jeudi.
  const texte = exportCoach(etatDeBase(), "2026-09-13");
  vrai(/mardi 08\/09 :.*prévue, B FAITE à la place/.test(texte), "mardi");
  vrai(/jeudi 10\/09 : salle B faite un autre jour/.test(texte), "jeudi, pas de « SAUTÉE »");
  vrai(!/salle B PRÉVUE — SAUTÉE/.test(texte), "aucune mention de séance B sautée");
});

test("Export — une séance vraiment manquée est marquée sautée", () => {
  const texte = exportCoach(etatDeBase(), "2026-09-13");
  vrai(/VMA 8×1' — SAUTÉE/.test(texte), "la VMA du 09/09 n'a pas été faite");
});

test("Export — le poids affiche sa variation", () => {
  const etat = etatDeBase();
  etat.checkins.push({ date: "2026-09-06", poidsKg: 70.8 });
  etat.checkins.push({ date: "2026-09-13", poidsKg: 70.4 });
  vrai(/70\.4 kg \(-0\.4 kg\)/.test(exportCoach(etat, "2026-09-13")), "variation calculée");
});

// ---------------------------------------------------------- Les anomalies

test("Anomalie — sortie longue partie trop vite le 04/09", async () => {
  const etat = etatDeBase();
  etat.seancesSalle = [];
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260904104733.csv", {
    type: "sortie-longue", temperatureC: 26 }));
  const trouvees = anomalies(etat, semaineDe("2026-09-04"));
  const alerte = trouvees.find((a) => /trop vite/.test(a));
  vrai(alerte, `alerte attendue, obtenues : ${trouvees.join(" | ")}`);
  vrai(/km 7/.test(alerte), `l'alerte cite le kilomètre en cause, obtenu : ${alerte}`);
});

test("Anomalie — une séance faite hors phase est signalée", () => {
  // Séance C chargée le 07/09, six semaines avant l'ouverture du 19/10.
  const trouvees = anomalies(etatDeBase(), semaineDe("2026-09-13"));
  const alerte = trouvees.find((a) => /C_chargee/.test(a));
  vrai(alerte, `alerte attendue, obtenues : ${trouvees.join(" | ")}`);
  vrai(/19\/10/.test(alerte), "la raison cite la date d'ouverture");
});

test("Anomalie — la chaleur décale les cibles de FC", async () => {
  const etat = etatDeBase();
  etat.seancesSalle = [];
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260904104733.csv", {
    type: "sortie-longue", temperatureC: 26 }));
  const alerte = anomalies(etat, semaineDe("2026-09-04")).find((a) => /26 °C/.test(a));
  vrai(alerte, "la température réelle déclenche le rappel");
  vrai(/thermique/.test(alerte), "la raison distingue dérive thermique et excès d'intensité");
});

test("Anomalie — glucides insuffisants sur une longue sortie", async () => {
  const etat = etatDeBase();
  etat.seancesSalle = [];
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260904104733.csv", {
    type: "sortie-longue", temperatureC: 26,
    glucides: [{ aliment: "gel", quantite: 1 }, { aliment: "pate-de-fruit", quantite: 2 }] }));
  const alerte = anomalies(etat, semaineDe("2026-09-04")).find((a) => /g\/h/.test(a));
  vrai(alerte, "55 g pris sur 2h45 est très en dessous de la cible");
});

test("Anomalie — une nutrition conforme ne déclenche rien", async () => {
  const etat = etatDeBase();
  etat.seancesSalle = [];
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260904104733.csv", {
    type: "sortie-longue", temperatureC: 20,
    glucides: [{ aliment: "gel", quantite: 5 }, { aliment: "boisson-iso-500ml", quantite: 2 }] }));
  const alerte = anomalies(etat, semaineDe("2026-09-04")).find((a) => /g\/h de glucides/.test(a));
  vrai(!alerte, `aucune alerte attendue, obtenue : ${alerte}`);
});

// ------------------------------------------------------ Questions ouvertes

test("Questions — une température non saisie est réclamée", async () => {
  const etat = etatDeBase();
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260907190348.csv", { type: "ef" }));
  const q = questionsOuvertes(etat, semaineDe("2026-09-13"));
  vrai(q.some((x) => /Température réelle non saisie/.test(x)), "température réclamée");
});

test("Questions — les machines sans cran relevé sont listées", () => {
  const q = questionsOuvertes(etatDeBase(), semaineDe("2026-09-13"));
  vrai(q.some((x) => /Presse à cuisses/.test(x) && /cran/.test(x)), "presse à cuisses");
  vrai(!q.some((x) => /Curl biceps poulie.*cran de la machine/.test(x)), "la poulie a son cran, pas de question");
});

test("Anomalie — les pyramides tiennent en une seule ligne", () => {
  // La méthode retenue le 10/09 est la série droite : une pyramide est donc
  // un écart constaté, plus une question ouverte.
  const trouvees = anomalies(etatDeBase(), semaineDe("2026-09-13"));
  const pyramides = trouvees.filter((x) => /pyramide/.test(x));
  egal(pyramides.length, 1, "une seule ligne pour tous les exercices");
  vrai(/Curl marteau/.test(pyramides[0]), "elle les nomme");
  const q = questionsOuvertes(etatDeBase(), semaineDe("2026-09-13"));
  vrai(!q.some((x) => /pyramide/.test(x)), "ce n'est plus une question ouverte");
});

test("Questions — un nom Hevy non associé remonte", () => {
  const etat = etatDeBase();
  etat.seancesSalle.push({
    date: "2026-09-10T18:00", seance: "A",
    exercices: [{ exerciceId: null, nomBrut: "Machin Truc (Poulie)", series: [{ chargeKg: 10, reps: 10 }] }],
    saisie: {},
  });
  const q = questionsOuvertes(etat, semaineDe("2026-09-13"));
  vrai(q.some((x) => /Machin Truc/.test(x)), "le nom inconnu est remonté");
});

// ------------------------------------------------- Ce qu'il ne fait jamais

test("Export — aucun conseil n'est généré", async () => {
  const etat = etatDeBase();
  etat.seancesCourse.push(await course("Loire-AtlantiqueCourse20260904104733.csv", {
    type: "sortie-longue", temperatureC: 26 }));
  const texte = exportCoach(etat, "2026-09-04");
  const prescriptif = /tu devrais|il faut que tu|je te conseille|essaie de|pense à|n'oublie pas de/i;
  vrai(!prescriptif.test(texte), "l'export constate, il ne conseille pas");
});

test("Export — les durées sont lisibles", () => {
  egal(duree(41 * 60 + 54), "41:54", "moins d'une heure");
  egal(duree(9935), "2:45:35", "plus d'une heure");
  egal(duree(null), "—", "valeur absente");
});
