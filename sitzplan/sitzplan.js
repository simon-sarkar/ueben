/* Sitzplan: Namen eintragen, würfeln, Tische schieben. Läuft ganz im Browser, überträgt nichts.
   Namen werden nur als Text gesetzt (textContent), nie als HTML. */
(function () {
  "use strict";

  var W = 1320, H = 760, TW = 116, TH = 58, PW = 334, PH = 70;
  var MAGNET = 22, RASTER = 2;
  var MAX_NAMEN = 60, MAX_LAENGE = 40, MAX_TISCHE = 60, MAX_TEXT = 4000;
  var SCHLUESSEL = "sitzplan-v1";

  /* ---------- Rechnen (ohne Seite, in Node prüfbar) ---------- */

  function zufall(seed) {
    var s = String(seed), h = 1779033703 ^ s.length, i;
    for (i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    var a = (h ^ (h >>> 16)) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mischen(liste, rnd) {
    var a = liste.slice(), i, j, x;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1));
      x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }

  function namenLesen(text) {
    var aus = [];
    var zeilen = String(text).split(/\r?\n/).filter(function (z) { return z.trim(); });
    /* Eine einzige Zeile mit Kommas oder Strichpunkten gilt als eingefügte Liste. */
    if (zeilen.length === 1) zeilen = zeilen[0].split(/[,;]/);
    zeilen.forEach(function (z) {
      var n = z.replace(/\s+/g, " ").trim().slice(0, MAX_LAENGE);
      if (n && aus.length < MAX_NAMEN) aus.push(n);
    });
    return aus;
  }

  /* Entfernt ein Vorkommen von n aus liste; true, wenn eins da war. */
  function nimm(liste, n) {
    var i = liste.indexOf(n);
    if (i < 0) return false;
    liste.splice(i, 1);
    return true;
  }

  /* Wer steht in der Liste, sitzt aber nirgends? */
  function ohnePlatz(tische, namen) {
    var rest = namen.slice();
    tische.forEach(function (t) { if (t.name !== null) nimm(rest, t.name); });
    return rest;
  }

  /* Liste wurde geändert: umbenannte Zeilen am Platz umbenennen, gestrichene Namen vom Platz nehmen. */
  function abgleichen(tische, alt, neu) {
    var i;
    if (alt.length === neu.length) {
      for (i = 0; i < alt.length; i++) {
        if (alt[i] !== neu[i]) umbenennen(tische, alt[i], neu[i]);
      }
    }
    var rest = neu.slice();
    tische.forEach(function (t) {
      if (t.name !== null && !nimm(rest, t.name)) t.name = null;
    });
  }

  function umbenennen(tische, von, zu) {
    for (var i = 0; i < tische.length; i++) {
      if (tische[i].name === von) { tische[i].name = zu; return; }
    }
  }

  /* Verteilt die Namen auf alle Tische ohne Schloss. Tische mit Schloss behalten, was sie haben (auch „frei“). */
  function verteilen(tische, namen, seed) {
    var rest = namen.slice();
    var frei = [];
    tische.forEach(function (t) {
      if (t.fest) { if (t.name !== null) nimm(rest, t.name); }
      else frei.push(t);
    });
    frei.sort(function (a, b) { return a.id - b.id; });
    var rnd = zufall(seed);
    var plaetze = mischen(frei, rnd);
    var leute = mischen(rest, rnd);
    plaetze.forEach(function (t, i) { t.name = i < leute.length ? leute[i] : null; });
    return leute.slice(plaetze.length);
  }

  function standardTische() {
    var spalten = [30, 472, 965], reihen = [60, 190, 320, 450], aus = [], id = 1;
    reihen.forEach(function (y, r) {
      spalten.forEach(function (x, s) {
        var zweiter = (r === 3 && s === 1) ? x + TW + 112 : x + TW;
        aus.push({ id: id++, x: x, y: y, name: null, fest: false });
        aus.push({ id: id++, x: zweiter, y: y, name: null, fest: false });
      });
    });
    return aus;
  }

  function standard() {
    return { tische: standardTische(), pult: { x: 870, y: 640, text: "Herr Sarkar" }, namenText: "", seed: "", modus: "namen" };
  }

  function ganz(v, min, max) { return typeof v === "number" && Math.floor(v) === v && v >= min && v <= max; }

  /* Gespeicherten Stand nur übernehmen, wenn jedes Feld Typ, Länge und Bereich einhält. */
  function pruefeStand(o) {
    if (!o || typeof o !== "object" || !Array.isArray(o.tische) || o.tische.length > MAX_TISCHE) return null;
    var ids = {}, tische = [], i, t;
    for (i = 0; i < o.tische.length; i++) {
      t = o.tische[i];
      if (!t || typeof t !== "object" || !ganz(t.id, 1, 99999) || ids[t.id]) return null;
      if (!ganz(t.x, 0, W - TW) || !ganz(t.y, 0, H - TH) || typeof t.fest !== "boolean") return null;
      if (t.name !== null && (typeof t.name !== "string" || !t.name || t.name.length > MAX_LAENGE)) return null;
      ids[t.id] = true;
      tische.push({ id: t.id, x: t.x, y: t.y, name: t.name, fest: t.fest });
    }
    var p = o.pult;
    if (!p || typeof p !== "object" || !ganz(p.x, 0, W - PW) || !ganz(p.y, 0, H - PH)) return null;
    if (typeof p.text !== "string" || p.text.length > 30) return null;
    if (typeof o.namenText !== "string" || o.namenText.length > MAX_TEXT) return null;
    if (typeof o.seed !== "string" || o.seed.length > 30) return null;
    if (o.modus !== "namen" && o.modus !== "tische") return null;
    return { tische: tische, pult: { x: p.x, y: p.y, text: p.text }, namenText: o.namenText, seed: o.seed, modus: o.modus };
  }

  function schneidet(ax, ay, bx, by) { return ax < bx + TW && ax + TW > bx && ay < by + TH && ay + TH > by; }

  /* Passt die Gruppe, um (dx, dy) verschoben, in den Raum und neben alle anderen Tische? */
  function passt(gruppe, dx, dy, andere) {
    return gruppe.every(function (m) {
      var x = m.x + dx, y = m.y + dy;
      if (x < 0 || y < 0 || x > W - TW || y > H - TH) return false;
      return andere.every(function (o) { return !schneidet(x, y, o.x, o.y); });
    });
  }

  /* Nach dem Loslassen: an einen Nachbartisch andocken, wenn er nah genug ist, sonst aufs Raster.
     Geht es nicht ohne Überlappung, zurück an den alten Platz. true, wenn die Gruppe umgezogen ist. */
  function einrasten(gruppe, alt, alle) {
    var andere = alle.filter(function (t) { return gruppe.indexOf(t) < 0; });
    var best = null;
    gruppe.forEach(function (m) {
      andere.forEach(function (o) {
        [[o.x - TW, o.y], [o.x + TW, o.y], [o.x, o.y - TH], [o.x, o.y + TH]].forEach(function (z) {
          var dx = z[0] - m.x, dy = z[1] - m.y;
          if (Math.abs(dx) > MAGNET || Math.abs(dy) > MAGNET) return;
          var d = dx * dx + dy * dy;
          if ((!best || d < best.d) && passt(gruppe, dx, dy, andere)) best = { d: d, dx: dx, dy: dy };
        });
      });
    });
    var dx = best ? best.dx : Math.round(gruppe[0].x / RASTER) * RASTER - gruppe[0].x;
    var dy = best ? best.dy : Math.round(gruppe[0].y / RASTER) * RASTER - gruppe[0].y;
    gruppe.forEach(function (m) { m.x = Math.round(m.x + dx); m.y = Math.round(m.y + dy); });
    if (passt(gruppe, 0, 0, andere)) return true;
    gruppe.forEach(function (m, i) { m.x = alt[i].x; m.y = alt[i].y; });
    return false;
  }

  function benachbart(a, b) {
    return (a.y === b.y && Math.abs(a.x - b.x) === TW) || (a.x === b.x && Math.abs(a.y - b.y) === TH);
  }

  /* Alle Tische, die über Kanten mit t zusammenhängen (Zweiertisch, Reihe, Gruppentisch). */
  function verbund(t, alle) {
    var drin = [t], i, k;
    for (i = 0; i < drin.length; i++) {
      for (k = 0; k < alle.length; k++) {
        if (drin.indexOf(alle[k]) < 0 && benachbart(drin[i], alle[k])) drin.push(alle[k]);
      }
    }
    return drin;
  }

  function freierOrt(alle, pult) {
    var x, y;
    for (y = 8; y <= H - TH; y += TH + 10) {
      for (x = 8; x <= W - TW; x += TW + 10) {
        if (!passt([{ x: x, y: y }], 0, 0, alle)) continue;
        if (pult && x < pult.x + PW && x + TW > pult.x && y < pult.y + PH && y + TH > pult.y) continue;
        return { x: x, y: y };
      }
    }
    return null;
  }

  var Rechnen = {
    zufall: zufall, mischen: mischen, namenLesen: namenLesen, ohnePlatz: ohnePlatz, abgleichen: abgleichen,
    verteilen: verteilen, standard: standard, pruefeStand: pruefeStand, einrasten: einrasten, verbund: verbund,
    freierOrt: freierOrt, passt: passt, TW: TW, TH: TH, W: W, H: H
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = Rechnen; return; }

  /* ---------- Seite ---------- */

  var el = function (id) { return document.getElementById(id); };
  var raum = el("raum"), halter = el("halter"), buehne = el("buehne");
  var feldNamen = el("namen"), feldSeed = el("seed"), feldPult = el("pult");
  var massstab = 1;
  var stand = laden();
  var namen = namenLesen(stand.namenText);

  function laden() {
    try {
      var roh = window.localStorage.getItem(SCHLUESSEL);
      if (roh && roh.length < 60000) {
        var s = pruefeStand(JSON.parse(roh));
        if (s) return s;
      }
    } catch (e) { /* kein Speicher: ohne weiterarbeiten */ }
    return standard();
  }

  function speichern() {
    try { window.localStorage.setItem(SCHLUESSEL, JSON.stringify(stand)); } catch (e) { /* dann eben ohne */ }
  }

  function neu(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function schlossBild(zu) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    var r = document.createElementNS(ns, "rect");
    r.setAttribute("x", "3"); r.setAttribute("y", "7"); r.setAttribute("width", "10"); r.setAttribute("height", "7");
    r.setAttribute("rx", "1.5"); r.setAttribute("stroke", "none");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", zu ? "M5.5 7V5a2.5 2.5 0 0 1 5 0v2" : "M5.5 7V5a2.5 2.5 0 0 1 4.7-1.2");
    p.setAttribute("fill", "none"); p.setAttribute("stroke-width", "1.7"); p.setAttribute("stroke-linecap", "round");
    svg.appendChild(r); svg.appendChild(p);
    return svg;
  }

  function groesse(name) {
    var laengstes = name.split(" ").reduce(function (m, w) { return Math.max(m, w.length); }, 0);
    var n = name.indexOf(" ") < 0 ? name.length : Math.max(laengstes, Math.ceil(name.length / 2));
    if (name.length > 22) return "g5";
    return n <= 6 ? "" : n <= 8 ? "g2" : n <= 10 ? "g3" : n <= 13 ? "g4" : "g5";
  }

  function tischNachId(id) {
    for (var i = 0; i < stand.tische.length; i++) if (stand.tische[i].id === id) return stand.tische[i];
    return null;
  }

  function ort(e, x, y) { e.style.left = x + "px"; e.style.top = y + "px"; }

  function zeichnen() {
    var imTischModus = stand.modus === "tische";
    raum.textContent = "";
    raum.className = "raum" + (imTischModus ? " tische" : "");

    var pult = neu("div", "pult", stand.pult.text);
    ort(pult, stand.pult.x, stand.pult.y);
    if (imTischModus) {
      pult.tabIndex = 0;
      pult.setAttribute("aria-label", "Pult verschieben");
      pult.addEventListener("pointerdown", function (ev) { ziehePult(ev, pult); });
      pult.addEventListener("keydown", function (ev) { tastePult(ev); });
    }
    raum.appendChild(pult);

    stand.tische.forEach(function (t) { raum.appendChild(tischBauen(t, imTischModus)); });
    if (imTischModus) griffeBauen();
    standZeigen();
  }

  function tischBauen(t, imTischModus) {
    var d = neu("div", "tisch" + (t.name === null ? " leer" : "") + (t.fest ? " fest" : ""));
    d.dataset.id = String(t.id);
    ort(d, t.x, t.y);
    if (t.name !== null) d.appendChild(neu("span", "name " + groesse(t.name), t.name));

    if (imTischModus) {
      d.tabIndex = 0;
      d.setAttribute("aria-label", "Tisch" + (t.name ? " von " + t.name : "") + " verschieben");
      d.addEventListener("pointerdown", function (ev) {
        if (ev.target.closest("button")) return;
        zieheTische(ev, [t]);
      });
      d.addEventListener("keydown", function (ev) { tasteTisch(ev, t); });
      var weg = neu("button", "weg", "×");
      weg.type = "button";
      weg.setAttribute("aria-label", "Tisch entfernen");
      weg.addEventListener("click", function () { tischEntfernen(t); });
      d.appendChild(weg);
    } else {
      var s = neu("button", "schloss");
      s.type = "button";
      s.setAttribute("aria-pressed", t.fest ? "true" : "false");
      s.setAttribute("aria-label", (t.name ? t.name : "Freier Platz") + (t.fest ? ": Schloss öffnen" : ": hier festhalten"));
      s.title = t.fest ? "Schloss öffnen" : "Beim Würfeln hier lassen";
      s.appendChild(schlossBild(t.fest));
      s.addEventListener("click", function () { t.fest = !t.fest; speichern(); zeichnen(); });
      d.appendChild(s);
      if (t.name !== null) {
        d.addEventListener("pointerdown", function (ev) {
          if (ev.target.closest("button")) return;
          zieheName(ev, t);
        });
      }
    }
    return d;
  }

  function griffeBauen() {
    stand.tische.forEach(function (a) {
      stand.tische.forEach(function (b) {
        var g = null;
        if (b.y === a.y && b.x === a.x + TW) { g = neu("button", "griff"); ort(g, a.x + TW - 9, a.y + TH / 2 - 15); }
        else if (b.x === a.x && b.y === a.y + TH) { g = neu("button", "griff quer"); ort(g, a.x + TW / 2 - 15, a.y + TH - 9); }
        if (!g) return;
        g.type = "button";
        g.setAttribute("aria-label", "Zusammengestellte Tische gemeinsam verschieben");
        g.title = "Zusammen verschieben";
        g.addEventListener("pointerdown", function (ev) { zieheTische(ev, verbund(a, stand.tische)); });
        raum.appendChild(g);
      });
    });
  }

  function standZeigen() {
    var n = namen.length, p = stand.tische.length;
    var text = n + (n === 1 ? " Name" : " Namen") + " · " + p + (p === 1 ? " Platz" : " Plätze");
    var fest = stand.tische.filter(function (t) { return t.fest; }).length;
    if (fest) text += " · " + fest + (fest === 1 ? " Schloss" : " Schlösser");
    el("stand").textContent = text;

    var rest = ohnePlatz(stand.tische, namen), box = el("ohne");
    box.hidden = rest.length === 0;
    if (rest.length) {
      var sitzt = stand.tische.some(function (t) { return t.name !== null; });
      box.textContent = (sitzt ? "Ohne Platz: " : "Noch nicht verteilt: ") + rest.join(", ") +
        (n > p ? ". Es fehlen " + (n - p) + (n - p === 1 ? " Tisch." : " Tische.") : sitzt ? ". Würfeln verteilt neu." : ".");
    }

    el("modus-namen").setAttribute("aria-pressed", stand.modus === "namen" ? "true" : "false");
    el("modus-tische").setAttribute("aria-pressed", stand.modus === "tische" ? "true" : "false");
    el("modus-hilfe").textContent = stand.modus === "namen"
      ? "Namen auf einen anderen Tisch ziehen tauscht die Plätze. Das Schloss am Tisch hält den Platz beim Würfeln fest."
      : "Tisch an einen anderen schieben: Er dockt an. Wegziehen trennt wieder. Der Griff auf der Naht bewegt alle zusammen.";
  }

  function anpassen() {
    var breit = window.matchMedia("(min-width: 900px)").matches;
    var cs = window.getComputedStyle(buehne);
    var w = buehne.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4;
    var h = buehne.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4;
    massstab = breit ? Math.min(w / W, h / H) : w / W;
    if (!(massstab > 0.1)) massstab = 0.1;
    raum.style.transform = "scale(" + massstab + ")";
    halter.style.width = (W * massstab + 4) + "px";
    halter.style.height = (H * massstab + 4) + "px";
  }

  /* ---------- Ziehen ---------- */

  function ziehen(ev, beiBewegung, beiEnde) {
    if (ev.button !== undefined && ev.button !== 0) return;
    ev.preventDefault();
    var x0 = ev.clientX, y0 = ev.clientY, id = ev.pointerId;
    function bewegt(e) { if (e.pointerId === id) beiBewegung(e.clientX - x0, e.clientY - y0, e); }
    function fertig(e) {
      if (e.pointerId !== id) return;
      window.removeEventListener("pointermove", bewegt);
      window.removeEventListener("pointerup", fertig);
      window.removeEventListener("pointercancel", fertig);
      beiEnde(e.type === "pointercancel", e);
    }
    window.addEventListener("pointermove", bewegt);
    window.addEventListener("pointerup", fertig);
    window.addEventListener("pointercancel", fertig);
  }

  function zieheTische(ev, gruppe) {
    var alt = gruppe.map(function (t) { return { x: t.x, y: t.y }; });
    var els = gruppe.map(function (t) { return raum.querySelector('.tisch[data-id="' + t.id + '"]'); });
    var minX = Math.min.apply(null, alt.map(function (a) { return a.x; }));
    var maxX = Math.max.apply(null, alt.map(function (a) { return a.x; })) + TW;
    var minY = Math.min.apply(null, alt.map(function (a) { return a.y; }));
    var maxY = Math.max.apply(null, alt.map(function (a) { return a.y; })) + TH;
    var los = false;
    ziehen(ev, function (px, py) {
      if (!los) {
        los = true;
        els.forEach(function (e) { e.classList.add("zieht"); });
        Array.prototype.forEach.call(raum.querySelectorAll(".griff"), function (g) { g.hidden = true; g.style.display = "none"; });
      }
      var dx = Math.max(-minX, Math.min(W - maxX, px / massstab));
      var dy = Math.max(-minY, Math.min(H - maxY, py / massstab));
      gruppe.forEach(function (t, i) { t.x = alt[i].x + dx; t.y = alt[i].y + dy; ort(els[i], t.x, t.y); });
    }, function (abbruch) {
      if (abbruch) gruppe.forEach(function (t, i) { t.x = alt[i].x; t.y = alt[i].y; });
      else if (los) einrasten(gruppe, alt, stand.tische);
      speichern();
      zeichnen();
    });
  }

  function ziehePult(ev, e) {
    var x0 = stand.pult.x, y0 = stand.pult.y;
    ziehen(ev, function (px, py) {
      stand.pult.x = Math.max(0, Math.min(W - PW, x0 + px / massstab));
      stand.pult.y = Math.max(0, Math.min(H - PH, y0 + py / massstab));
      ort(e, stand.pult.x, stand.pult.y);
    }, function (abbruch) {
      stand.pult.x = abbruch ? x0 : Math.round(stand.pult.x);
      stand.pult.y = abbruch ? y0 : Math.round(stand.pult.y);
      speichern();
      zeichnen();
    });
  }

  function zieheName(ev, t) {
    var geist = null, ziel = null;
    function markieren(e) {
      var unter = document.elementFromPoint(e.clientX, e.clientY);
      var te = unter && unter.closest ? unter.closest(".tisch") : null;
      var neuesZiel = te ? tischNachId(Number(te.dataset.id)) : null;
      if (neuesZiel === t) neuesZiel = null;
      if (neuesZiel === ziel) return;
      Array.prototype.forEach.call(raum.querySelectorAll(".tisch.ziel"), function (x) { x.classList.remove("ziel"); });
      ziel = neuesZiel;
      if (te && ziel) te.classList.add("ziel");
    }
    ziehen(ev, function (px, py, e) {
      if (!geist) {
        if (px * px + py * py < 36) return;
        geist = neu("div", "geist", t.name);
        document.body.appendChild(geist);
      }
      geist.style.left = e.clientX + "px";
      geist.style.top = e.clientY + "px";
      markieren(e);
    }, function (abbruch) {
      if (geist) geist.remove();
      if (!abbruch && geist && ziel) {
        var n = ziel.name; ziel.name = t.name; t.name = n;
        speichern();
      }
      zeichnen();
    });
  }

  function fokusAuf(id) {
    var e = raum.querySelector('.tisch[data-id="' + id + '"]');
    if (e) e.focus();
  }

  function pfeil(ev) {
    var s = ev.shiftKey ? RASTER : 10;
    return { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[ev.key] || null;
  }

  function tasteTisch(ev, t) {
    if (ev.target !== ev.currentTarget) return;
    if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); tischEntfernen(t); return; }
    var p = pfeil(ev);
    if (!p) return;
    ev.preventDefault();
    var andere = stand.tische.filter(function (o) { return o !== t; });
    if (passt([t], p[0], p[1], andere)) { t.x += p[0]; t.y += p[1]; speichern(); zeichnen(); fokusAuf(t.id); }
  }

  function tastePult(ev) {
    var p = pfeil(ev);
    if (!p) return;
    ev.preventDefault();
    stand.pult.x = Math.max(0, Math.min(W - PW, stand.pult.x + p[0]));
    stand.pult.y = Math.max(0, Math.min(H - PH, stand.pult.y + p[1]));
    speichern(); zeichnen();
    var e = raum.querySelector(".pult");
    if (e) e.focus();
  }

  /* ---------- Bedienung ---------- */

  function neuerSeed() {
    var z;
    try { z = window.crypto.getRandomValues(new Uint32Array(1))[0]; } catch (e) { z = Math.floor(Math.random() * 4294967296); }
    return String(10000 + (z % 90000));
  }

  function wuerfeln(seed) {
    stand.seed = seed;
    feldSeed.value = seed;
    verteilen(stand.tische, namen, seed);
    speichern();
    zeichnen();
  }

  function tischEntfernen(t) {
    stand.tische = stand.tische.filter(function (o) { return o !== t; });
    speichern();
    zeichnen();
  }

  /* Zweimal klicken statt Rückfrage-Fenster. */
  function zweimal(knopf, frage, tun) {
    var text = knopf.textContent, uhr = null;
    function zurueck() { knopf.textContent = text; knopf.classList.remove("sicher"); uhr = null; }
    knopf.addEventListener("click", function () {
      if (uhr) { window.clearTimeout(uhr); zurueck(); tun(); return; }
      knopf.textContent = frage;
      knopf.classList.add("sicher");
      uhr = window.setTimeout(zurueck, 4000);
    });
  }

  feldNamen.addEventListener("input", function () {
    if (feldNamen.value.length > MAX_TEXT) feldNamen.value = feldNamen.value.slice(0, MAX_TEXT);
    var alt = namen;
    stand.namenText = feldNamen.value;
    namen = namenLesen(stand.namenText);
    abgleichen(stand.tische, alt, namen);
    speichern();
    zeichnen();
  });

  el("wuerfeln").addEventListener("click", function () { wuerfeln(neuerSeed()); });

  el("seedform").addEventListener("submit", function (ev) {
    ev.preventDefault();
    wuerfeln(feldSeed.value.trim().slice(0, 30) || neuerSeed());
  });

  el("modus-namen").addEventListener("click", function () { stand.modus = "namen"; speichern(); zeichnen(); });
  el("modus-tische").addEventListener("click", function () { stand.modus = "tische"; speichern(); zeichnen(); });

  el("frei").addEventListener("click", function () {
    stand.tische.forEach(function (t) { t.fest = false; });
    speichern();
    zeichnen();
  });

  el("plus").addEventListener("click", function () {
    if (stand.tische.length >= MAX_TISCHE) return;
    var o = freierOrt(stand.tische, stand.pult);
    if (!o) return;
    var id = stand.tische.reduce(function (m, t) { return Math.max(m, t.id); }, 0) + 1;
    stand.tische.push({ id: id, x: o.x, y: o.y, name: null, fest: false });
    stand.modus = "tische";
    speichern();
    zeichnen();
    fokusAuf(id);
  });

  feldPult.addEventListener("input", function () {
    stand.pult.text = feldPult.value.slice(0, 30);
    speichern();
    var p = raum.querySelector(".pult");
    if (p) p.textContent = stand.pult.text;
  });

  zweimal(el("zurueck"), "Sicher? Nochmal klicken", function () {
    var frisch = standard();
    stand.tische = frisch.tische;
    stand.pult.x = frisch.pult.x;
    stand.pult.y = frisch.pult.y;
    if (stand.seed && namen.length) verteilen(stand.tische, namen, stand.seed);
    speichern();
    zeichnen();
  });

  zweimal(el("loeschen"), "Sicher? Nochmal klicken", function () {
    try { window.localStorage.removeItem(SCHLUESSEL); } catch (e) { /* nichts gespeichert */ }
    stand = standard();
    namen = [];
    feldNamen.value = "";
    feldSeed.value = "";
    feldPult.value = stand.pult.text;
    zeichnen();
  });

  feldNamen.value = stand.namenText;
  feldSeed.value = stand.seed;
  feldPult.value = stand.pult.text;
  window.addEventListener("resize", anpassen);
  if (window.ResizeObserver) new ResizeObserver(anpassen).observe(buehne);
  anpassen();
  zeichnen();
})();
