// CATALOGUE DES EXERCICES — c'est une donnée, pas du code.
// Modifiable librement sans toucher au reste de l'application.
//
// disponible : false -> l'exercice ne sera JAMAIS proposé (matériel absent de la salle).
// pas        : incrément de charge réel, en kg. null = inconnu ; aucune progression
//              ne sera proposée tant que la valeur n'est pas renseignée.
// charge     : "ajoutee"     -> seuls les disques comptent (barres)
//              "totale"      -> la charge affichée est la charge (colonnes, haltères)
//              "corps"       -> poids du corps, non lestable
//              "corps-leste" -> poids du corps, lest possible
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
  {
    id: "squat-guide",
    nom: "Squat (barre guidée)",
    groupe: "jambes",
    materiel: "Barre de squat guidé (rails)",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : 2 × plus petit disque de la salle
    nomsHevy: ["Squat (Barre)"],
  },
  {
    id: "souleve-terre-roumain",
    nom: "Soulevé de terre roumain",
    groupe: "jambes",
    materiel: "Barre",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : 2 × plus petit disque de la salle
    nomsHevy: [],
  },
  {
    id: "presse-cuisses",
    nom: "Presse à cuisses horizontale",
    groupe: "jambes",
    materiel: "Presse horizontale (broche)",
    disponible: true,
    charge: "totale",
    pas: null, // à confirmer : cran réel de la colonne
    nomsHevy: ["Presse à Cuisses Horizontale"],
  },
  {
    id: "leg-curl",
    nom: "Leg curl",
    groupe: "jambes",
    materiel: "Machine leg curl (broche)",
    disponible: false, // À TRANCHER — voir note
    charge: "totale",
    pas: null,
    nomsHevy: [],
    note:
      "CONTRADICTION À TRANCHER : la liste du matériel mentionne une machine à " +
      "leg curl, mais le programme dit « leg curl couché : n'existe pas dans " +
      "cette salle, ne jamais le prescrire ». Mis à disponible:false par " +
      "précaution. À rouvrir si la machine est un leg curl assis ou debout.",
  },
  {
    id: "abducteurs",
    nom: "Abducteurs assis",
    groupe: "jambes",
    materiel: "Machine abducteurs (broche)",
    disponible: true,
    charge: "totale",
    pas: null, // à confirmer : cran réel de la colonne
    nomsHevy: [],
  },
  {
    id: "fentes-marchees",
    nom: "Fentes marchées",
    groupe: "jambes",
    materiel: "Haltères",
    disponible: true,
    charge: "corps-leste",
    pas: 2, // haltère suivant : +2 kg par main
    nomsHevy: [],
  },
  {
    id: "split-squat-bulgare",
    nom: "Split squat bulgare",
    groupe: "jambes",
    materiel: "Banc + haltères",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "step-up",
    nom: "Step-up",
    groupe: "jambes",
    materiel: "Cube + haltères",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "step-down",
    nom: "Step-down lent (3 s)",
    groupe: "jambes",
    materiel: "Cube",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
    note: "Excentrique quadriceps — clé des descentes en trail. À garder toute l'année.",
  },
  {
    id: "chaise",
    nom: "Chaise (isométrique)",
    groupe: "jambes",
    materiel: "Aucun",
    disponible: true,
    charge: "corps",
    pas: null,
    unite: "secondes",
    nomsHevy: [],
  },
  {
    id: "pont-fessier",
    nom: "Pont fessier talons surélevés",
    groupe: "jambes",
    materiel: "Cube ou banc",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
  },

  // --------------------------------------------------------------- MOLLETS
  {
    id: "extension-mollet",
    nom: "Extension mollet debout",
    groupe: "mollets",
    materiel: "Cube ou marche (+ haltères)",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
    note: "Descente lente 3 s. Protège le tendon d'Achille. Pas de machine à mollets dans la salle.",
  },
  {
    id: "mollets-excentriques",
    nom: "Mollets excentriques",
    groupe: "mollets",
    materiel: "Marche",
    disponible: true,
    charge: "corps",
    pas: null,
    nomsHevy: [],
  },

  // ------------------------------------------------------------------- DOS
  {
    id: "tirage-vertical",
    nom: "Tirage vertical prise large",
    groupe: "dos",
    materiel: "Poulie verticale assis",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "rowing-haltere",
    nom: "Rowing haltère unilatéral (appui banc)",
    groupe: "dos",
    materiel: "Haltères + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
    note: "Toujours en appui sur le banc, jamais penché libre : le bas du dos travaille déjà ailleurs.",
  },
  {
    id: "tirage-horizontal",
    nom: "Tirage horizontal poulie (assis, buste calé)",
    groupe: "dos",
    materiel: "Poulie horizontale assis",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "tirage-bras-tendus",
    nom: "Tirage bras tendus",
    groupe: "dos",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "rowing-barre",
    nom: "Rowing barre",
    groupe: "dos",
    materiel: "Barre",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : 2 × plus petit disque de la salle
    nomsHevy: [],
  },
  {
    id: "tractions",
    nom: "Tractions",
    groupe: "dos",
    materiel: "Barre de tractions",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
    note:
      "Jamais testé à ce jour. Établir un maximum avant toute prescription. " +
      "Pas de machine à tractions assistées dans la salle.",
  },

  // -------------------------------------------------------------- PECTORAUX
  {
    id: "developpe-couche-halteres",
    nom: "Développé couché (haltères)",
    groupe: "pecs",
    materiel: "Haltères + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
    note: "Haltères plutôt que barre : meilleure amplitude, épaules protégées, plus sûr seul.",
  },
  {
    id: "developpe-couche-barre",
    nom: "Développé couché (barre)",
    groupe: "pecs",
    materiel: "Barre + banc",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : 2 × plus petit disque de la salle
    nomsHevy: [],
  },
  {
    id: "developpe-incline-halteres",
    nom: "Développé incliné (haltères)",
    groupe: "pecs",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "ecarte-poulie-haute",
    nom: "Écarté à la poulie haute",
    groupe: "pecs",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "ecarte-halteres",
    nom: "Écarté (haltères)",
    groupe: "pecs",
    materiel: "Haltères + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "dips",
    nom: "Dips",
    groupe: "pecs",
    materiel: "Barre à dips",
    disponible: true,
    charge: "corps-leste",
    pas: 2,
    nomsHevy: [],
    note: "Dips au poids du corps. Il n'y a PAS de machine à dips assistée dans la salle.",
  },

  // ---------------------------------------------------------------- ÉPAULES
  {
    id: "developpe-militaire-halteres",
    nom: "Développé militaire (haltères, assis dossier)",
    groupe: "epaules",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "developpe-epaules-machine",
    nom: "Développé épaules (machine)",
    groupe: "epaules",
    materiel: "Machine épaules (broche)",
    disponible: true,
    charge: "totale",
    pas: null, // à confirmer : cran réel de la colonne
    nomsHevy: [],
  },
  {
    id: "elevations-laterales",
    nom: "Élévations latérales",
    groupe: "epaules",
    materiel: "Haltères",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
    note: "Léger, propre, jamais d'élan. Deltoïde latéral = largeur d'épaule.",
  },
  {
    id: "face-pull",
    nom: "Face pull poulie",
    groupe: "epaules",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
    note: "Deltoïde postérieur, santé d'épaule.",
  },
  {
    id: "oiseau",
    nom: "Oiseau (arrière d'épaule)",
    groupe: "epaules",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },

  // ----------------------------------------------------------------- BICEPS
  {
    id: "curl-incline",
    nom: "Curl haltères sur banc incliné",
    groupe: "biceps",
    materiel: "Haltères + banc inclinable",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
    note:
      "Remplace le « curl pupitre » loggé le 08/09 : il n'y a pas de banc " +
      "pupitre dans la salle, l'exercice était fait sur banc incliné.",
  },
  {
    id: "curl-poulie",
    nom: "Curl biceps poulie",
    groupe: "biceps",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "curl-marteau",
    nom: "Curl marteau (haltères)",
    groupe: "biceps",
    materiel: "Haltères",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "curl-barre-w",
    nom: "Curl barre en W",
    groupe: "biceps",
    materiel: "Barre en W",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : 2 × plus petit disque de la salle
    nomsHevy: [],
  },

  // ---------------------------------------------------------------- TRICEPS
  {
    id: "extension-triceps-overhead",
    nom: "Extension triceps overhead (poulie)",
    groupe: "triceps",
    materiel: "Poulie réglable en hauteur",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
    note: "Bras au-dessus de la tête : chef long du triceps.",
  },
  {
    id: "extension-nuque-haltere",
    nom: "Extension nuque (haltère)",
    groupe: "triceps",
    materiel: "Haltère + banc",
    disponible: true,
    charge: "totale",
    pas: 2,
    nomsHevy: [],
  },
  {
    id: "barre-au-front",
    nom: "Barre au front",
    groupe: "triceps",
    materiel: "Barre en W + banc",
    disponible: true,
    charge: "ajoutee",
    pas: null, // à confirmer : 2 × plus petit disque de la salle
    nomsHevy: [],
  },

  // ---------------------------------------------------------------- GAINAGE
  {
    id: "planche",
    nom: "Planche ventrale",
    groupe: "gainage",
    materiel: "Aucun",
    disponible: true,
    charge: "corps",
    pas: null,
    unite: "secondes",
    nomsHevy: [],
    note: "Non négociable.",
  },
  {
    id: "planche-laterale",
    nom: "Planche latérale",
    groupe: "gainage",
    materiel: "Aucun",
    disponible: true,
    charge: "corps",
    pas: null,
    unite: "secondes",
    nomsHevy: [],
    note: "Stabilité du bassin = économie de course en fin de trail.",
  },
  {
    id: "equilibre-unipodal",
    nom: "Équilibre unipodal",
    groupe: "gainage",
    materiel: "Aucun",
    disponible: true,
    charge: "corps",
    pas: null,
    unite: "secondes",
    nomsHevy: [],
  },
];

// MATÉRIEL ABSENT DE LA SALLE — confirmé le 09/09/2026.
// Ne jamais proposer d'exercice qui en dépend :
//   machine à pectoraux (développé assis, pec deck) · leg extension ·
//   machine à mollets · banc pupitre · machine à tractions assistées ·
//   machine à dips assistée.
//
// Présent mais géré côté course, volontairement hors catalogue muscu :
//   vélo · rameur · tapis de course.
//
// EXERCICE INTERDIT indépendamment du matériel :
//   Nordic curl — jamais pratiqué, 4 à 6 jours de courbatures profondes.
//   Interdiction datée, voir config/calendrier.js.

export const parId = Object.fromEntries(CATALOGUE.map((e) => [e.id, e]));
