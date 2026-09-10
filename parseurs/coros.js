// PARSEUR DES EXPORTS CSV DE LA MONTRE COROS.
//
// Le fichier ne contient ni date, ni type de séance, ni titre, et sa colonne
// de température est fausse. Tout ce que ce parseur ne peut pas lire est
// laissé vide pour être saisi à la main — jamais deviné.

const SPLIT_MINIMUM_KM = 0.5; // en dessous, le split est un reliquat de fin

// ---------------------------------------------------------------- LECTURE

// La date n'existe que dans le nom du fichier, et le préfixe varie :
//   Loire-AtlantiqueCourse20260904104733.csv
//   Course20260830102028.csv
// On cherche donc AAAAMMJJHHMMSS n'importe où, sans rien supposer du reste.
export function dateDepuisNomFichier(nom) {
  const m = String(nom).match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, a, mo, j, h, mi, s] = m;
  const date = `${a}-${mo}-${j}T${h}:${mi}:${s}`;
  if (Number(mo) < 1 || Number(mo) > 12 || Number(j) < 1 || Number(j) > 31) return null;
  return date;
}

// "00:06:15    " -> 375. Tous les champs de temps traînent des espaces.
export function tempsEnSecondes(brut) {
  if (brut === null || brut === undefined) return null;
  const t = String(brut).trim();
  if (!t || t === "--") return null;
  const parts = t.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function nombre(brut) {
  if (brut === null || brut === undefined) return null;
  const t = String(brut).trim();
  if (!t || t === "--") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

function lignesCsv(texte) {
  return texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.split(",").map((c) => c.replace(/^"|"$/g, "")));
}

function versSplit(colonnes, entetes) {
  const v = (nom) => colonnes[entetes.indexOf(nom)];
  const cadence = nombre(v("Avg Run Cadence"));
  const cadenceMax = nombre(v("Max Run Cadence"));
  return {
    libelle: String(v("Split")).trim(),
    tempsS: tempsEnSecondes(v("Time")),
    tempsMobileS: tempsEnSecondes(v("Moving Time")),
    distanceKm: nombre(v("GetDistance")),
    dPlusM: nombre(v("Elevation Gain")),
    dMoinsM: nombre(v("Elev Loss")),
    allureS: tempsEnSecondes(v("Avg Pace")),
    allureMobileS: tempsEnSecondes(v("Avg Moving Pace")),
    meilleureAllureS: tempsEnSecondes(v("Best Pace")),
    // Le fichier donne les FOULÉES par minute, pas les pas. 75 -> 150.
    cadence: cadence === null ? null : cadence * 2,
    cadenceMax: cadenceMax === null ? null : cadenceMax * 2,
    fouleeCm: nombre(v("Avg Stride Length")),
    fcMoy: nombre(v("Avg HR")),
    fcMax: nombre(v("Max HR")),
    calories: nombre(v("Calories")),
    // "Avg Temperature" est délibérément ignorée : capteur au poignet,
    // surestime de 5 à 10 °C. La vraie valeur est saisie à la main.
  };
}

// Deux structures de fichier existent, et rien dans l'en-tête ne les
// distingue. Sortie libre : une ligne par kilomètre, GetDistance vaut 1
// partout sauf la dernière ligne, partielle. Séance programmée sur la
// montre : une ligne par étape, de durée variable.
export function detecterStructure(splits) {
  if (splits.length < 2) return "etapes";
  const saufDernier = splits.slice(0, -1);
  const tousAUn = saufDernier.every((s) => s.distanceKm === 1);
  return tousAUn ? "kilometres" : "etapes";
}

export function parserCoros(texte, nomFichier) {
  const lignes = lignesCsv(texte);
  if (lignes.length < 2) throw new Error("Fichier COROS vide ou illisible.");

  const entetes = lignes[0];
  if (entetes.indexOf("Split") !== 0) {
    throw new Error("Ce fichier n'a pas l'en-tête d'un export COROS.");
  }

  const toutes = lignes.slice(1).map((c) => versSplit(c, entetes));

  // La dernière ligne porte Split = "Summary". Ce n'est jamais un split.
  const resume = toutes.find((s) => s.libelle.toLowerCase() === "summary") || null;
  const splits = toutes.filter((s) => s.libelle.toLowerCase() !== "summary");

  if (!resume) throw new Error("Ligne « Summary » absente : fichier incomplet.");

  return {
    date: dateDepuisNomFichier(nomFichier),
    fichier: nomFichier,
    structure: detecterStructure(splits),
    structureDetecteeAutomatiquement: true,
    splits,
    resume,
  };
}

// ---------------------------------------------------------------- ANALYSES

// Les splits assez longs pour que leurs moyennes veuillent dire quelque chose.
// Le dernier split d'une sortie fait souvent 0,90 km, parfois 0,02.
export function splitsExploitables(seance) {
  return seance.splits.filter((s) => s.distanceKm !== null && s.distanceKm >= SPLIT_MINIMUM_KM);
}

// Temps d'arrêt = Time − Moving Time, lu sur la ligne Summary.
export function tempsArretS(seance) {
  const r = seance.resume;
  if (r.tempsS === null || r.tempsMobileS === null) return null;
  return r.tempsS - r.tempsMobileS;
}

// Efficience aérobie, en mètres parcourus par battement de cœur.
// Calculée sur le temps EN MOUVEMENT : les arrêts ne font pas avancer.
export function efficienceAerobie(seance) {
  const r = seance.resume;
  if (!r.distanceKm || !r.tempsMobileS || !r.fcMoy) return null;
  const metresParMinute = (r.distanceKm * 1000) / (r.tempsMobileS / 60);
  return metresParMinute / r.fcMoy;
}

function moyennePonderee(splits, champ) {
  let somme = 0;
  let poids = 0;
  for (const s of splits) {
    if (s[champ] === null || !s.distanceKm) continue;
    somme += s[champ] * s.distanceKm;
    poids += s.distanceKm;
  }
  return poids === 0 ? null : somme / poids;
}

// Dérive cardiaque : FC moyenne de la première moitié contre la seconde.
// N'a de sens que sur des splits kilométriques. Sur une séance structurée,
// c'est blocsComparables() qui répond.
export function deriveCardiaque(seance) {
  if (seance.structure !== "kilometres") return null;

  const splits = splitsExploitables(seance);
  if (splits.length < 4) return null;

  const total = splits.reduce((t, s) => t + s.distanceKm, 0);
  const moitie = total / 2;

  const premiere = [];
  const seconde = [];
  let cumul = 0;
  for (const s of splits) {
    (cumul < moitie ? premiere : seconde).push(s);
    cumul += s.distanceKm;
  }
  if (!premiere.length || !seconde.length) return null;

  const fc1 = moyennePonderee(premiere, "fcMoy");
  const fc2 = moyennePonderee(seconde, "fcMoy");

  return {
    premiere: {
      distanceKm: premiere.reduce((t, s) => t + s.distanceKm, 0),
      fcMoy: fc1,
      allureS: moyennePonderee(premiere, "allureS"),
    },
    seconde: {
      distanceKm: seconde.reduce((t, s) => t + s.distanceKm, 0),
      fcMoy: fc2,
      allureS: moyennePonderee(seconde, "allureS"),
    },
    deltaBpm: fc1 === null || fc2 === null ? null : fc2 - fc1,
  };
}

// Sur une séance structurée, les blocs de même durée sont comparables entre
// eux : ce sont les répétitions de la séance. Exemple du 26/08, les deux
// blocs de 12:00 : FC 168 puis 169.
export function blocsComparables(seance) {
  if (seance.structure !== "etapes") return [];
  const groupes = new Map();
  for (const s of seance.splits) {
    if (s.tempsMobileS === null) continue;
    if (!groupes.has(s.tempsMobileS)) groupes.set(s.tempsMobileS, []);
    groupes.get(s.tempsMobileS).push(s);
  }
  return [...groupes.entries()]
    .filter(([, membres]) => membres.length >= 2)
    .map(([dureeS, membres]) => ({
      dureeS,
      blocs: membres.map((s) => ({
        libelle: s.libelle,
        fcMoy: s.fcMoy,
        allureS: s.allureS,
        distanceKm: s.distanceKm,
      })),
      deltaFcBpm: membres[membres.length - 1].fcMoy - membres[0].fcMoy,
    }))
    .sort((a, b) => b.dureeS - a.dureeS);
}

function mediane(valeurs) {
  const t = valeurs.filter((v) => v !== null).sort((a, b) => a - b);
  return t.length ? t[Math.floor(t.length / 2)] : null;
}

// Points aberrants de cadence, sur les deux versants. Le 04/09 en donne un de
// chaque : le km 17 tombe à 122 pas/min pour une allure de 7:10 — une marche —
// et le km 1 affiche une cadence maximale de 200 pas/min, physiologiquement
// impossible : le capteur décroche au démarrage.
//
// Règle : cadence moyenne inférieure de plus de 15 % à la médiane de la
// sortie, OU cadence maximale supérieure de plus de 20 % à la médiane des
// maximales. Ces points sont SIGNALÉS et écartés des moyennes de foulée,
// jamais supprimés des données.
export function pointsAberrants(seance) {
  const splits = splitsExploitables(seance).filter((s) => s.cadence !== null);
  if (splits.length < 3) return [];

  const medianeCadence = mediane(splits.map((s) => s.cadence));
  const medianeMax = mediane(splits.map((s) => s.cadenceMax));
  const plancher = medianeCadence * 0.85;
  const plafond = medianeMax === null ? Infinity : medianeMax * 1.2;

  const aberrants = [];
  for (const s of splits) {
    if (s.cadence < plancher) {
      aberrants.push({
        libelle: s.libelle,
        cadence: s.cadence,
        allureS: s.allureS,
        raison:
          `Cadence ${Math.round(s.cadence)} pas/min contre ${Math.round(medianeCadence)} ` +
          `de médiane : arrêt ou marche probable.`,
      });
    } else if (s.cadenceMax !== null && s.cadenceMax > plafond) {
      aberrants.push({
        libelle: s.libelle,
        cadence: s.cadence,
        cadenceMax: s.cadenceMax,
        allureS: s.allureS,
        raison:
          `Cadence maximale de ${Math.round(s.cadenceMax)} pas/min contre ` +
          `${Math.round(medianeMax)} de médiane : mesure invraisemblable.`,
      });
    }
  }
  return aberrants;
}

// Moyennes de la sortie, pondérées par la distance et purgées des points
// aberrants. Les totaux (distance, temps, FC) viennent du Summary, qui fait
// foi ; ces moyennes-ci ne servent qu'aux indicateurs de foulée.
export function moyennesFoulee(seance) {
  const aberrants = new Set(pointsAberrants(seance).map((p) => p.libelle));
  const splits = splitsExploitables(seance).filter((s) => !aberrants.has(s.libelle));
  return {
    cadence: moyennePonderee(splits, "cadence"),
    fouleeCm: moyennePonderee(splits, "fouleeCm"),
    splitsRetenus: splits.length,
    splitsEcartes: aberrants.size,
  };
}

// Ce que le fichier ne dira jamais et qu'il faut demander à l'utilisateur.
export function champsASaisir() {
  return {
    type: null, // ef · seuil · vma · sortie-longue · ...
    titre: null,
    temperatureC: null, // OBLIGATOIRE : le capteur COROS est au poignet
    ressenti: null, // 1 à 5
    glucides: [],
    douleurs: "",
    note: "",
  };
}
