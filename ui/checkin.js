// ÉCRAN CHECK-IN — le rituel du dimanche soir.

import { html, message, compteur, brancherCompteurs, aujourdhui, jourCourt } from "./base.js";
import { QUOTIDIEN } from "../config/physiologie.js";

let retour = null;
let note = { etatJambes: null };

export function rendreCheckin(contexte) {
  const { etat } = contexte;
  const dernier = etat.checkins[etat.checkins.length - 1];
  const dejaFait = dernier && dernier.date === aujourdhui();

  return `
    ${retour ? message(retour.type, retour.texte) : ""}
    ${dejaFait ? message("succes", `Check-in du ${jourCourt(dernier.date)} déjà enregistré. Le renvoyer l'écrasera.`) : ""}

    <div class="carte">
      <h2>Check-in</h2>
      <p class="aide">Pesée du matin, à jeun. Cible protéines : ${QUOTIDIEN.proteinesG.join(" à ")} g par jour.</p>
      <label>Date
        <input type="date" id="date" value="${aujourdhui()}">
      </label>
      <label>Poids du matin, en kg
        <input type="number" id="poids" inputmode="decimal" step="0.1"
               value="${dernier?.poidsKg ?? ""}">
      </label>
      <label>Sommeil moyen, en heures
        <input type="number" id="sommeil" inputmode="decimal" step="0.5" value="${dernier?.sommeilH ?? ""}">
      </label>
      <label>Alcool — nombre de verres dans la semaine
        <input type="number" id="alcool" inputmode="numeric" step="1" min="0" value="${dernier?.alcool ?? 0}">
      </label>
      <label>Protéines, moyenne en g par jour
        <input type="number" id="proteines" inputmode="numeric" step="5" value="${dernier?.proteinesG ?? ""}">
      </label>
      <label>État des jambes
        ${compteur("etatJambes", note.etatJambes)}
      </label>
      <label>Douleurs
        <input type="text" id="douleurs" placeholder="rien à signaler">
      </label>
      <label>Note libre
        <textarea id="note"></textarea>
      </label>
      <button class="bouton" id="valider">Enregistrer le check-in</button>
    </div>

    ${historique(etat)}`;
}

function historique(etat) {
  const derniers = etat.checkins.slice(-6).reverse();
  if (!derniers.length) return "";

  return `<div class="carte">
    <h2>Historique</h2>
    <table class="donnees">
      <tr><th>Date</th><th>Poids</th><th>Sommeil</th><th>Jambes</th></tr>
      ${derniers.map((c, i) => {
        const precedent = derniers[i + 1];
        const ecart = precedent && typeof c.poidsKg === "number" && typeof precedent.poidsKg === "number"
          ? ` (${c.poidsKg - precedent.poidsKg >= 0 ? "+" : ""}${Math.round((c.poidsKg - precedent.poidsKg) * 10) / 10})`
          : "";
        return `<tr>
          <td>${jourCourt(c.date)}</td>
          <td>${c.poidsKg ?? "—"}${html(ecart)}</td>
          <td>${c.sommeilH ?? "—"} h</td>
          <td>${c.etatJambes ?? "—"}/5</td>
        </tr>`;
      }).join("")}
    </table>
  </div>`;
}

export function brancherCheckin(racine, contexte, rafraichir) {
  brancherCompteurs(racine, (nom, valeur) => {
    note[nom] = valeur;
  });

  racine.querySelector("#valider")?.addEventListener("click", () => {
    const poids = racine.querySelector("#poids").value;
    if (poids === "") {
      retour = { type: "erreur", texte: "Le poids du matin est le repère principal : il est demandé." };
      rafraichir();
      return;
    }

    const date = racine.querySelector("#date").value;
    const checkin = {
      date,
      poidsKg: Number(poids),
      sommeilH: valeurOuNull(racine.querySelector("#sommeil").value),
      alcool: valeurOuNull(racine.querySelector("#alcool").value),
      proteinesG: valeurOuNull(racine.querySelector("#proteines").value),
      etatJambes: note.etatJambes,
      douleurs: racine.querySelector("#douleurs").value,
      note: racine.querySelector("#note").value,
    };

    const autres = contexte.etat.checkins.filter((c) => c.date !== date);
    contexte.enregistrer({
      ...contexte.etat,
      checkins: [...autres, checkin].sort((a, b) => a.date.localeCompare(b.date)),
    });

    note = { etatJambes: null };
    retour = { type: "succes", texte: "Check-in enregistré." };
    rafraichir();
  });
}

function valeurOuNull(v) {
  return v === "" ? null : Number(v);
}
