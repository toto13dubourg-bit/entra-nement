// Dessine un schéma d'exercice en SVG, à partir des positions décrites dans
// config/schemas.js. Aucun fichier image, donc rien à télécharger : les
// schémas fonctionnent hors ligne comme le reste.

import { schemaDe } from "../config/schemas.js";

function objet(o) {
  if (o.type === "rect") {
    return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="1.5" class="materiel"/>`;
  }
  if (o.type === "ligne") {
    return `<line x1="${o.de[0]}" y1="${o.de[1]}" x2="${o.a[0]}" y2="${o.a[1]}" class="materiel-trait"/>`;
  }
  if (o.type === "cercle") {
    return `<circle cx="${o.c[0]}" cy="${o.c[1]}" r="${o.r}" class="materiel"/>`;
  }
  return "";
}

function position(pose, classe) {
  if (!pose) return "";
  const traits = (pose.traits || [])
    .map((points) => `<polyline points="${points.map((p) => p.join(",")).join(" ")}" class="${classe}"/>`)
    .join("");
  const tete = pose.tete
    ? `<circle cx="${pose.tete[0]}" cy="${pose.tete[1]}" r="5" class="${classe}"/>`
    : "";
  return traits + tete;
}

export function schemaSvg(exerciceId, taille = 64) {
  const s = schemaDe(exerciceId);
  if (!s) return "";

  const fleche = s.fleche
    ? `<line x1="${s.fleche.de[0]}" y1="${s.fleche.de[1]}" x2="${s.fleche.a[0]}" y2="${s.fleche.a[1]}"
             class="fleche" marker-end="url(#pointe)"/>`
    : "";

  return `<svg class="schema" width="${taille}" height="${taille}" viewBox="0 0 100 100"
               role="img" aria-label="Schéma du mouvement">
    <defs>
      <marker id="pointe" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" class="pointe"/>
      </marker>
    </defs>
    ${(s.objets || []).map(objet).join("")}
    ${position(s.depart, "depart")}
    ${position(s.arrivee, "arrivee")}
    ${fleche}
  </svg>`;
}

export function aUnSchema(exerciceId) {
  return schemaDe(exerciceId) !== null;
}
