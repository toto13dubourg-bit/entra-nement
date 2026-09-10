// Micro-lanceur de tests. Aucune dépendance : ouvrir tests/index.html suffit.

const cas = [];

export function test(nom, fn) {
  cas.push({ nom, fn });
}

export function egal(obtenu, attendu, quoi) {
  if (obtenu !== attendu) {
    throw new Error(`${quoi} : attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`);
  }
}

export function proche(obtenu, attendu, tolerance, quoi) {
  if (obtenu === null || obtenu === undefined || Number.isNaN(obtenu)) {
    throw new Error(`${quoi} : aucune valeur, attendu ${attendu}`);
  }
  if (Math.abs(obtenu - attendu) > tolerance) {
    throw new Error(
      `${quoi} : attendu ${attendu} (±${tolerance}), obtenu ${Math.round(obtenu * 1000) / 1000}`
    );
  }
}

export function vrai(condition, quoi) {
  if (!condition) throw new Error(quoi);
}

export function mmss(secondes) {
  if (secondes === null) return "—";
  const s = Math.round(secondes);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const deuxChiffres = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${deuxChiffres(m)}:${deuxChiffres(r)}` : `${m}:${deuxChiffres(r)}`;
}

export async function executer(cible) {
  let reussis = 0;
  const echecs = [];

  for (const c of cas) {
    let ligne;
    try {
      await c.fn();
      reussis++;
      ligne = `<li class="ok"><span>✓</span><span>${c.nom}</span></li>`;
    } catch (e) {
      echecs.push({ nom: c.nom, message: e.message });
      ligne = `<li class="ko"><span>✗</span><span>${c.nom}<span class="detail">${e.message}</span></span></li>`;
    }
    cible.insertAdjacentHTML("beforeend", ligne);
  }

  const total = cas.length;
  const bilan = echecs.length === 0
    ? `<p class="bilan ok">${reussis} tests sur ${total} passent.</p>`
    : `<p class="bilan ko">${echecs.length} échec(s) sur ${total} tests.</p>`;
  cible.insertAdjacentHTML("afterend", bilan);

  return { total, reussis, echecs };
}
