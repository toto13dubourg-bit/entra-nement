// STOCKAGE LOCAL ET SAUVEGARDE.
//
// Les données vivent dans le navigateur de l'iPhone, et nulle part ailleurs.
// C'est ce qui rend la sauvegarde manuelle non négociable : si le téléphone
// est perdu ou l'application désinstallée, seul le fichier JSON reste.

import { etatVide, exporterJson, importerJson } from "../modele/donnees.js";
import { SEANCES_SALLE_INITIALES } from "../config/donnees-initiales.js";

export const CLE = "entrainement:etat";
export const RAPPEL_SAUVEGARDE_JOURS = 30;

// Le dépôt prend son stockage en paramètre : localStorage en vrai, un objet
// simple dans les tests. Aucune dépendance cachée au navigateur.
export function creerDepot(stockage) {
  function charger() {
    let brut;
    try {
      brut = stockage.getItem(CLE);
    } catch (e) {
      throw new Error(
        "Le stockage du navigateur est inaccessible. Navigation privée ? " +
          "L'application a besoin d'écrire pour fonctionner."
      );
    }

    if (!brut) return premierLancement();

    try {
      return importerJson(brut);
    } catch (e) {
      throw new Error(
        `Les données enregistrées sont illisibles : ${e.message} ` +
          `Restaure ta dernière sauvegarde JSON.`
      );
    }
  }

  function enregistrer(etat) {
    try {
      stockage.setItem(CLE, exporterJson(etat));
    } catch (e) {
      throw new Error(
        "Impossible d'enregistrer : le stockage est plein ou bloqué. " +
          "Fais une sauvegarde JSON avant toute chose."
      );
    }
    return etat;
  }

  // Au tout premier lancement, on injecte les séances que Thomas a saisies à
  // la main, pour que le moteur de progression ait un point de départ réel.
  function premierLancement() {
    const etat = etatVide();
    etat.seancesSalle = JSON.parse(JSON.stringify(SEANCES_SALLE_INITIALES));
    enregistrer(etat);
    return etat;
  }

  function remplacer(texteJson) {
    const etat = importerJson(texteJson);
    enregistrer(etat);
    return etat;
  }

  function vider() {
    stockage.removeItem(CLE);
  }

  return { charger, enregistrer, remplacer, vider };
}

// ------------------------------------------------------------- SAUVEGARDE

export function marquerSauvegarde(etat, maintenant) {
  return { ...etat, meta: { ...etat.meta, derniereSauvegarde: maintenant } };
}

// L'application réclame une sauvegarde au bout de 30 jours. Tant qu'aucune
// sauvegarde n'a jamais été faite, le délai court depuis la création.
export function etatSauvegarde(etat, maintenant) {
  const reference = etat.meta.derniereSauvegarde || etat.meta.creeLe;
  const jours = Math.floor((Date.parse(maintenant) - Date.parse(reference)) / 86400000);
  const jamais = !etat.meta.derniereSauvegarde;

  return {
    jours,
    jamais,
    necessaire: jours >= RAPPEL_SAUVEGARDE_JOURS,
    message: jamais
      ? `Aucune sauvegarde depuis l'installation, il y a ${jours} jour(s).`
      : `Dernière sauvegarde il y a ${jours} jour(s).`,
  };
}

export function nomFichierSauvegarde(maintenant) {
  const d = new Date(maintenant);
  const d2 = (n) => String(n).padStart(2, "0");
  return `entrainement-${d.getFullYear()}-${d2(d.getMonth() + 1)}-${d2(d.getDate())}.json`;
}

// Déclenche le téléchargement du fichier de sauvegarde. Seule fonction du
// module qui touche au navigateur.
export function telechargerSauvegarde(etat, maintenant = new Date().toISOString()) {
  const marque = marquerSauvegarde(etat, maintenant);
  const blob = new Blob([exporterJson(marque)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichierSauvegarde(maintenant);
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
  return marque;
}
