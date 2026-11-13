/* Gemeinsame Bausteine der Übungen „Hypotenuse berechnen“: Zahlenvorräte, Bilder, Rechenwege. Braucht basis/kern.js. */
window.H = (function () {
  "use strict";
  const H = {};
  /* Katheten und Hypotenuse, die glatt aufgehen (3-4-5 steht im Hefteintrag und fehlt deshalb) */
  H.GLATT = [[6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [20, 21, 29], [10, 24, 26], [9, 40, 41], [18, 24, 30], [12, 35, 37]];
  H.GROSS = [[16, 30, 34], [24, 32, 40], [21, 28, 35], [14, 48, 50], [11, 60, 61], [30, 40, 50], [27, 36, 45], [33, 44, 55], [28, 45, 53], [20, 48, 52]];
  H.DEZ = [[0.9, 1.2, 1.5], [1.5, 2, 2.5], [2.4, 3.2, 4], [1.6, 3, 3.4], [2.5, 6, 6.5], [3.6, 4.8, 6], [4.5, 6, 7.5], [2.1, 2.8, 3.5], [0.6, 0.8, 1], [1.2, 3.5, 3.7], [1.5, 3.6, 3.9], [2.8, 4.5, 5.3]];
  H.NAMEN = [["a", "b", "c"], ["x", "y", "z"], ["r", "s", "t"], ["d", "e", "f"], ["k", "m", "n"], ["u", "v", "w"], ["p", "q", "r"]];
  H.r2 = x => Math.round(x * 100) / 100;
  H.q = x => Math.round(x * x * 10000) / 10000;          /* Quadrat ohne Rundungsreste */
  H.hyp = (a, b) => Math.sqrt(H.q(a) + H.q(b));
  H.glatt = (a, b) => { const c = H.hyp(a, b); return Math.abs(c - Math.round(c * 10) / 10) < 1e-9; };
  const d = U.de;
  /* Ergebnis als Text: glatte Werte wie sie sind, gerundete immer mit zwei Nachkommastellen */
  H.erg = (a, b) => H.glatt(a, b) ? d(H.r2(H.hyp(a, b))) : H.r2(H.hyp(a, b)).toFixed(2).replace(".", ",");

  /* Rechenweg in den drei Schritten des Hefteintrags, immer mit Einheiten; n = Name der Hypotenuse */
  H.weg = (a, b, einheit, n) => {
    n = n || "c";
    const qa = H.q(a), qb = H.q(b), s = H.q(a) + H.q(b), sum = Math.round(s * 10000) / 10000, c = Math.sqrt(sum), gl = H.glatt(a, b);
    const e = "&nbsp;" + einheit;
    return `(${d(a)}${e})² + (${d(b)}${e})² = ${n}²<br>${d(qa)}${e}² + ${d(qb)}${e}² = ${d(sum)}${e}²<br>${n} = √${d(sum)}${e}² ${gl ? "=" : "≈"} <b>${H.erg(a, b)}${e}</b>`;
  };

  /* Rechtwinkliges Dreieck mit Buchstaben an den Seiten; Werte stehen unter dem Bild.
     namen = [Kathete, Kathete, Hypotenuse]; gesucht = Index der Seite mit dem Fragezeichen (oder -1) */
  H.dreieck = (a, b, namen, einheit, gesucht, opt) => {
    opt = opt || {};
    let la = b, lb = a;                                   /* Seite BC ist lb lang, CA ist la lang */
    const v = la / lb; if (v > 2.6) la = lb * 2.6; if (v < 1 / 2.6) lb = la * 2.6;   /* nicht zu spitz zeichnen */
    const p = U.rechtwinklig(la, lb, opt.theta == null ? U.ganz(0, 359) : opt.theta, opt.flip == null ? Math.random() < .5 : opt.flip);
    const farben = opt.farbe ? { AB: "#C2410C" } : {};
    const bild = U.dreieckSVG(p, { BC: namen[0], CA: namen[1], AB: namen[2] }, { rechterWinkel: "C", breite: 300, hoehe: 210, farben });
    const w = [a, b, null].map((x, i) => `${namen[i]} = ${i === gesucht || x == null ? "?" : d(x) + " " + einheit}`);
    return bild + `<p class="kopf werte">${w.join(" &nbsp;·&nbsp; ")}</p>`;
  };

  /* Skizze zu einer Sachaufgabe: eine Kathete am Boden, eine senkrecht, die gesuchte Strecke schräg */
  H.skizze = o => {
    const W = 320, Hh = 210, by = 172, maxW = 190, maxH = 120;
    let k = Math.min(maxW / o.wv, maxH / o.sv), w = Math.max(54, o.wv * k), h = Math.max(54, o.sv * k);
    const xr = o.rechts ? 250 : 70, xf = o.rechts ? xr - w : xr + w, R = [xr, by], T = [xr, by - h], F = [xf, by], s = o.rechts ? -1 : 1;
    let g = `<svg class="bild" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="Skizze">`;
    g += `<line x1="14" y1="${by}" x2="${W - 14}" y2="${by}" stroke="#8A8F9C" stroke-width="3"/>`;
    if (o.wand) g += `<line x1="${xr}" y1="${by}" x2="${xr}" y2="${Math.max(12, T[1] - 26)}" stroke="#8A8F9C" stroke-width="7"/>`;
    g += `<polygon points="${[R, T, F].map(q => q.join(",")).join(" ")}" fill="#FFF8EC" stroke="#1F2433" stroke-width="2.5" stroke-linejoin="round"/>`;
    g += `<line x1="${T[0]}" y1="${T[1]}" x2="${F[0]}" y2="${F[1]}" stroke="#C2410C" stroke-width="5" stroke-linecap="round"/>`;
    g += `<polyline points="${xr + s * 14},${by} ${xr + s * 14},${by - 14} ${xr},${by - 14}" fill="none" stroke="#1F2433" stroke-width="1.8"/>`;
    g += `<text x="${(xr + xf) / 2}" y="${by + 22}" font-size="17" text-anchor="middle" fill="#1F2433">${o.waag}</text>`;
    g += `<text x="${xr - s * 12}" y="${by - h / 2}" font-size="17" text-anchor="${o.rechts ? "start" : "end"}" dominant-baseline="central" fill="#1F2433">${o.senk}</text>`;
    const mx = (T[0] + F[0]) / 2, my = (T[1] + F[1]) / 2, L = Math.hypot(w, h);
    g += `<text x="${mx + s * (h / L) * 16}" y="${my - (w / L) * 16}" font-size="20" text-anchor="${o.rechts ? "end" : "start"}" fill="#C2410C">?</text>`;
    return g + "</svg>";
  };

  /* Rechteck mit Diagonale */
  H.rechteck = (l, b, tl, tb) => {
    const W = 320, Hh = 200, k = Math.min(190 / l, 120 / b), w = Math.max(90, l * k), h = Math.max(54, b * k), x = (W - w) / 2 - 24, y = (Hh - h) / 2 - 6;   /* rechts Platz für die Beschriftung */
    let g = `<svg class="bild" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="Rechteck mit Diagonale">`;
    g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFF8EC" stroke="#1F2433" stroke-width="3" stroke-linejoin="round"/>`;
    g += `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y}" stroke="#C2410C" stroke-width="5" stroke-linecap="round"/>`;
    g += `<text x="${x + w / 2}" y="${y + h + 22}" font-size="17" text-anchor="middle" fill="#1F2433">${tl}</text>`;
    g += `<text x="${x + w + 10}" y="${y + h / 2}" font-size="17" text-anchor="start" dominant-baseline="central" fill="#1F2433">${tb}</text>`;
    g += `<text x="${x + w / 2 - 12}" y="${y + h / 2 - 12}" font-size="20" text-anchor="end" fill="#C2410C" paint-order="stroke" stroke="#FFF8EC" stroke-width="6">?</text>`;
    return g + "</svg>";
  };

  const RUNDE = "Runde, wenn nötig, auf zwei Nachkommastellen.";
  H.RUNDE = RUNDE;
  /* Sachaufgaben: w = Strecke am Boden, s = senkrechte Strecke, e = Einheit */
  H.SACH = [
    { key: "leiter", w: 1.5, s: 4, e: "m", text: "Eine Leiter lehnt an einer Hauswand. Unten steht sie 1,5 m von der Wand entfernt, oben berührt sie die Wand in 4 m Höhe. Wie lang ist die Leiter?",
      bild: () => H.skizze({ wv: 1.5, sv: 4, waag: "1,5 m", senk: "4 m", wand: true }), kurz: "Leiter an der Hauswand" },
    { key: "fernseher", w: 96, s: 54, e: "cm", text: "Ein Fernseher ist 96 cm breit und 54 cm hoch. Wie lang ist die Diagonale des Bildschirms?",
      bild: () => H.rechteck(96, 54, "96 cm", "54 cm"), kurz: "Diagonale des Fernsehers" },
    { key: "wiese", w: 80, s: 60, e: "m", text: "Ein Weg führt 60 m an einer Wiese entlang. Dann biegt er im rechten Winkel ab und führt 80 m weiter. Wie lang ist die Abkürzung quer über die Wiese?",
      bild: () => H.skizze({ wv: 80, sv: 60, waag: "80 m", senk: "60 m", rechts: true }), kurz: "Abkürzung über die Wiese" },
    { key: "rampe", w: 6, s: 1, e: "m", text: "Eine Rampe führt auf eine 1 m hohe Bühne. Sie beginnt am Boden 6 m vor der Bühne. Wie lang ist die Rampe?",
      bild: () => H.skizze({ wv: 6, sv: 1, waag: "6 m", senk: "1 m", rechts: true, wand: true }), kurz: "Rampe" },
    { key: "drachen", w: 30, s: 40, e: "m", text: "Ein Drachen fliegt in 40 m Höhe. Der Punkt am Boden genau unter ihm ist 30 m von dir entfernt. Wie lang ist die gespannte Schnur?",
      bild: () => H.skizze({ wv: 30, sv: 40, waag: "30 m", senk: "40 m", rechts: true }), kurz: "Schnur des Drachens" },
    { key: "feld", w: 105, s: 68, e: "m", text: "Ein Fußballfeld ist 105 m lang und 68 m breit. Wie weit ist es von einer Eckfahne quer über das Feld zur Eckfahne gegenüber?",
      bild: () => H.rechteck(105, 68, "105 m", "68 m"), kurz: "Diagonale des Fußballfelds" },
    { key: "boot", w: 5, s: 12, e: "km", text: "Ein Boot fährt vom Hafen 12 km nach Norden und dann 5 km nach Osten. Wie weit ist es jetzt in gerader Linie vom Hafen entfernt? Zeichne zuerst eine Skizze in dein Heft.",
      bild: () => "", kurz: "Boot und Hafen" },
    { key: "mast", w: 3.5, s: 9, e: "m", text: "Ein Fahnenmast ist 9 m hoch. Ein Seil führt von der Spitze schräg zum Boden. Dort ist es 3,5 m vom Mast entfernt befestigt. Wie lang ist das Seil? Zeichne zuerst eine Skizze in dein Heft.",
      bild: () => "", kurz: "Seil am Fahnenmast" }
  ];
  H.sach = t => {
    const c = H.hyp(t.w, t.s);
    return { key: t.key, typ: "zahl", frage: `${t.text}<br><span class="klein">${RUNDE}</span>`, bild: t.bild(), loesung: H.r2(c), toleranz: 0.0051, einheit: t.e, kurz: t.kurz, loesungText: `${H.erg(t.w, t.s)}&nbsp;${t.e}`,
      weg: H.weg(Math.min(t.w, t.s), Math.max(t.w, t.s), t.e, "c") };
  };
  return H;
})();
