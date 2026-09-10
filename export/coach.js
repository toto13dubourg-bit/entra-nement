// L'EXPORT COACH — le livrable central.
//
// Texte brut, lisible tel quel, à coller dans une conversation avec Claude.
// Il ne contient AUCUN conseil : il rapporte des faits, des écarts constatés
// et les questions que l'application n'a pas su trancher. Le jugement se fait
// dans la conversation, pas ici.

import {
  phaseDu,
  prochaineCourse,
  verifierDelai,
  cranConnu,
  salleAutorisee,
} from "../moteur/phases.js";
import { SEANCES_COURSE_PREVUES, TYPES_QUALITE } from "../config/calendrier.js";
import { SEANCES, SEMAINE_TYPE } from "../config/programme.js";
import { parId } from "../config/catalogue-exercices.js";
import { GLUCIDES, ALIMENTS, ZONES, CORRECTION_CHALEUR } from "../config/physiologie.js";
import {
  tempsArretS,
  efficienceAerobie,
  deriveCardiaque,
  blocsComparables,
  pointsAberrants,
} from "../parseurs/coros.js";
import { chargeDeTravail } from "../moteur/progression.js";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export function duree(secondes) {
  if (secondes === null || secondes === undefined) return "—";
  const s = Math.round(secondes);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const d2 = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${d2(m)}:${d2(r)}` : `${m}:${d2(r)}`;
}

export function jourFr(iso) {
  const d = new Date(iso.slice(0, 10) + "T12:00:00Z");
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// La semaine du lundi au dimanche contenant la date donnée.
export function semaineDe(date) {
  const d = new Date(date.slice(0, 10) + "T12:00:00Z");
  const decalage = (d.getUTCDay() + 6) % 7; // lundi = 0
  const lundi = new Date(d.getTime() - decalage * 86400000);
  const jours = [];
  for (let i = 0; i < 7; i++) {
    jours.push(new Date(lundi.getTime() + i * 86400000).toISOString().slice(0, 10));
  }
  return jours;
}

function glucidesCible(dureeSecondes) {
  const minutes = dureeSecondes / 60;
  for (const c of GLUCIDES.cibles) {
    if (c.dureeMaxMinutes === null || minutes <= c.dureeMaxMinutes) return c.gParHeure;
  }
  return 0;
}

function glucidesPris(saisie) {
  if (!saisie || !Array.isArray(saisie.glucides)) return null;
  return saisie.glucides.reduce((t, g) => t + (ALIMENTS[g.aliment] || 0) * (g.quantite || 0), 0);
}

function zoneDe(fc) {
  const z = ZONES.find((z) => (z.fc[0] === null || fc >= z.fc[0]) && (z.fc[1] === null || fc <= z.fc[1]));
  return z ? z.nom : "hors zone";
}

// --------------------------------------------------------------- ANOMALIES

// Les règles écrites noir sur blanc, et rien d'autre.
export function anomalies(etat, jours) {
  const trouvees = [];

  for (const c of etat.seancesCourse.filter((s) => jours.includes(s.date.slice(0, 10)))) {
    const r = c.resume;
    const saisie = c.saisie || {};

    // Sortie longue partie trop vite : FC au-dessus de 145 avant le km 10.
    if (r.distanceKm > 20 && c.structure === "kilometres") {
      const early = c.splits.slice(0, 10).filter((s) => s.fcMoy !== null && s.fcMoy > 145);
      if (early.length) {
        trouvees.push(
          `Sortie longue du ${jourFr(c.date)} : FC au-dessus de 145 dès le km ` +
            `${early[0].libelle} (${early[0].fcMoy} bpm). Sur ${r.distanceKm} km, ` +
            `c'est parti trop vite.`
        );
      }
    }

    // Réalisé contre prescrit.
    const prevue = SEANCES_COURSE_PREVUES.find((p) => p.date === c.date.slice(0, 10));
    if (prevue && saisie.type && prevue.type !== saisie.type) {
      trouvees.push(
        `${jourFr(c.date)} : « ${prevue.detail} » était prévu, une séance de type ` +
          `« ${saisie.type} » a été faite (${r.distanceKm} km à ${duree(r.allureS)}/km).`
      );
    }

    // Glucides pris contre cible.
    const pris = glucidesPris(saisie);
    if (pris !== null && r.tempsS > 5400) {
      const heures = r.tempsS / 3600;
      const parHeure = pris / heures;
      const cible = glucidesCible(r.tempsS);
      if (cible && parHeure < cible * 0.8) {
        trouvees.push(
          `${jourFr(c.date)} : ${Math.round(parHeure)} g/h de glucides pris pour ` +
            `${cible} g/h visés sur ${duree(r.tempsS)}.`
        );
      }
    }

    // Chaleur : les cibles de FC se décalent.
    if (typeof saisie.temperatureC === "number" && saisie.temperatureC >= CORRECTION_CHALEUR.seuilCelsius) {
      trouvees.push(
        `${jourFr(c.date)} : ${saisie.temperatureC} °C réels. Au-dessus de ` +
          `${CORRECTION_CHALEUR.seuilCelsius} °C, ajouter ${CORRECTION_CHALEUR.bpmAjoutes.join(" à ")} bpm ` +
          `aux cibles : la dérive est thermique, pas un excès d'intensité.`
      );
    }
  }

  // Séries en pyramide alors que la méthode retenue est la série droite.
  // C'est un constat, pas une question : l'arbitrage a été rendu le 10/09.
  const pyramides = [];
  for (const s of etat.seancesSalle.filter((x) => jours.includes(x.date.slice(0, 10)))) {
    for (const e of s.exercices) {
      const charges = [...new Set(e.series.filter((x) => !x.echauffement).map((x) => x.chargeKg))];
      if (charges.length > 1 && charges.every((c) => typeof c === "number")) {
        const nom = e.exerciceId ? parId[e.exerciceId]?.nom || e.nomBrut : e.nomBrut;
        pyramides.push(`${nom} (${charges.join(", ")} kg)`);
      }
    }
  }
  if (pyramides.length) {
    trouvees.push(
      `${pyramides.length} exercice(s) faits en pyramide alors que la méthode retenue est ` +
        `la série droite : ${pyramides.join(" · ")}.`
    );
  }

  // Une séance faite alors que la phase l'interdisait.
  for (const s of etat.seancesSalle.filter((x) => jours.includes(x.date.slice(0, 10)))) {
    const verdict = salleAutorisee(s.date, s.seance);
    if (!verdict.autorise) {
      trouvees.push(`Séance ${s.seance} faite le ${jourFr(s.date)} : ${verdict.raison}`);
    }
  }

  // Conflit de 48 h entre jambes et qualité.
  const jambes = etat.seancesSalle.filter(
    (s) => jours.includes(s.date.slice(0, 10)) && String(s.seance).startsWith("C")
  );
  const qualites = etat.seancesCourse.filter(
    (s) => jours.includes(s.date.slice(0, 10)) && TYPES_QUALITE.includes((s.saisie || {}).type)
  );
  for (const j of jambes) {
    for (const q of qualites) {
      const conflit = verifierDelai(j.date, q.date, q.saisie.type);
      if (conflit.conflit) trouvees.push(conflit.raison);
    }
  }

  return trouvees;
}

// ------------------------------------------------------------ LES SECTIONS

function sectionCourse(c) {
  const r = c.resume;
  const saisie = c.saisie || {};
  const lignes = [];

  const titre = saisie.titre || saisie.type || "Séance";
  lignes.push(`  ${jourFr(c.date)} — ${titre}`);
  lignes.push(
    `    ${r.distanceKm} km en ${duree(r.tempsS)} à ${duree(r.allureS)}/km · ` +
      `FC ${r.fcMoy}/${r.fcMax} (${zoneDe(r.fcMoy)})`
  );

  const arret = tempsArretS(c);
  const eff = efficienceAerobie(c);
  lignes.push(
    `    Arrêts ${duree(arret)} · efficience ${eff ? eff.toFixed(2) : "—"} m/battement · ` +
      `${typeof saisie.temperatureC === "number" ? saisie.temperatureC + " °C réels" : "température non saisie"}`
  );

  const derive = deriveCardiaque(c);
  if (derive && derive.deltaBpm !== null) {
    lignes.push(
      `    Dérive ${derive.deltaBpm > 0 ? "+" : ""}${Math.round(derive.deltaBpm)} bpm : ` +
        `${derive.premiere.distanceKm} km à ${duree(derive.premiere.allureS)} pour FC ` +
        `${Math.round(derive.premiere.fcMoy)}, puis ${derive.seconde.distanceKm} km à ` +
        `${duree(derive.seconde.allureS)} pour FC ${Math.round(derive.seconde.fcMoy)}`
    );
  }

  for (const g of blocsComparables(c)) {
    lignes.push(
      `    Blocs de ${duree(g.dureeS)} : FC ${g.blocs.map((b) => b.fcMoy).join(" puis ")}`
    );
  }

  const pris = glucidesPris(saisie);
  if (pris !== null && r.tempsS > 3600) {
    const parHeure = Math.round(pris / (r.tempsS / 3600));
    lignes.push(`    Glucides ${parHeure} g/h pour ${glucidesCible(r.tempsS)} g/h visés`);
  }

  if (saisie.ressenti) lignes.push(`    Ressenti ${saisie.ressenti}/5`);
  if (saisie.douleurs) lignes.push(`    Douleurs : ${saisie.douleurs}`);
  if (saisie.note) lignes.push(`    Note : ${saisie.note}`);

  return lignes;
}

function sectionSalle(s, precedentes) {
  const lignes = [`  ${jourFr(s.date)} — Séance ${SEANCES[s.seance]?.nom || s.seance}`];

  for (const ex of s.exercices) {
    const nom = ex.exerciceId ? parId[ex.exerciceId]?.nom || ex.nomBrut : ex.nomBrut;
    const charge = chargeDeTravail(ex.series);
    const reps = ex.series
      .filter((x) => !x.echauffement)
      .map((x) => (typeof x.reps === "number" ? x.reps : duree(x.dureeS)))
      .join("-");

    let comparaison = "";
    const avant = precedentes
      .filter((p) => p.date < s.date)
      .flatMap((p) => p.exercices)
      .filter((e) => e.exerciceId && e.exerciceId === ex.exerciceId);
    if (avant.length) {
      const chargeAvant = chargeDeTravail(avant[avant.length - 1].series);
      if (chargeAvant !== null && charge !== null) {
        const ecart = charge - chargeAvant;
        comparaison =
          ecart === 0
            ? " (identique)"
            : ` (${ecart > 0 ? "+" : ""}${Math.round(ecart * 10) / 10} kg)`;
      }
    }

    lignes.push(
      `    ${nom} : ${charge !== null ? charge + " kg" : "poids du corps"}${comparaison} · ${reps}`
    );
  }

  const saisie = s.saisie || {};
  if (saisie.rir !== null && saisie.rir !== undefined) lignes.push(`    RIR déclaré : ${saisie.rir}`);
  if (saisie.douleurs) lignes.push(`    Douleurs : ${saisie.douleurs}`);
  if (saisie.note) lignes.push(`    Note : ${saisie.note}`);

  return lignes;
}

// ------------------------------------------------------------ L'EXPORT

export function exportCoach(etat, aujourdhui) {
  const jours = semaineDe(aujourdhui);
  const phase = phaseDu(aujourdhui);
  const suivante = prochaineCourse(aujourdhui);
  const L = [];

  // 1. Où on en est.
  L.push(`ENTRAÎNEMENT — semaine du ${jourFr(jours[0])} au ${jourFr(jours[6])}`);
  L.push(`Aujourd'hui : ${jourFr(aujourdhui)}`);
  L.push(`Phase : ${phase ? phase.nom : "non définie"}`);
  if (suivante) {
    L.push(
      `Prochaine course : ${suivante.course.nom}, le ${jourFr(suivante.course.date)} ` +
        `dans ${suivante.joursRestants} jours — objectif ${suivante.course.objectif || "non fixé"}`
    );
  }
  L.push("");

  // 2. Les séances de la semaine.
  L.push("SEMAINE");
  const coursesFaites = etat.seancesCourse.filter((s) => jours.includes(s.date.slice(0, 10)));
  const sallesFaites = etat.seancesSalle.filter((s) => jours.includes(s.date.slice(0, 10)));

  // Une séance de salle déplacée dans la semaine reste une séance faite :
  // on compare les types réalisés sur la semaine, pas jour par jour.
  const typesFaits = new Set(sallesFaites.map((s) => String(s.seance)[0]));

  for (let i = 0; i < 7; i++) {
    const j = jours[i];
    const passe = j < aujourdhui.slice(0, 10);
    const prevueCourse = SEANCES_COURSE_PREVUES.find((p) => p.date === j);
    const prevueSalle = SEMAINE_TYPE[JOURS[i]]?.salle;
    const faiteCourse = coursesFaites.find((s) => s.date.slice(0, 10) === j);
    const faiteSalle = sallesFaites.find((s) => s.date.slice(0, 10) === j);

    const items = [];
    if (faiteCourse) {
      items.push(`course FAITE (${faiteCourse.resume.distanceKm} km)`);
    } else if (prevueCourse) {
      items.push(`course PRÉVUE : ${prevueCourse.titre}${passe ? " — SAUTÉE" : ""}`);
    }

    if (prevueSalle && faiteSalle && String(faiteSalle.seance)[0] !== prevueSalle[0]) {
      items.push(`salle ${prevueSalle} prévue, ${faiteSalle.seance} FAITE à la place`);
    } else if (faiteSalle) {
      items.push(`salle ${faiteSalle.seance} FAITE`);
    } else if (prevueSalle && !typesFaits.has(prevueSalle[0])) {
      items.push(`salle ${prevueSalle} PRÉVUE${passe ? " — SAUTÉE" : ""}`);
    } else if (prevueSalle) {
      items.push(`salle ${prevueSalle} faite un autre jour`);
    }

    if (items.length) L.push(`  ${JOURS[i]} ${jourFr(j)} : ${items.join(" · ")}`);
  }
  L.push("");

  // 3. Le détail des séances de course.
  if (coursesFaites.length) {
    L.push("COURSE");
    for (const c of coursesFaites) L.push(...sectionCourse(c));
    L.push("");
  }

  // 4. Le détail des séances de salle.
  if (sallesFaites.length) {
    L.push("SALLE");
    for (const s of sallesFaites) L.push(...sectionSalle(s, etat.seancesSalle));
    L.push("");
  }

  // 5. Le check-in.
  const checkin = etat.checkins.filter((c) => jours.includes(c.date)).slice(-1)[0];
  if (checkin) {
    const precedent = etat.checkins.filter((c) => c.date < checkin.date).slice(-1)[0];
    const variation =
      precedent && typeof precedent.poidsKg === "number" && typeof checkin.poidsKg === "number"
        ? ` (${checkin.poidsKg - precedent.poidsKg >= 0 ? "+" : ""}${
            Math.round((checkin.poidsKg - precedent.poidsKg) * 10) / 10
          } kg)`
        : "";
    L.push("CHECK-IN");
    L.push(`  Poids ${checkin.poidsKg} kg${variation} · sommeil ${checkin.sommeilH ?? "—"} h · ` +
      `alcool ${checkin.alcool ?? "—"} · protéines ${checkin.proteinesG ?? "—"} g/j`);
    L.push(`  Jambes ${checkin.etatJambes ?? "—"}/5${checkin.douleurs ? ` · douleurs : ${checkin.douleurs}` : ""}`);
    if (checkin.note) L.push(`  Note : ${checkin.note}`);
    L.push("");
  }

  // 6. Les anomalies détectées par les règles.
  const trouvees = anomalies(etat, jours);
  if (trouvees.length) {
    L.push("ANOMALIES");
    for (const a of trouvees) L.push(`  - ${a}`);
    L.push("");
  }

  // 7. Ce que l'application n'a pas su trancher.
  const questions = questionsOuvertes(etat, jours);
  if (questions.length) {
    L.push("QUESTIONS OUVERTES");
    for (const q of questions) L.push(`  - ${q}`);
    L.push("");
  }

  return L.join("\n").trimEnd();
}

export function questionsOuvertes(etat, jours) {
  const q = [];

  // Noms Hevy jamais associés.
  const inconnus = new Set();
  for (const s of etat.seancesSalle) {
    for (const e of s.exercices) if (!e.exerciceId) inconnus.add(e.nomBrut);
  }
  for (const nom of inconnus) {
    q.push(`Exercice « ${nom} » jamais associé au catalogue : à quel exercice correspond-il ?`);
  }

  // Machines utilisées dont le cran de progression n'est pas encore relevé :
  // aucune charge ne peut être proposée dessus.
  const sansCran = new Set();
  for (const s of etat.seancesSalle.filter((x) => jours.includes(x.date.slice(0, 10)))) {
    for (const e of s.exercices) {
      const fiche = e.exerciceId ? parId[e.exerciceId] : null;
      if (!fiche) continue;
      if (!e.series.some((x) => typeof x.chargeKg === "number")) continue;
      if (!cranConnu(fiche.id)) sansCran.add(fiche.nom);
    }
  }
  for (const nom of sansCran) {
    q.push(`${nom} : cran de la machine non relevé, aucune progression ne peut être proposée.`);
  }

  // Températures manquantes sur la semaine.
  for (const c of etat.seancesCourse.filter((s) => jours.includes(s.date.slice(0, 10)))) {
    if (typeof (c.saisie || {}).temperatureC !== "number") {
      q.push(`Température réelle non saisie pour la sortie du ${jourFr(c.date)}.`);
    }
  }

  return q;
}
