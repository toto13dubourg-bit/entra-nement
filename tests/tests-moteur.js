// Tests du moteur de phases, du moteur de progression et du stockage.
// Les cas de référence sont les règles écrites par Thomas.

import { test, egal, vrai } from "./executer.js";
import {
  phaseDu,
  salleAutorisee,
  exerciceAutorise,
  versionSeanceC,
  prochaineCourse,
  verifierDelai,
  cranConnu,
} from "../moteur/phases.js";
import {
  etatInitial,
  chargeDeTravail,
  evaluerSeance,
  prochaineEtape,
  stagnation,
} from "../moteur/progression.js";
import {
  creerDepot,
  etatSauvegarde,
  marquerSauvegarde,
  nomFichierSauvegarde,
  CLE,
} from "../stockage/depot.js";
import { exporterJson } from "../modele/donnees.js";

// ============================================================ LES PHASES

test("Phases — chaque date tombe dans la bonne phase", () => {
  egal(phaseDu("2026-09-10").id, "S4", "10/09");
  egal(phaseDu("2026-09-15").id, "S5", "15/09");
  egal(phaseDu("2026-09-23").id, "SC", "23/09");
  egal(phaseDu("2026-09-28").id, "R1", "28/09");
  egal(phaseDu("2026-10-03").id, "R1b", "03/10");
  egal(phaseDu("2026-10-08").id, "R2", "08/10");
  egal(phaseDu("2026-10-15").id, "R3", "15/10");
  egal(phaseDu("2026-11-02").id, "CONSTRUCTION", "02/11");
});

test("Phases — le haut du corps reste ouvert pendant l'affûtage", () => {
  vrai(salleAutorisee("2026-09-15", "A").autorise, "A le 15/09");
  vrai(salleAutorisee("2026-09-22", "B").autorise, "B le 22/09, semaine de course");
});

test("Phases — la salle ferme 3 jours avant le trail", () => {
  vrai(salleAutorisee("2026-09-23", "A").autorise, "23/09 encore ouvert");
  const veille = salleAutorisee("2026-09-25", "A");
  egal(veille.autorise, false, "25/09 fermé");
  vrai(/26\/09/.test(veille.raison), `la raison cite la course, obtenu : ${veille.raison}`);
});

test("Phases — la salle est fermée pendant la récupération post-trail", () => {
  const r = salleAutorisee("2026-09-29", "A");
  egal(r.autorise, false, "29/09 refusé");
  vrai(/54 km/.test(r.raison), `la raison explique, obtenu : ${r.raison}`);
  vrai(salleAutorisee("2026-10-02", "A").autorise, "02/10 : le haut du corps rouvre");
});

test("Phases — pas de jambes tant que le haut du corps est seul autorisé", () => {
  const r = salleAutorisee("2026-10-06", "C_legere");
  egal(r.autorise, false, "C refusée en phase R2");
  vrai(/haut du corps/.test(r.raison), `raison, obtenu : ${r.raison}`);
});

test("Phases — la séance C chargée n'ouvre pas avant le 19/10", () => {
  // En S5 la salle est libre, mais le bas du corps chargé reste fermé :
  // c'est là que le remplacement par la version allégée a un sens.
  const avant = salleAutorisee("2026-09-14", "C_chargee");
  egal(avant.autorise, false, "14/09 refusée");
  egal(avant.remplacerPar, "C_legere", "l'appli propose la version allégée");
  vrai(salleAutorisee("2026-09-14", "C_legere").autorise, "la version allégée passe, elle");
  vrai(salleAutorisee("2026-10-20", "C_chargee").autorise, "20/10 autorisée");
});

test("Phases — pendant l'affûtage court, aucune version de C ne passe", () => {
  // R3 n'autorise que le haut du corps : il n'y a rien à proposer en échange.
  const r = salleAutorisee("2026-10-15", "C_legere");
  egal(r.autorise, false, "15/10 refusée");
  egal(r.remplacerPar, undefined, "aucun remplacement possible");
});

test("Phases — la version de la séance C dépend de la date", () => {
  egal(versionSeanceC("2026-09-10"), "C_legere", "avant le 19/10");
  egal(versionSeanceC("2026-10-20"), "C_chargee", "après le 19/10");
});

test("Phases — le squat est interdit jusqu'au 18/10", () => {
  const avant = exerciceAutorise("squat-guide", "2026-10-10");
  egal(avant.autorise, false, "10/10 interdit");
  vrai(/bas du corps/.test(avant.raison), `raison, obtenu : ${avant.raison}`);
  vrai(exerciceAutorise("squat-guide", "2026-10-20").autorise, "20/10 autorisé");
});

test("Phases — le step-down reste autorisé toute l'année", () => {
  vrai(exerciceAutorise("step-down", "2026-09-10").autorise, "step-down en septembre");
});

test("Phases — un exercice dont le matériel n'existe pas est refusé", () => {
  const faux = exerciceAutorise("leg-extension", "2026-11-01");
  egal(faux.autorise, false, "exercice absent du catalogue");
});

test("Phases — jours restants avant la prochaine course", () => {
  const p = prochaineCourse("2026-09-10");
  egal(p.course.id, "trail-54", "prochaine course");
  egal(p.joursRestants, 16, "16 jours avant le trail");
  egal(prochaineCourse("2026-09-27").course.id, "10km", "après le trail, c'est le 10 km");
});

// ------------------------------------------------------ Le délai de 48 h

test("Délai — lundi jambes puis mercredi qualité : c'est bon", () => {
  const r = verifierDelai("2026-09-07", "2026-09-09", "vma");
  egal(r.conflit, false, "48 h respectées");
});

test("Délai — mardi jambes puis mercredi qualité : conflit", () => {
  const r = verifierDelai("2026-09-08", "2026-09-09", "vma");
  egal(r.conflit, true, "24 h seulement");
  vrai(/48/.test(r.raison), `la raison cite les 48 h, obtenu : ${r.raison}`);
});

test("Délai — la sortie longue compte comme une séance de qualité", () => {
  egal(verifierDelai("2026-09-12", "2026-09-13", "sortie-longue").conflit, true, "SL la veille");
});

test("Délai — un footing n'impose aucun délai", () => {
  egal(verifierDelai("2026-09-08", "2026-09-09", "ef").conflit, false, "EF le lendemain");
  egal(verifierDelai("2026-09-08", "2026-09-08", "recuperation").conflit, false, "récup le jour même");
});

// ======================================================== LA PROGRESSION

const LIGNE_3x10_12 = { series: 3, reps: [10, 12] };
const LIGNE_4x8_10 = { series: 4, reps: [8, 10] };

const series = (charge, ...reps) => reps.map((r) => ({ chargeKg: charge, reps: r }));

test("Progression — la charge de travail ignore l'échauffement", () => {
  egal(
    chargeDeTravail([
      { chargeKg: 20, reps: 12, echauffement: true },
      { chargeKg: 8, reps: 10 },
      { chargeKg: 8, reps: 10 },
    ]),
    8,
    "l'échauffement lourd ne compte pas"
  );
});

test("Progression — réussite en linéaire : la charge monte du cran réel", () => {
  const etat = { ...etatInitial("curl-poulie", 20), depuis: "2026-09-08" };
  const r = prochaineEtape(etat, series(20, 12, 11, 10), LIGNE_3x10_12);
  egal(r.action, "monter", "action");
  egal(r.chargeKg, 22, "20 kg + 2 kg de cran de poulie");
  egal(r.etat.echecsConsecutifs, 0, "compteur remis à zéro");
});

test("Progression — un échec maintient la charge et incrémente le compteur", () => {
  const etat = etatInitial("curl-poulie", 20);
  const r = prochaineEtape(etat, series(20, 12, 10, 8), LIGNE_3x10_12);
  egal(r.action, "maintenir", "action");
  egal(r.etat.chargeKg, 20, "charge inchangée");
  egal(r.etat.echecsConsecutifs, 1, "un échec");
  egal(r.etat.mode, "LINEAIRE", "toujours en linéaire");
});

test("Progression — deux échecs consécutifs basculent en double progression", () => {
  let etat = etatInitial("curl-poulie", 20);
  etat = prochaineEtape(etat, series(20, 12, 10, 8), LIGNE_3x10_12).etat;
  const r = prochaineEtape(etat, series(20, 11, 9, 9), LIGNE_3x10_12);
  egal(r.action, "basculer", "action");
  egal(r.etat.mode, "DOUBLE", "mode");
  egal(r.etat.chargeKg, 20, "charge maintenue");
  egal(r.etat.echecsConsecutifs, 0, "compteur remis à zéro");
});

test("Progression — en double, la charge reste bloquée sous le haut de fourchette", () => {
  const etat = { ...etatInitial("curl-poulie", 20), mode: "DOUBLE" };
  const r = prochaineEtape(etat, series(20, 12, 11, 10), LIGNE_3x10_12);
  egal(r.action, "maintenir", "11 et 10 reps : pas encore 12 partout");
  egal(r.etat.chargeKg, 20, "charge inchangée");
});

test("Progression — en double, le haut de fourchette partout fait monter", () => {
  const etat = { ...etatInitial("curl-poulie", 20), mode: "DOUBLE" };
  const r = prochaineEtape(etat, series(20, 12, 12, 12), LIGNE_3x10_12);
  egal(r.action, "monter", "action");
  egal(r.chargeKg, 22, "charge + 2 kg");
  egal(r.etat.mode, "DOUBLE", "on reste en double progression");
});

test("Progression — la progression linéaire reste la règle par défaut", () => {
  egal(etatInitial("curl-poulie", 20).mode, "LINEAIRE", "mode initial");
});

test("Progression — sans cran connu, aucune charge n'est proposée", () => {
  const etat = etatInitial("presse-cuisses", 70);
  const r = prochaineEtape(etat, series(70, 12, 12, 12), LIGNE_3x10_12);
  egal(r.action, "impossible", "action");
  vrai(/cran de progression/.test(r.raison), `raison, obtenu : ${r.raison}`);
  vrai(/Presse à cuisses/i.test(r.raison), "la raison nomme la machine");
});

test("Progression — les cinq machines à relever sont bien signalées", () => {
  egal(cranConnu("curl-poulie"), true, "poulie : 2 kg connus");
  egal(cranConnu("curl-marteau"), true, "haltères : 2 kg connus");
  for (const id of ["squat-guide", "presse-cuisses", "leg-curl-assis", "abducteurs", "developpe-epaules-machine"]) {
    egal(cranConnu(id), false, `${id} : cran encore inconnu`);
  }
});

test("Progression — le plafond des haltères est respecté", () => {
  const etat = etatInitial("curl-marteau", 40);
  const r = prochaineEtape(etat, series(40, 12, 12, 12), LIGNE_3x10_12);
  egal(r.action, "plafond", "action");
  vrai(/40 kg/.test(r.raison), `raison, obtenu : ${r.raison}`);
});

test("Progression — une séance en pyramide est observée, pas jugée", () => {
  // Séance réelle du 08/09 : 16, 18, 20 kg. Une seule série à la charge de
  // travail alors que trois sont prescrites.
  const etat = etatInitial("curl-poulie", 20);
  const realisees = [
    { chargeKg: 16, reps: 15 },
    { chargeKg: 18, reps: 12 },
    { chargeKg: 20, reps: 12 },
  ];
  const r = prochaineEtape(etat, realisees, LIGNE_3x10_12);
  egal(r.action, "observation", "ni réussite ni échec");
  vrai(/1 réalisée/.test(r.raison), `raison, obtenu : ${r.raison}`);
  egal(r.etat.echecsConsecutifs, 0, "aucun échec compté");
});

test("Progression — le rowing du 08/09 est une réussite en bonne et due forme", () => {
  // 32, 36, 36, 36 : trois séries à 36 kg pour quatre prescrites... donc
  // structure différente. Avec 4 séries à 36, ce serait une réussite.
  const etat = etatInitial("tirage-horizontal", 36);
  const quatreA36 = series(36, 10, 10, 10, 10);
  const r = prochaineEtape(etat, quatreA36, LIGNE_4x8_10);
  egal(r.action, "monter", "action");
  egal(r.chargeKg, 38, "36 + 2 kg");
});

test("Progression — la stagnation est constatée après trois semaines", () => {
  const etat = { ...etatInitial("curl-poulie", 20), depuis: "2026-08-15" };
  const s = stagnation(etat, "2026-09-10");
  vrai(s, "stagnation détectée");
  egal(s.jours, 26, "26 jours");
  vrai(!stagnation({ ...etat, depuis: "2026-09-01" }, "2026-09-10"), "9 jours : rien à signaler");
});

// =========================================================== LE STOCKAGE

function faireStockage() {
  const memoire = new Map();
  return {
    getItem: (c) => (memoire.has(c) ? memoire.get(c) : null),
    setItem: (c, v) => memoire.set(c, v),
    removeItem: (c) => memoire.delete(c),
    taille: () => memoire.size,
  };
}

test("Stockage — le premier lancement injecte les séances de départ", () => {
  const depot = creerDepot(faireStockage());
  const etat = depot.charger();
  egal(etat.seancesSalle.length, 2, "les deux séances saisies à la main");
  egal(etat.seancesSalle[0].date.slice(0, 10), "2026-09-07", "séance du 07/09");
});

test("Stockage — ce qui est enregistré est relu à l'identique", () => {
  const brut = faireStockage();
  const depot = creerDepot(brut);
  const etat = depot.charger();
  etat.checkins.push({ date: "2026-09-13", poidsKg: 70.4, sommeilH: 8, alcool: 0,
    proteinesG: 125, etatJambes: 4, douleurs: "", note: "" });
  depot.enregistrer(etat);
  egal(creerDepot(brut).charger().checkins.length, 1, "check-in relu");
  egal(creerDepot(brut).charger().checkins[0].poidsKg, 70.4, "poids relu");
});

test("Stockage — des données corrompues ne sont pas écrasées en silence", () => {
  const brut = faireStockage();
  brut.setItem(CLE, "{ceci n'est pas du json");
  let message = "";
  try {
    creerDepot(brut).charger();
  } catch (e) {
    message = e.message;
  }
  vrai(/illisibles/.test(message), `erreur explicite, obtenu : ${message}`);
  vrai(/sauvegarde/i.test(message), "l'erreur oriente vers la sauvegarde");
});

test("Stockage — un stockage bloqué donne un message compréhensible", () => {
  const bloque = {
    getItem: () => { throw new Error("refusé"); },
    setItem: () => {},
    removeItem: () => {},
  };
  let message = "";
  try {
    creerDepot(bloque).charger();
  } catch (e) {
    message = e.message;
  }
  vrai(/navigation privée/i.test(message), `message, obtenu : ${message}`);
});

test("Stockage — l'import remplace tout l'état", () => {
  const brut = faireStockage();
  const depot = creerDepot(brut);
  depot.charger();
  const autre = { format: "entrainement", version: 1, donnees: {
    meta: { versionFormat: 1, creeLe: "2026-01-01T00:00:00.000Z", derniereSauvegarde: null },
    seancesCourse: [], seancesSalle: [], checkins: [{ date: "2026-01-05", poidsKg: 69 }],
    progression: {}, associationsHevy: {}, exportsCoach: [],
  }};
  const restaure = depot.remplacer(JSON.stringify(autre));
  egal(restaure.checkins.length, 1, "check-in restauré");
  egal(restaure.seancesSalle.length, 0, "les séances de départ ont bien été remplacées");
});

test("Sauvegarde — le rappel se déclenche à 30 jours", () => {
  const etat = { meta: { creeLe: "2026-08-01T10:00:00.000Z", derniereSauvegarde: null } };
  egal(etatSauvegarde(etat, "2026-08-20T10:00:00.000Z").necessaire, false, "19 jours");
  const a40 = etatSauvegarde(etat, "2026-09-10T10:00:00.000Z");
  egal(a40.necessaire, true, "40 jours");
  egal(a40.jamais, true, "jamais sauvegardé");
  vrai(/Aucune sauvegarde/.test(a40.message), `message, obtenu : ${a40.message}`);
});

test("Sauvegarde — sauvegarder remet le compteur à zéro", () => {
  const etat = { meta: { creeLe: "2026-08-01T10:00:00.000Z", derniereSauvegarde: null } };
  const apres = marquerSauvegarde(etat, "2026-09-10T10:00:00.000Z");
  const bilan = etatSauvegarde(apres, "2026-09-12T10:00:00.000Z");
  egal(bilan.jours, 2, "2 jours depuis la sauvegarde");
  egal(bilan.necessaire, false, "plus de rappel");
});

test("Sauvegarde — le nom du fichier porte la date", () => {
  egal(nomFichierSauvegarde("2026-09-10T18:30:00"), "entrainement-2026-09-10.json", "nom du fichier");
});

test("Sauvegarde — une sauvegarde complète se relit dans un dépôt vierge", () => {
  const source = creerDepot(faireStockage());
  const etat = source.charger();
  etat.checkins.push({ date: "2026-09-13", poidsKg: 70.4 });
  const fichier = exporterJson(etat);

  const cible = creerDepot(faireStockage());
  const restaure = cible.remplacer(fichier);
  egal(restaure.seancesSalle.length, 2, "séances restaurées");
  egal(restaure.checkins.length, 1, "check-in restauré");
});
