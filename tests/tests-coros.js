// Tests du parseur COROS, écrits sur les 6 fichiers réels de Thomas et sur
// les valeurs qu'il a relevées lui-même. Aucune valeur attendue n'est
// calculée par le code testé : elles viennent toutes de lui.

import { test, egal, proche, vrai, mmss } from "./executer.js";
import {
  parserCoros,
  dateDepuisNomFichier,
  tempsEnSecondes,
  detecterStructure,
  splitsExploitables,
  tempsArretS,
  efficienceAerobie,
  deriveCardiaque,
  blocsComparables,
  pointsAberrants,
  moyennesFoulee,
} from "../parseurs/coros.js";

const DOSSIER = "./fichiers-coros/";

// Le tableau de référence fourni par Thomas.
const ATTENDU = [
  {
    fichier: "Loire-AtlantiqueCourse20260824182641.csv",
    date: "2026-08-24T18:26:41",
    structure: "kilometres",
    distanceKm: 25.02,
    tempsS: 8621, // 2:23:41
    allureS: 337, // 5:37
    fcMoy: 140,
    fcMax: 164,
    arretS: 190, // 3:10
    efficience: 1.27,
  },
  {
    fichier: "Course20260826174529.csv",
    date: "2026-08-26T17:45:29",
    structure: "etapes",
    distanceKm: 13.07,
    tempsS: 4133, // 1:08:53
    allureS: 299, // 4:59
    fcMoy: 152,
    fcMax: 177,
    arretS: 223, // 3:43
  },
  {
    fichier: "Course20260830102028.csv",
    date: "2026-08-30T10:20:28",
    structure: "etapes",
    distanceKm: 24.84,
    tempsS: 8850, // 2:27:30
    allureS: 331, // 5:31
    fcMoy: 142,
    fcMax: 167,
    arretS: 624, // 10:24
    efficience: 1.28,
  },
  {
    fichier: "Loire-AtlantiqueCourse20260901202045.csv",
    date: "2026-09-01T20:20:45",
    structure: "kilometres",
    distanceKm: 15.76,
    tempsS: 5147, // 1:25:47
    allureS: 324, // 5:24
    fcMoy: 142,
    fcMax: 160,
    arretS: 39, // 0:39
    efficience: 1.3,
  },
  {
    fichier: "Loire-AtlantiqueCourse20260904104733.csv",
    date: "2026-09-04T10:47:33",
    structure: "kilometres",
    distanceKm: 28.02,
    tempsS: 9935, // 2:45:35
    allureS: 347, // 5:47
    fcMoy: 146,
    fcMax: 163,
    arretS: 200, // 3:20
    efficience: 1.18,
  },
  {
    fichier: "Loire-AtlantiqueCourse20260907190348.csv",
    date: "2026-09-07T19:03:48",
    structure: "kilometres",
    distanceKm: 6.9,
    tempsS: 2514, // 0:41:54
    allureS: 360, // 6:00
    fcMoy: 135,
    fcMax: 149,
    arretS: 32, // 0:32
  },
];

const cache = new Map();
async function charger(fichier) {
  if (!cache.has(fichier)) {
    const r = await fetch(DOSSIER + fichier);
    if (!r.ok) throw new Error(`Fichier introuvable : ${fichier}`);
    cache.set(fichier, parserCoros(await r.text(), fichier));
  }
  return cache.get(fichier);
}

// ------------------------------------------------- Conversions élémentaires

test("Les espaces en fin de champ de temps sont absorbés", () => {
  egal(tempsEnSecondes("00:06:15    "), 375, "00:06:15");
  egal(tempsEnSecondes("01:08:53    "), 4133, "01:08:53");
  egal(tempsEnSecondes(""), null, "champ vide");
});

test("La date est extraite du nom, quel que soit le préfixe", () => {
  egal(
    dateDepuisNomFichier("Loire-AtlantiqueCourse20260904104733.csv"),
    "2026-09-04T10:47:33",
    "préfixe département"
  );
  egal(dateDepuisNomFichier("Course20260830102028.csv"), "2026-08-30T10:20:28", "préfixe court");
  egal(dateDepuisNomFichier("nimportequoi20260101000000.csv"), "2026-01-01T00:00:00", "préfixe inconnu");
  egal(dateDepuisNomFichier("SansDate.csv"), null, "aucune date");
});

test("Une structure inconnue ne plante pas la détection", () => {
  egal(detecterStructure([]), "etapes", "aucun split");
  egal(detecterStructure([{ distanceKm: 1 }]), "etapes", "un seul split");
});

// ------------------------------------------------ Les six fichiers réels

for (const a of ATTENDU) {
  const court = a.fichier.replace(/^.*Course/, "").slice(0, 8);

  test(`${court} — date, structure et intégrité`, async () => {
    const s = await charger(a.fichier);
    egal(s.date, a.date, "date");
    egal(s.structure, a.structure, "structure détectée");
    vrai(
      s.splits.every((x) => x.libelle.toLowerCase() !== "summary"),
      "la ligne Summary ne doit jamais compter comme un split"
    );
    vrai(s.splits.length > 0, "au moins un split");
  });

  test(`${court} — totaux conformes au relevé de Thomas`, async () => {
    const s = await charger(a.fichier);
    proche(s.resume.distanceKm, a.distanceKm, 0.001, "distance");
    proche(s.resume.tempsS, a.tempsS, 0, `temps (${mmss(a.tempsS)})`);
    proche(s.resume.allureS, a.allureS, 0, `allure (${mmss(a.allureS)})`);
    egal(s.resume.fcMoy, a.fcMoy, "FC moyenne");
    egal(s.resume.fcMax, a.fcMax, "FC max");
  });

  test(`${court} — temps d'arrêt = Time − Moving Time`, async () => {
    const s = await charger(a.fichier);
    proche(tempsArretS(s), a.arretS, 0, `arrêts (${mmss(a.arretS)})`);
  });

  if (a.efficience !== undefined) {
    test(`${court} — efficience aérobie ${a.efficience} m/battement`, async () => {
      const s = await charger(a.fichier);
      proche(efficienceAerobie(s), a.efficience, 0.005, "efficience");
    });
  }
}

// ------------------------------------------------------ Pièges spécifiques

test("La cadence est doublée : le fichier donne des foulées, pas des pas", async () => {
  const s = await charger("Loire-AtlantiqueCourse20260907190348.csv");
  // Ligne 1 du fichier : "75" foulées -> 150 pas/min.
  egal(s.splits[0].cadence, 150, "cadence du km 1");
  egal(s.splits[0].cadenceMax, 160, "cadence max du km 1");
  // Contrôle de cohérence : 6:00/km = 166,7 m/min ; 166,7 / 1,10 m = 151,5.
  const attenduTheorique = (1000 / (s.splits[0].allureS / 60)) / (s.splits[0].fouleeCm / 100);
  proche(s.splits[0].cadence, attenduTheorique, 5, "cadence recoupée par la foulée");
});

test("Les splits sous 500 m sont écartés des analyses", async () => {
  const s = await charger("Loire-AtlantiqueCourse20260904104733.csv");
  const dernier = s.splits[s.splits.length - 1];
  vrai(dernier.distanceKm < 0.5, `le dernier split fait ${dernier.distanceKm} km`);
  const retenus = splitsExploitables(s);
  egal(retenus.length, s.splits.length - 1, "un seul split écarté");
});

test("Un dernier split de 0,90 km reste exploitable", async () => {
  const s = await charger("Loire-AtlantiqueCourse20260907190348.csv");
  egal(splitsExploitables(s).length, s.splits.length, "aucun split écarté");
});

test("04/09 — dérive cardiaque de +9 bpm", async () => {
  const s = await charger("Loire-AtlantiqueCourse20260904104733.csv");
  const d = deriveCardiaque(s);
  proche(d.premiere.distanceKm, 14, 0.001, "distance première moitié");
  proche(d.seconde.distanceKm, 14, 0.001, "distance seconde moitié");
  proche(d.premiere.fcMoy, 141, 0.5, "FC première moitié");
  proche(d.seconde.fcMoy, 150, 0.5, "FC seconde moitié");
  proche(d.deltaBpm, 9, 0.5, "dérive");
  proche(d.premiere.allureS, 348, 1, "allure première moitié (5:48)");
  proche(d.seconde.allureS, 346, 1, "allure seconde moitié (5:46)");
});

test("La dérive n'est pas calculée sur une séance structurée", async () => {
  const s = await charger("Course20260826174529.csv");
  egal(deriveCardiaque(s), null, "dérive sur séance à étapes");
});

test("26/08 — les deux blocs de 12:00 sont comparés entre eux", async () => {
  const s = await charger("Course20260826174529.csv");
  const groupes = blocsComparables(s);
  const douzeMinutes = groupes.find((g) => g.dureeS === 720);
  vrai(douzeMinutes, "un groupe de blocs de 12:00 doit exister");
  egal(douzeMinutes.blocs.length, 2, "deux blocs de 12:00");
  egal(douzeMinutes.blocs[0].fcMoy, 168, "FC du premier bloc");
  egal(douzeMinutes.blocs[1].fcMoy, 169, "FC du second bloc");
  egal(douzeMinutes.deltaFcBpm, 1, "écart entre les deux blocs");
});

test("04/09 — les deux points aberrants de cadence sont repérés", async () => {
  const s = await charger("Loire-AtlantiqueCourse20260904104733.csv");
  const libelles = pointsAberrants(s).map((p) => p.libelle);
  const vus = libelles.join(", ") || "aucun";
  // Km 17 : cadence 61 dans le fichier, soit 122 pas/min, pour une allure de 7:10.
  vrai(libelles.includes("17"), `le km 17 doit être signalé, repérés : ${vus}`);
  // Km 1 : cadence maximale de 100 dans le fichier, soit 200 pas/min.
  vrai(libelles.includes("1"), `le km 1 doit être signalé, repérés : ${vus}`);
});

test("04/09 — les aberrants ne faussent pas la cadence moyenne", async () => {
  const s = await charger("Loire-AtlantiqueCourse20260904104733.csv");
  const moy = moyennesFoulee(s);
  egal(moy.splitsEcartes, 2, "deux splits écartés de la moyenne");
  vrai(moy.cadence > 150 && moy.cadence < 160, `cadence purgée crédible, obtenue : ${Math.round(moy.cadence)}`);
});

test("Une sortie propre ne déclenche aucune alerte de cadence", async () => {
  const s = await charger("Loire-AtlantiqueCourse20260907190348.csv");
  egal(pointsAberrants(s).length, 0, "aucun point aberrant sur le footing du 07/09");
});

test("Un fichier qui n'est pas un export COROS est refusé", () => {
  let refuse = false;
  try {
    parserCoros("nom,prenom\nThomas,Dubourg", "Course20260101000000.csv");
  } catch (e) {
    refuse = true;
  }
  vrai(refuse, "un CSV étranger doit être refusé");
});

test("Un fichier sans ligne Summary est refusé", () => {
  const entete =
    '"Split","Time","Moving Time","GetDistance","Elevation Gain","Elev Loss","Avg Pace",' +
    '"Avg Moving Pace","Best Pace","Avg Run Cadence","Max Run Cadence","Avg Stride Length",' +
    '"Avg HR","Max HR","Avg Temperature","Calories"';
  const ligne = '"1","00:06:15","00:06:15","1","0","8","00:06:15","00:06:16","00:05:44","75","80","107","126","147","30","70"';
  let refuse = false;
  try {
    parserCoros(entete + "\n" + ligne, "Course20260101000000.csv");
  } catch (e) {
    refuse = true;
  }
  vrai(refuse, "un fichier tronqué doit être refusé");
});
