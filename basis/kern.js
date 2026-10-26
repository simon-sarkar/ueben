/* Gemeinsamer Kern aller Übungen: Zufall, Zahlen, Dreiecke als SVG, Runden mit Rückmeldung.
   Keine Daten verlassen das Gerät; nichts wird gespeichert außer (optional) dem eigenen Rekord im Browser. */
(function () {
  "use strict";
  const U = {};

  /* ---------- Zufall und Zahlen ---------- */
  U.ganz = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  U.wahl = arr => arr[Math.floor(Math.random() * arr.length)];
  U.mische = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* Eingabe lesen: Komma oder Punkt, Leerzeichen als Tausendertrennung, "cm²" usw. wird ignoriert */
  U.zahl = s => {
    s = String(s).trim().replace(/[\s  ]/g, "").replace(/[a-zA-ZäöüÄÖÜ²³]+$/, "").replace(",", ".").replace(/^−/, "-");
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return Number(s);
  };
  U.gleich = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 1e-9 : tol);
  /* Deutsche Schreibweise: Komma, Tausender ab 5 Stellen mit schmalem Leerzeichen, echtes Minus */
  U.de = (x, stellen) => {
    if (stellen != null) x = Math.round(x * 10 ** stellen) / 10 ** stellen;
    let s = (Math.round(x * 1e9) / 1e9).toString();
    const neg = s.startsWith("-"); if (neg) s = s.slice(1);
    let [g, k] = s.split(".");
    if (g.length >= 5) g = g.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (neg ? "−" : "") + g + (k ? "," + k : "");
  };
  U.hoch2 = s => `${s}<sup>2</sup>`;
  U.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Dreiecke als SVG ---------- */
  /* Rechtwinkliges Dreieck: Katheten la, lb (in Bildeinheiten), gedreht um theta Grad, flip spiegelt.
     Gibt Punkte A, B, C (C = rechter Winkel), Seite a = BC, b = CA, c = AB. */
  U.rechtwinklig = (la, lb, theta, flip) => {
    const t = theta * Math.PI / 180, s = flip ? -1 : 1;
    const A = [la * Math.cos(t), la * Math.sin(t)], B = [s * -lb * Math.sin(t), s * lb * Math.cos(t)], C = [0, 0];
    return { A, B, C };
  };
  /* Dreieck aus drei Winkeln (Grad) mit Grundseite AB = laenge; gibt A, B, C */
  U.ausWinkeln = (alpha, beta, laenge) => {
    const ga = 180 - alpha - beta, a = alpha * Math.PI / 180;
    const b_ = laenge * Math.sin(beta * Math.PI / 180) / Math.sin(ga * Math.PI / 180);   // Seite AC
    return { A: [0, 0], B: [laenge, 0], C: [b_ * Math.cos(a), -b_ * Math.sin(a)] };
  };
  /* SVG zeichnen: pkte = {A,B,C}; seiten = {BC:'a', CA:'b', AB:'c'} (Beschriftung außen);
     opt: {rechterWinkel:'C', tippen:true, ecken:{A:'A'}, winkel:{A:'60°'}, breite:320, farben:{AB:'#...'}, fuellung} */
  U.dreieckSVG = (p, seiten, opt) => {
    opt = opt || {};
    const W = opt.breite || 320, H = opt.hoehe || Math.round(W * 0.72), rand = opt.rand || 46;
    const pts = [p.A, p.B, p.C], xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const k = Math.min((W - 2 * rand) / (maxx - minx || 1), (H - 2 * rand) / (maxy - miny || 1));
    const ox = (W - (maxx - minx) * k) / 2, oy = (H - (maxy - miny) * k) / 2;
    const T = q => [ox + (q[0] - minx) * k, oy + (q[1] - miny) * k];
    const P = { A: T(p.A), B: T(p.B), C: T(p.C) };
    const S = [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3];
    let s = `<svg class="bild" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Dreieck">`;
    s += `<polygon points="${[P.A, P.B, P.C].map(q => q.join(",")).join(" ")}" fill="${opt.fuellung || "#FFF8EC"}" stroke="#1F2433" stroke-width="3" stroke-linejoin="round"/>`;
    if (opt.rechterWinkel) {
      const R = P[opt.rechterWinkel], o = ["A", "B", "C"].filter(n => n !== opt.rechterWinkel);
      const u = U._einh(R, P[o[0]]), v = U._einh(R, P[o[1]]), m = 18;
      s += `<polyline points="${R[0] + u[0] * m},${R[1] + u[1] * m} ${R[0] + (u[0] + v[0]) * m},${R[1] + (u[1] + v[1]) * m} ${R[0] + v[0] * m},${R[1] + v[1] * m}" fill="none" stroke="#1F2433" stroke-width="2"/>`;
      s += `<circle cx="${R[0] + (u[0] + v[0]) * m * 0.45}" cy="${R[1] + (u[1] + v[1]) * m * 0.45}" r="2.4" fill="#1F2433"/>`;
    }
    for (const [kante, name] of Object.entries(seiten || {})) {
      const X = P[kante[0]], Y = P[kante[1]], M = [(X[0] + Y[0]) / 2, (X[1] + Y[1]) / 2];
      const u = U._einh(X, Y); let n = [-u[1], u[0]];
      if (n[0] * (S[0] - M[0]) + n[1] * (S[1] - M[1]) > 0) n = [-n[0], -n[1]];
      const farbe = (opt.farben && opt.farben[kante]) || null;
      if (farbe) s += `<line x1="${X[0]}" y1="${X[1]}" x2="${Y[0]}" y2="${Y[1]}" stroke="${farbe}" stroke-width="7" stroke-linecap="round"/>`;
      if (opt.tippen) s += `<line class="tipp" data-wahl="${U.esc(name)}" x1="${X[0]}" y1="${X[1]}" x2="${Y[0]}" y2="${Y[1]}" stroke="transparent" stroke-width="44" stroke-linecap="round" style="cursor:pointer"/>`;
      const d = opt.abstand || 20;
      s += `<text x="${M[0] + n[0] * d}" y="${M[1] + n[1] * d}" font-size="${opt.schrift || 22}" text-anchor="middle" dominant-baseline="central" fill="${farbe || "#1F2433"}" pointer-events="none">${U.esc(name)}</text>`;
    }
    for (const [ecke, txt] of Object.entries(opt.winkel || {})) {
      const X = P[ecke], o = ["A", "B", "C"].filter(n => n !== ecke);
      const u = U._einh(X, P[o[0]]), v = U._einh(X, P[o[1]]);
      const half = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) / 2;
      let d = [u[0] + v[0], u[1] + v[1]]; const L = Math.hypot(d[0], d[1]) || 1; d = [d[0] / L, d[1] / L];
      const r = Math.min(64, Math.max(30, 20 / Math.sin(Math.max(half, 0.12))));
      const rr = /^90/.test(txt) ? Math.max(r, 46) : r;
      s += `<text x="${X[0] + d[0] * rr}" y="${X[1] + d[1] * rr}" font-size="14" text-anchor="middle" dominant-baseline="central" fill="#4E5566">${U.esc(txt)}</text>`;
    }
    for (const [ecke, txt] of Object.entries(opt.ecken || {})) {
      const X = P[ecke], d = U._einh(S, X);
      s += `<text x="${X[0] + d[0] * 18}" y="${X[1] + d[1] * 18}" font-size="18" text-anchor="middle" dominant-baseline="central" fill="#4E5566">${U.esc(txt)}</text>`;
    }
    return s + "</svg>";
  };
  U._einh = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };

  /* ---------- Rekord (nur im eigenen Browser, darf fehlen) ---------- */
  U.rekord = (schluessel, wert) => {
    try {
      const k = "ueben-" + schluessel, alt = Number(localStorage.getItem(k) || 0);
      if (wert != null && wert > alt) { localStorage.setItem(k, String(wert)); return { neu: true, wert }; }
      return { neu: false, wert: alt };
    } catch (e) { return { neu: false, wert: 0 }; }
  };

  /* ---------- Runde: Aufgaben nacheinander, Rückmeldung, Auswertung ----------
     cfg: {titel, anzahl, erzeuge(i, schluessel:Set) -> aufgabe, ziel: Element}
     aufgabe: {key, typ:'wahl'|'zahl'|'tipp', frage (HTML), bild (SVG/HTML), optionen [], richtig, loesung, toleranz,
               einheit, weg (HTML: Rechenweg/Erklärung), spalten:2} */
  U.TEXTE = {
    de: { ok: ["Richtig.", "Stimmt.", "Genau.", "Gut gemacht."], falsch: "Nicht ganz.", pruefen: "Prüfen", weiter: "Weiter", zahl: "Zahl eingeben",
          fertig: "Geschafft", nochmal: "Das schaust du dir noch einmal an:", deine: "Deine Antwort", richtig: "richtig", neu: "Neue Runde mit neuen Aufgaben", von: "von" },
    en: { ok: ["Right.", "Correct.", "Well done.", "Yes."], falsch: "Not quite.", pruefen: "Check", weiter: "Next", zahl: "Type a number",
          fertig: "Done", nochmal: "Have another look at these:", deine: "Your answer", richtig: "correct", neu: "New round", von: "of" }
  };
  /* Text vergleichen: Groß/klein, Leerzeichen, Apostroph-Varianten egal */
  U.textGleich = (a, b) => { const n = x => String(x).trim().toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, " "); return n(a) === n(b); };
  U.runde = cfg => {
    const L = U.TEXTE[cfg.sprache || "de"];
    const ziel = cfg.ziel || document.querySelector("#app");
    let nr = 0, richtig = 0, fehler = [], keys = new Set(), aufg = null;
    const kopf = () => `<div class="leiste"><h1>${cfg.titel}</h1><span class="punkte">${richtig} / ${cfg.anzahl}</span></div>` +
      `<div class="balken"><i style="width:${100 * nr / cfg.anzahl}%"></i></div>`;
    function neu() {
      let t, n = 0;
      do { t = cfg.erzeuge(nr, keys); n++; } while (t.key && keys.has(t.key) && n < 60);
      if (t.key) keys.add(t.key);
      return t;
    }
    function zeige() {
      if (nr >= cfg.anzahl) return ende();
      aufg = neu();
      let h = kopf() + `<div class="karte"><div class="frage">${aufg.frage}</div>${aufg.bild || ""}`;
      if (aufg.typ === "wahl") h += `<div class="wahl${aufg.spalten === 2 ? " zwei-spalten" : ""}">` + aufg.optionen.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join("") + "</div>";
      if (aufg.typ === "zahl") h += `<form class="eingabe" autocomplete="off"><input inputmode="decimal" enterkeyhint="done" aria-label="Antwort" placeholder="?">${aufg.einheit ? `<span class="einheit">${aufg.einheit}</span>` : ""}<button class="knopf" type="submit">${L.pruefen}</button></form>`;
      if (aufg.typ === "text") h += `<form class="eingabe" autocomplete="off"><input class="textfeld" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Antwort" placeholder="${aufg.hinweis || ""}" style="width:100%"><button class="knopf" type="submit">${L.pruefen}</button></form>`;
      h += `<div class="rueck versteckt"></div><div class="unten versteckt"><button class="knopf" type="button" data-weiter>${L.weiter}</button></div></div>`;
      ziel.innerHTML = h;
      const karte = ziel.querySelector(".karte");
      if (aufg.typ === "wahl") karte.querySelectorAll(".wahl button").forEach(b => b.onclick = () => {
        const i = Number(b.dataset.i), ok = i === aufg.richtig;
        karte.querySelectorAll(".wahl button").forEach(x => { x.disabled = true; if (Number(x.dataset.i) === aufg.richtig) x.classList.add("ok"); });
        if (!ok) b.classList.add("falsch");
        werte(ok, aufg.optionen[i]);
      });
      if (aufg.typ === "zahl") {
        const f = karte.querySelector("form"), inp = f.querySelector("input");
        setTimeout(() => inp.focus({ preventScroll: true }), 50);
        f.onsubmit = e => {
          e.preventDefault();
          const v = U.zahl(inp.value);
          if (isNaN(v)) { inp.value = ""; inp.placeholder = L.zahl; return; }
          inp.disabled = true; f.querySelector("button").disabled = true;
          werte(U.gleich(v, aufg.loesung, aufg.toleranz), U.de(v));
        };
      }
      if (aufg.typ === "text") {
        const f = karte.querySelector("form"), inp = f.querySelector("input");
        setTimeout(() => inp.focus({ preventScroll: true }), 50);
        f.onsubmit = e => {
          e.preventDefault();
          if (!inp.value.trim()) return;
          inp.disabled = true; f.querySelector("button").disabled = true;
          const loes = [].concat(aufg.loesung);
          werte(loes.some(x => U.textGleich(inp.value, x)), U.esc(inp.value.trim()));
        };
      }
      if (aufg.typ === "tipp") karte.querySelectorAll("[data-wahl]").forEach(el => el.addEventListener("click", () => {
        if (karte.dataset.fertig) return;
        const ok = el.dataset.wahl === String(aufg.richtig);
        el.setAttribute("stroke", ok ? "rgba(22,101,52,.35)" : "rgba(180,35,24,.35)");
        werte(ok, el.dataset.wahl);
      }));
      function werte(ok, gegeben) {
        karte.dataset.fertig = "1";
        if (ok) richtig++; else fehler.push({ frage: aufg.kurz || aufg.frage, gegeben, loesung: aufg.loesungText || (aufg.typ === "wahl" ? aufg.optionen[aufg.richtig] : aufg.typ === "zahl" ? U.de(aufg.loesung) + (aufg.einheit ? " " + aufg.einheit : "") : aufg.typ === "text" ? [].concat(aufg.loesung)[0] : aufg.richtig) });
        const r = karte.querySelector(".rueck"); r.classList.remove("versteckt"); r.classList.add(ok ? "ok" : "falsch");
        r.innerHTML = (ok ? U.wahl(L.ok) : L.falsch) + (aufg.weg ? `<div class="weg">${aufg.weg}</div>` : "");
        ziel.querySelector(".punkte").textContent = `${richtig} / ${cfg.anzahl}`;
        const u = karte.querySelector(".unten"); u.classList.remove("versteckt");
        const w = u.querySelector("[data-weiter]"); w.focus({ preventScroll: true }); w.onclick = () => { nr++; zeige(); window.scrollTo(0, 0); };
        if (r.getBoundingClientRect().bottom > innerHeight) u.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
    function ende() {
      const q = richtig / cfg.anzahl, st = q >= 0.9 ? 3 : q >= 0.7 ? 2 : q >= 0.4 ? 1 : 0;
      let h = `<div class="leiste"><h1>${cfg.titel}</h1></div><div class="karte ende"><div class="kopf">${L.fertig}</div>` +
        `<div class="gross">${richtig} ${L.von} ${cfg.anzahl}</div><div class="sterne" aria-label="${st} von 3 Sternen">` +
        [0, 1, 2].map(i => `<span class="${i < st ? "" : "aus"}">★</span>`).join("") + "</div>";
      if (fehler.length) h += `<p class="klein">${L.nochmal}</p><ul class="liste">` +
        fehler.map(f => `<li>${f.frage}<br><span class="klein">${L.deine}: ${f.gegeben} · ${L.richtig}: <b>${f.loesung}</b></span></li>`).join("") + "</ul>";
      h += `<button class="knopf breit" type="button" data-neu>${L.neu}</button></div>`;
      ziel.innerHTML = h;
      ziel.querySelector("[data-neu]").onclick = () => { nr = 0; richtig = 0; fehler = []; keys = new Set(); zeige(); window.scrollTo(0, 0); };
    }
    zeige();
  };

  window.U = U;
})();
