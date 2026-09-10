// CATALOGUE DES EXERCICES — c'est une donnée, pas du code.
// Modifiable librement sans toucher au reste de l'application.

// ===========================================================================
// LE MATÉRIEL DE LA SALLE
// ===========================================================================
// C'est ici, et nulle part ailleurs, qu'on décrit les machines.
// Chaque exercice pointe vers une de ces entrées.
//
// pas : incrément de charge réel, en kg. null = valeur pas encore relevée ;
//       tant qu'elle est nulle, l'appli REFUSE de proposer une progression
//       sur cette machine et affiche pourquoi, plutôt que d'inventer.
// max : charge maximale disponible. null = pas de plafond connu.
//
// >>> À RELEVER EN SALLE : les cinq « pas: null » ci-dessous. <<<

export const MATERIEL = {
  halteres: { nom: "Haltères", pas: 2, min: 2, max: 40 },
  banc: { nom: "Banc inclinable", pas: null },

  barre: { nom: "Barre", pas: null }, // = 2 × le plus petit disque de la salle
  "barre-w": { nom: "Barre en W", pas: null }, // idem
  "barre-guidee": { nom: "Barre de squat guidé (rails)", pas: null }, // idem

  "poulie-verticale": { nom: "Poulie verticale assis", pas: 2 },
  "poulie-horizontale": { nom: "Poulie horizontale assis", pas: 2 },
  "poulie-reglable": { nom: "Poulie réglable en hauteur", pas: 2 },

  presse: { nom: "Presse à cuisses horizontale", pas: null },
  "leg-curl": { nom: "Machine leg curl assis", pas: null },
  abducteurs: { nom: "Machine abducteurs assis", pas: null },
  "machine-epaules": { nom: "Machine épaules", pas: null },

  "barre-tractions": { nom: "Barre de tractions", pas: null },
  dips: { nom: "Barre à dips", pas: null },
  cube: { nom: "Cube", pas: null },
  aucun: { nom: "Aucun", pas: null },
};

// MATÉRIEL ABSENT DE LA SALLE — confirmé les 09 et 10/09/2026.
// Ne jamais proposer d'exercice qui en dépend :
//   machine à pectoraux (développé assis, pec deck) · leg extension ·
//   leg curl COUCHÉ (seul l'assis existe) · machine à mollets ·
//   banc pupitre · machine à tractions assistées · machine à dips assistée.
//
// Présent mais géré côté course, volontairement hors catalogue muscu :
//   vélo · rameur · tapis de course.

// ===========================================================================
// LES EXERCICES
// ===========================================================================
// disponible : false -> ne sera JAMAIS proposé.
// charge     : "ajoutee"     -> seuls les disques comptent (barres)
//              "totale"      -> la charge affichée est la charge
//              "corps"       -> poids du corps, non lestable
//              "corps-leste" -> poids du corps, lest possible (pas de 2 kg)
// pas        : présent uniquement pour forcer une valeur différente de celle
//              du matériel. Sinon, le pas du matériel s'applique.
// nomsHevy   : noms exacts observés dans un export Hevy réel. Un nom inconnu
//              rencontré à l'import est proposé à l'association, jamais deviné.

export const GROUPES = {
  jambes: "Jambes",
  mollets: "Mollets",
  dos: "Dos",
  pecs: "Pectoraux",
  epaules: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  gainage: "Gainage",
};

export const CATALOGUE = [
  // ---------------------------------------------------------------- JAMBES
  { id: "squat-guide", nom: "Squat (barre guidée)", groupe: "jambes",
    materiel: "barre-guidee", disponible: true, charge: "ajoutee",
    nomsHevy: ["Squat (Barre)"] },

  { id: "souleve-terre-roumain", nom: "Soulevé de terre roumain", groupe: "jambes",
    materiel: "barre", disponible: true, charge: "ajoutee", nomsHevy: [] },

  { id: "presse-cuisses", nom: "Presse à cuisses horizontale", groupe: "jambes",
    materiel: "presse", disponible: true, charge: "totale",
    nomsHevy: ["Presse à Cuisses Horizontale"] },

  { id: "leg-curl-assis", nom: "Leg curl assis", groupe: "jambes",
    materiel: "leg-curl", disponible: true, charge: "totale", nomsHevy: [],
    note: "Leg curl ASSIS. Il n'y a pas de leg curl couché dans la salle." },

  { id: "abducteurs", nom: "Abducteurs assis", groupe: "jambes",
    materiel: "abducteurs", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "fentes-marchees", nom: "Fentes marchées", groupe: "jambes",
    materiel: "halteres", disponible: true, charge: "corps-leste", nomsHevy: [] },

  { id: "split-squat-bulgare", nom: "Split squat bulgare", groupe: "jambes",
    materiel: "halteres", disponible: true, charge: "corps-leste", nomsHevy: [] },

  { id: "step-up", nom: "Step-up", groupe: "jambes",
    materiel: "cube", disponible: true, charge: "corps-leste", pas: 2, nomsHevy: [] },

  { id: "step-down", nom: "Step-down lent (3 s)", groupe: "jambes",
    materiel: "cube", disponible: true, charge: "corps-leste", pas: 2, nomsHevy: [],
    note: "Excentrique quadriceps — clé des descentes en trail. À garder toute l'année." },

  { id: "chaise", nom: "Chaise (isométrique)", groupe: "jambes",
    materiel: "aucun", disponible: true, charge: "corps", unite: "secondes", nomsHevy: [] },

  { id: "pont-fessier", nom: "Pont fessier talons surélevés", groupe: "jambes",
    materiel: "cube", disponible: true, charge: "corps-leste", pas: 2, nomsHevy: [] },

  // --------------------------------------------------------------- MOLLETS
  { id: "extension-mollet", nom: "Extension mollet debout", groupe: "mollets",
    materiel: "cube", disponible: true, charge: "corps-leste", pas: 2, nomsHevy: [],
    note: "Descente lente 3 s. Pas de machine à mollets dans la salle." },

  { id: "mollets-excentriques", nom: "Mollets excentriques", groupe: "mollets",
    materiel: "aucun", disponible: true, charge: "corps", nomsHevy: [] },

  // ------------------------------------------------------------------- DOS
  { id: "tirage-vertical", nom: "Tirage vertical prise large", groupe: "dos",
    materiel: "poulie-verticale", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "rowing-haltere", nom: "Rowing haltère unilatéral (appui banc)", groupe: "dos",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [],
    note: "Toujours en appui sur le banc, jamais penché libre : le bas du dos travaille déjà ailleurs." },

  { id: "tirage-horizontal", nom: "Tirage horizontal poulie (assis, buste calé)", groupe: "dos",
    materiel: "poulie-horizontale", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "tirage-bras-tendus", nom: "Tirage bras tendus", groupe: "dos",
    materiel: "poulie-reglable", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "rowing-barre", nom: "Rowing barre", groupe: "dos",
    materiel: "barre", disponible: true, charge: "ajoutee", nomsHevy: [] },

  { id: "tractions", nom: "Tractions", groupe: "dos",
    materiel: "barre-tractions", disponible: true, charge: "corps-leste", pas: 2, nomsHevy: [],
    note: "Jamais testé. Établir un maximum avant toute prescription. Pas de machine assistée dans la salle." },

  // -------------------------------------------------------------- PECTORAUX
  { id: "developpe-couche-halteres", nom: "Développé couché (haltères)", groupe: "pecs",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [],
    note: "Haltères plutôt que barre : meilleure amplitude, épaules protégées, plus sûr seul." },

  { id: "developpe-couche-barre", nom: "Développé couché (barre)", groupe: "pecs",
    materiel: "barre", disponible: true, charge: "ajoutee", nomsHevy: [] },

  { id: "developpe-incline-halteres", nom: "Développé incliné (haltères)", groupe: "pecs",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "ecarte-poulie-haute", nom: "Écarté à la poulie haute", groupe: "pecs",
    materiel: "poulie-reglable", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "ecarte-halteres", nom: "Écarté (haltères)", groupe: "pecs",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "dips", nom: "Dips", groupe: "pecs",
    materiel: "dips", disponible: true, charge: "corps-leste", pas: 2, nomsHevy: [],
    note: "Poids du corps. Maximum à établir. Il n'y a PAS de machine à dips assistée." },

  // ---------------------------------------------------------------- ÉPAULES
  { id: "developpe-epaules-machine", nom: "Développé épaules (machine)", groupe: "epaules",
    materiel: "machine-epaules", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "developpe-militaire-halteres", nom: "Développé militaire (haltères, assis dossier)", groupe: "epaules",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "elevations-laterales", nom: "Élévations latérales", groupe: "epaules",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [],
    note: "Léger, propre, jamais d'élan. Deltoïde latéral = largeur d'épaule." },

  { id: "face-pull", nom: "Face pull poulie", groupe: "epaules",
    materiel: "poulie-reglable", disponible: true, charge: "totale", nomsHevy: [],
    note: "Deltoïde postérieur, santé d'épaule." },

  { id: "oiseau", nom: "Oiseau (arrière d'épaule)", groupe: "epaules",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [] },

  // ----------------------------------------------------------------- BICEPS
  { id: "curl-incline", nom: "Curl haltères sur banc incliné", groupe: "biceps",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [],
    note: "Remplace le « curl pupitre » loggé le 08/09 : pas de banc pupitre, l'exercice était fait sur banc incliné." },

  { id: "curl-poulie", nom: "Curl biceps poulie", groupe: "biceps",
    materiel: "poulie-reglable", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "curl-marteau", nom: "Curl marteau (haltères)", groupe: "biceps",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "curl-barre-w", nom: "Curl barre en W", groupe: "biceps",
    materiel: "barre-w", disponible: true, charge: "ajoutee", nomsHevy: [] },

  // ---------------------------------------------------------------- TRICEPS
  { id: "extension-triceps-overhead", nom: "Extension triceps overhead (poulie)", groupe: "triceps",
    materiel: "poulie-reglable", disponible: true, charge: "totale", nomsHevy: [],
    note: "Bras au-dessus de la tête : chef long du triceps." },

  { id: "extension-nuque-haltere", nom: "Extension nuque (haltère)", groupe: "triceps",
    materiel: "halteres", disponible: true, charge: "totale", nomsHevy: [] },

  { id: "barre-au-front", nom: "Barre au front", groupe: "triceps",
    materiel: "barre-w", disponible: true, charge: "ajoutee", nomsHevy: [] },

  // ---------------------------------------------------------------- GAINAGE
  { id: "planche", nom: "Planche ventrale", groupe: "gainage",
    materiel: "aucun", disponible: true, charge: "corps", unite: "secondes", nomsHevy: [],
    note: "Non négociable." },

  { id: "planche-laterale", nom: "Planche latérale", groupe: "gainage",
    materiel: "aucun", disponible: true, charge: "corps", unite: "secondes", nomsHevy: [],
    note: "Stabilité du bassin = économie de course en fin de trail." },

  { id: "equilibre-unipodal", nom: "Équilibre unipodal", groupe: "gainage",
    materiel: "aucun", disponible: true, charge: "corps", unite: "secondes", nomsHevy: [] },
];

// EXERCICE INTERDIT indépendamment du matériel :
//   Nordic curl — jamais pratiqué, 4 à 6 jours de courbatures profondes.
//   Interdiction datée, voir config/calendrier.js.

export const parId = Object.fromEntries(CATALOGUE.map((e) => [e.id, e]));

// Le pas de progression d'un exercice : le sien s'il en force un,
// sinon celui de son matériel. null = inconnu, aucune progression proposée.
export function pasDe(exercice) {
  if (exercice.pas !== undefined) return exercice.pas;
  return MATERIEL[exercice.materiel]?.pas ?? null;
}

// La charge maximale disponible, si le matériel en impose une.
export function plafondDe(exercice) {
  return MATERIEL[exercice.materiel]?.max ?? null;
}
