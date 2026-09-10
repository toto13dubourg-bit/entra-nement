// ÉCRAN D'IMPORT — un CSV COROS ou un texte Hevy, plus ce que ces fichiers
// ne contiennent pas et qu'il faut saisir.

import { html, message, compteur, brancherCompteurs, duree } from "./base.js";
import { parserCoros, champsASaisir, detecterStructure } from "../parseurs/coros.js";
import { parserHevy, chargesImpossibles } from "../parseurs/hevy.js";
import { ALIMENTS } from "../config/physiologie.js";
import { TYPES_QUALITE, TYPES_SANS_DELAI } from "../config/calendrier.js";
import { CATALOGUE } from "../config/catalogue-exercices.js";
import { SEANCES } from "../config/programme.js";
import { appliquerSeanceSalle } from "../moteur/application.js";

// Séance en attente de confirmation. Rien n'est enregistré avant validation.
let brouillon = null;
let retour = null;

export function reinitialiserImport() {
  brouillon = null;
  retour = null;
}

export function rendreImport() {
  if (brouillon?.genre === "coros") return formulaireCoros();
  if (brouillon?.genre === "hevy") return formulaireHevy();

  return `
    ${retour ? message(retour.type, retour.texte, retour.details) : ""}
    <div class="carte">
      <h2>Sortie course</h2>
      <p class="aide">Exporte le CSV depuis l'application COROS, puis choisis-le ici.</p>
      <input type="file" id="fichier-coros" accept=".csv,text/csv">
    </div>
    <div class="carte">
      <h2>Séance de salle</h2>
      <p class="aide">Dans Hevy : partager la séance, copier le texte, le coller ici.</p>
      <textarea id="texte-hevy" placeholder="Entraînement d'après-midi 💪&#10;Le mardi, sept. 08, 2026 à 4:44pm&#10;..."></textarea>
      <button class="bouton" id="lire-hevy" style="margin-top:10px">Lire la séance</button>
    </div>`;
}

// ------------------------------------------------------------------ COROS

function formulaireCoros() {
  const s = brouillon.seance;
  const saisie = brouillon.saisie;
  const r = s.resume;
  const types = [...TYPES_QUALITE, ...TYPES_SANS_DELAI];

  return `
    <div class="carte">
      <h2>${html(s.date.slice(8, 10))}/${html(s.date.slice(5, 7))} — ${r.distanceKm} km</h2>
      <p class="aide">${duree(r.tempsS)} à ${duree(r.allureS)}/km · FC ${r.fcMoy}/${r.fcMax}</p>
      <label>Structure détectée
        <select id="structure">
          <option value="kilometres"${s.structure === "kilometres" ? " selected" : ""}>
            Splits au kilomètre (${s.splits.length} tours)
          </option>
          <option value="etapes"${s.structure === "etapes" ? " selected" : ""}>
            Étapes de séance programmée (${s.splits.length} étapes)
          </option>
        </select>
      </label>
    </div>

    <div class="carte">
      <h2>Ce que le fichier ne dit pas</h2>
      <label>Type de séance
        <select id="type">
          <option value="">— à choisir —</option>
          ${types.map((t) => `<option value="${t}"${saisie.type === t ? " selected" : ""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Titre
        <input type="text" id="titre" value="${html(saisie.titre || "")}" placeholder="EF 40' + lignes">
      </label>
      <label>Température réelle en °C <span class="obligatoire">— obligatoire</span>
        <input type="number" id="temperature" inputmode="decimal" step="1"
               value="${saisie.temperatureC ?? ""}" placeholder="Le capteur COROS surestime de 5 à 10 °C">
      </label>
      <label>Ressenti
        ${compteur("ressenti", saisie.ressenti)}
      </label>
      <label>Douleurs ou gênes
        <input type="text" id="douleurs" value="${html(saisie.douleurs || "")}" placeholder="rien à signaler">
      </label>
      <label>Note
        <textarea id="note">${html(saisie.note || "")}</textarea>
      </label>
    </div>

    <div class="carte">
      <h2>Nutrition prise</h2>
      <p class="aide">Ce qui a réellement été consommé pendant la sortie.</p>
      ${Object.keys(ALIMENTS).map((aliment) => `
        <label>${html(aliment.replace(/-/g, " "))} (${ALIMENTS[aliment]} g)
          <input type="number" inputmode="numeric" min="0" step="1" data-aliment="${aliment}"
                 value="${quantiteDe(saisie, aliment)}">
        </label>`).join("")}
    </div>

    <div class="boutons">
      <button class="bouton" id="valider">Enregistrer la sortie</button>
      <button class="bouton secondaire" id="annuler">Annuler</button>
    </div>`;
}

function quantiteDe(saisie, aliment) {
  const trouve = (saisie.glucides || []).find((g) => g.aliment === aliment);
  return trouve ? trouve.quantite : 0;
}

// ------------------------------------------------------------------- HEVY

function formulaireHevy() {
  const s = brouillon.seance;
  const anomalies = brouillon.anomalies;
  const seances = Object.keys(SEANCES);

  return `
    <div class="carte">
      <h2>${html(s.date.slice(8, 10))}/${html(s.date.slice(5, 7))} — ${s.exercices.length} exercices</h2>
      <p class="aide">${html(s.titre)}</p>
      <label>À quelle séance ça correspond
        <select id="seance">
          ${seances.map((id) =>
            `<option value="${id}"${brouillon.seanceId === id ? " selected" : ""}>${html(SEANCES[id].nom)}</option>`
          ).join("")}
        </select>
      </label>
    </div>

    ${s.lignesNonReconnues.length
      ? message("attention", "Lignes non comprises, donc non enregistrées :",
          s.lignesNonReconnues.map((l) => l.ligne))
      : ""}

    ${anomalies.length
      ? message("attention", "Charges impossibles sur ton matériel :",
          anomalies.map((a) => `${a.exercice} : ${a.raison}`))
      : ""}

    <div class="carte">
      <h2>Exercices lus</h2>
      ${s.exercices.map((e, index) => `
        <div class="exercice">
          <span>${html(e.nomBrut)}
            <span class="prescription">${html(resumeSeries(e))}</span>
          </span>
        </div>
        ${e.exerciceId ? "" : `
          <label>Associer « ${html(e.nomBrut)} » à
            <select data-associer="${index}">
              <option value="">— à choisir —</option>
              ${CATALOGUE.filter((x) => x.disponible).map((x) =>
                `<option value="${x.id}">${html(x.nom)}</option>`).join("")}
            </select>
          </label>`}
      `).join("")}
    </div>

    <div class="carte">
      <h2>Ton ressenti</h2>
      <label>RIR réel — répétitions gardées en réserve
        ${compteur("rir", brouillon.saisie.rir, 0, 5)}
      </label>
      <label>Douleurs ou gênes
        <input type="text" id="douleurs" value="${html(brouillon.saisie.douleurs || "")}" placeholder="rien à signaler">
      </label>
      <label>Note
        <textarea id="note">${html(brouillon.saisie.note || "")}</textarea>
      </label>
    </div>

    <div class="boutons">
      <button class="bouton" id="valider">Enregistrer la séance</button>
      <button class="bouton secondaire" id="annuler">Annuler</button>
    </div>`;
}

function resumeSeries(exercice) {
  return exercice.series
    .map((s) => {
      const mesure = typeof s.reps === "number" ? `${s.reps} reps` : duree(s.dureeS);
      const charge = typeof s.chargeKg === "number" ? `${s.chargeKg} kg × ` : "";
      return (s.echauffement ? "éch. " : "") + charge + mesure;
    })
    .join(" · ");
}

// ------------------------------------------------------------- Branchement

export function brancherImport(racine, contexte, rafraichir) {
  const fichier = racine.querySelector("#fichier-coros");
  if (fichier) {
    fichier.addEventListener("change", async () => {
      const f = fichier.files[0];
      if (!f) return;
      try {
        const seance = parserCoros(await f.text(), f.name);
        if (!seance.date) throw new Error("Aucune date dans le nom du fichier. Ne le renomme pas.");
        brouillon = { genre: "coros", seance, saisie: champsASaisir() };
        retour = null;
      } catch (e) {
        retour = { type: "erreur", texte: e.message };
      }
      rafraichir();
    });
  }

  const lireHevy = racine.querySelector("#lire-hevy");
  if (lireHevy) {
    lireHevy.addEventListener("click", () => {
      const texte = racine.querySelector("#texte-hevy").value;
      try {
        const seance = parserHevy(texte);
        brouillon = {
          genre: "hevy",
          seance,
          seanceId: Object.keys(SEANCES)[0],
          saisie: { rir: null, douleurs: "", note: "" },
          anomalies: chargesImpossibles(seance),
        };
        retour = null;
      } catch (e) {
        retour = { type: "erreur", texte: e.message };
      }
      rafraichir();
    });
  }

  if (!brouillon) return;

  brancherCompteurs(racine, (nom, valeur) => {
    brouillon.saisie[nom] = valeur;
  });

  racine.querySelector("#annuler")?.addEventListener("click", () => {
    reinitialiserImport();
    rafraichir();
  });

  racine.querySelectorAll("[data-associer]").forEach((select) => {
    select.addEventListener("change", () => {
      brouillon.seance.exercices[Number(select.dataset.associer)].exerciceId = select.value || null;
    });
  });

  racine.querySelector("#seance")?.addEventListener("change", (e) => {
    brouillon.seanceId = e.target.value;
  });

  racine.querySelector("#structure")?.addEventListener("change", (e) => {
    brouillon.seance.structure = e.target.value;
    brouillon.seance.structureDetecteeAutomatiquement = false;
  });

  racine.querySelector("#valider")?.addEventListener("click", () => {
    if (brouillon.genre === "coros") validerCoros(racine, contexte, rafraichir);
    else validerHevy(racine, contexte, rafraichir);
  });
}

function validerCoros(racine, contexte, rafraichir) {
  const temperature = racine.querySelector("#temperature").value;
  const type = racine.querySelector("#type").value;

  if (temperature === "") {
    retour = {
      type: "erreur",
      texte:
        "La température réelle est obligatoire : le capteur de la COROS est au poignet " +
        "et surestime de 5 à 10 °C.",
    };
    rafraichir();
    return;
  }
  if (!type) {
    retour = { type: "erreur", texte: "Choisis le type de séance : il détermine les règles de délai." };
    rafraichir();
    return;
  }

  const glucides = [];
  racine.querySelectorAll("[data-aliment]").forEach((champ) => {
    const quantite = Number(champ.value);
    if (quantite > 0) glucides.push({ aliment: champ.dataset.aliment, quantite });
  });

  const seance = {
    ...brouillon.seance,
    id: `course-${brouillon.seance.date}`,
    source: { type: "coros", fichier: brouillon.seance.fichier },
    saisie: {
      ...brouillon.saisie,
      type,
      titre: racine.querySelector("#titre").value,
      temperatureC: Number(temperature),
      douleurs: racine.querySelector("#douleurs").value,
      note: racine.querySelector("#note").value,
      glucides,
    },
  };

  const sansCelleCi = contexte.etat.seancesCourse.filter((s) => s.id !== seance.id);
  contexte.enregistrer({
    ...contexte.etat,
    seancesCourse: [...sansCelleCi, seance].sort((a, b) => a.date.localeCompare(b.date)),
  });

  reinitialiserImport();
  retour = { type: "succes", texte: `Sortie du ${seance.date.slice(8, 10)}/${seance.date.slice(5, 7)} enregistrée.` };
  rafraichir();
}

function validerHevy(racine, contexte, rafraichir) {
  const nonAssocies = brouillon.seance.exercices.filter((e) => !e.exerciceId);
  if (nonAssocies.length) {
    retour = {
      type: "erreur",
      texte: "Associe chaque exercice avant d'enregistrer :",
      details: nonAssocies.map((e) => e.nomBrut),
    };
    rafraichir();
    return;
  }

  const seance = {
    id: `salle-${brouillon.seance.date}`,
    date: brouillon.seance.date,
    source: brouillon.seance.source,
    seance: brouillon.seanceId,
    exercices: brouillon.seance.exercices,
    saisie: {
      rir: brouillon.saisie.rir,
      douleurs: racine.querySelector("#douleurs").value,
      note: racine.querySelector("#note").value,
    },
  };

  // Les associations faites une fois valent pour les prochains imports.
  const associations = { ...contexte.etat.associationsHevy };
  for (const e of seance.exercices) associations[e.nomBrut] = e.exerciceId;

  const sansCelleCi = contexte.etat.seancesSalle.filter((s) => s.id !== seance.id);
  const avecSeance = {
    ...contexte.etat,
    associationsHevy: associations,
    seancesSalle: [...sansCelleCi, seance].sort((a, b) => a.date.localeCompare(b.date)),
  };

  const { etat, decisions } = appliquerSeanceSalle(avecSeance, seance);
  contexte.enregistrer(etat);

  reinitialiserImport();
  retour = {
    type: "succes",
    texte: "Séance enregistrée. Pour la prochaine fois :",
    details: decisions.map((d) => `${d.nom || d.nomBrut} — ${d.raison}`),
  };
  rafraichir();
}
