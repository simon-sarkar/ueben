/* Lernkartei: Karten umdrehen und selbst sagen „Wusste ich“ / „Wusste ich nicht“, oder die Antwort tippen.
   Fächer wie in einer Lernkartei: nicht gewusst → Fach 1 und nach drei Karten noch einmal; gewusst → ein Fach weiter
   (eine neue Karte, die man gleich weiß, springt in Fach 2). Je weiter hinten eine Karte liegt, desto seltener kommt sie.
   Der Stand bleibt nur im Browser dieses Geräts (localStorage, darf fehlen); nichts wird verschickt.
   cfg: {id, titel, sprache, runde, karten(auswahl) -> [{id, vorne, hinten, antworten[], eingabe:'zahl'|'text'}],
         auswahl: {titel, optionen:[{wert, text}], param, standard:[werte]}} */
(function () {
  "use strict";
  const T = {
    de: { umdrehen: "Umdrehen", ja: "Wusste ich", nein: "Wusste ich nicht", modus: "So übst du", karte: "Karte umdrehen",
      tippen: "Antwort tippen", start: "Los geht’s", weiter: "Weiter", pruefen: "Prüfen", ok: "Richtig.", falsch: "Nicht ganz.",
      doch: "Meine Antwort stimmt auch", gewusst: "gewusst", von: "von", fertig: "Geschafft",
      faecher: ["neu", "Fach 1", "Fach 2", "Fach 3", "Fach 4", "sitzt"], fach: "Fach",
      bald: "Diese Karten kommen bald wieder:", mehr: "Weiter üben", zurueck: "Zurück zur Auswahl",
      reset: "Kartei auf diesem Gerät zurücksetzen", sicher: "Wirklich alles zurücksetzen?", leer: "Bitte mindestens eine auswählen.",
      info: "Was du nicht weißt, kommt öfter. Was du schon kannst, kommt seltener. Dein Stand bleibt auf diesem Gerät.",
      antwort: "Antwort", zahl: "Zahl eingeben" },
    en: { umdrehen: "Turn over", ja: "I knew it", nein: "I didn’t know", modus: "How do you want to practise?", karte: "Turn the card",
      tippen: "Type the answer", start: "Start", weiter: "Next", pruefen: "Check", ok: "Right.", falsch: "Not quite.",
      doch: "My answer is right too", gewusst: "known", von: "of", fertig: "Done",
      faecher: ["new", "box 1", "box 2", "box 3", "box 4", "learnt"], fach: "box",
      bald: "These cards will come back soon:", mehr: "Keep practising", zurueck: "Back to the list",
      reset: "Reset the cards on this phone", sicher: "Really reset everything?", leer: "Please choose at least one.",
      info: "What you don’t know comes back more often. What you know comes less often. Your progress stays on this phone.",
      antwort: "Answer", zahl: "Type a number" }
  };
  /* Gewicht je Fach (0 = neu): Fach 1 am häufigsten, „sitzt“ nur noch ab und zu */
  const GEWICHT = [5, 8, 3, 1.5, 0.6, 0.25];
  const lies = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat: ohne Speicher */ } };
  const loesch = k => { try { localStorage.removeItem(k); } catch (e) { /* egal */ } };
  /* Antworten vergleichen: Groß/klein, Artikel, „to“, Satzzeichen und Bindestrich am Ende egal */
  const norm = s => String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!?;:]/g, "").replace(/\s+/g, " ").trim()
    .replace(/^(to|the|a|an|der|die|das|ein|eine) /, "").replace(/-$/, "").trim();

  U.kartei = cfg => {
    const L = T[cfg.sprache || "de"], RUNDE = cfg.runde || 20, ziel = document.querySelector("#app");
    const SK = "ueben-kartei-" + cfg.id, MK = SK + "-modus", AK = SK + "-auswahl";
    let stand = lies(SK) || {};
    const P = new URLSearchParams(location.search);
    let modus = P.get("modus") === "tippen" ? "tippen" : P.get("modus") === "karte" ? "karte" : (lies(MK) || "karte");
    let auswahl = null;
    if (cfg.auswahl) {
      const ausAdresse = (P.get(cfg.auswahl.param) || "").split(",").filter(Boolean);
      const gueltig = cfg.auswahl.optionen.map(o => String(o.wert));
      auswahl = new Set((ausAdresse.length ? ausAdresse : (lies(AK) || cfg.auswahl.standard).map(String)).filter(w => gueltig.includes(w)));
      if (!auswahl.size) auswahl = new Set(cfg.auswahl.standard.map(String));
    }
    let karten = [], nr = 0, gewusst = 0, start = Date.now(), wieder = [], zuletzt = [], falsch = [];
    const fach = id => (stand[id] && stand[id].f) || 0;

    const uebersicht = () => {
      const n = [0, 0, 0, 0, 0, 0]; karten.forEach(k => n[fach(k.id)]++);
      return `<div class="kk-faecher" aria-label="${L.faecher.map((f, i) => f + ": " + n[i]).join(", ")}">` +
        n.map((z, i) => `<div class="kk-f f${i}${z ? "" : " leer"}"><b>${z}</b><span>${L.faecher[i]}</span></div>`).join("") + "</div>";
    };

    function startbild() {
      karten = cfg.karten(auswahl);
      let h = `<div class="leiste"><h1>${cfg.titel}</h1></div><div class="karte"><p class="klein" style="margin-top:0">${L.info}</p>`;
      if (cfg.auswahl) h += `<div class="kopf">${cfg.auswahl.titel}</div><div class="kk-auswahl">` +
        cfg.auswahl.optionen.map(o => `<button type="button" data-wert="${o.wert}" aria-pressed="${auswahl.has(String(o.wert))}">${o.text}</button>`).join("") +
        `</div><p class="kk-hinweis klein versteckt">${L.leer}</p>`;
      h += `<div class="kopf">${L.modus}</div><div class="kk-modus">` +
        `<button type="button" data-modus="karte" aria-pressed="${modus === "karte"}">${L.karte}</button>` +
        `<button type="button" data-modus="tippen" aria-pressed="${modus === "tippen"}">${L.tippen}</button></div>` +
        `<div class="kk-ueber">${uebersicht()}</div>` +
        `<button class="knopf breit" type="button" id="start">${L.start}</button></div>`;
      ziel.innerHTML = h;
      ziel.querySelectorAll("[data-modus]").forEach(b => b.onclick = () => {
        modus = b.dataset.modus; schreib(MK, modus);
        ziel.querySelectorAll("[data-modus]").forEach(x => x.setAttribute("aria-pressed", x === b));
      });
      ziel.querySelectorAll("[data-wert]").forEach(b => b.onclick = () => {
        const w = b.dataset.wert;
        if (auswahl.has(w)) auswahl.delete(w); else auswahl.add(w);
        b.setAttribute("aria-pressed", auswahl.has(w));
        schreib(AK, [...auswahl]);
        karten = cfg.karten(auswahl);
        ziel.querySelector(".kk-ueber").innerHTML = uebersicht();
        ziel.querySelector(".kk-hinweis").classList.toggle("versteckt", !!auswahl.size);
      });
      ziel.querySelector("#start").onclick = () => {
        if (!karten.length) { ziel.querySelector(".kk-hinweis").classList.remove("versteckt"); return; }
        neueRunde();
      };
    }

    function neueRunde() {
      nr = 0; gewusst = 0; start = Date.now(); wieder = []; zuletzt = []; falsch = [];
      U.haStartZeit = start;
      zeige();
    }

    /* nächste Karte: fällige Wiederholung zuerst, sonst gewichtet nach Fach, nicht eine der letzten drei */
    function naechste() {
      const f = wieder.find(w => w.ab <= nr);
      if (f) { wieder.splice(wieder.indexOf(f), 1); return f.k; }
      const sperre = zuletzt.slice(-Math.min(3, karten.length - 1));
      let pool = karten.filter(k => !sperre.includes(k.id) && !wieder.some(w => w.k.id === k.id));
      if (!pool.length) pool = karten.filter(k => !sperre.includes(k.id));
      if (!pool.length) pool = karten;
      let summe = 0; pool.forEach(k => summe += GEWICHT[fach(k.id)]);
      let r = Math.random() * summe;
      for (const k of pool) { r -= GEWICHT[fach(k.id)]; if (r <= 0) return k; }
      return pool[pool.length - 1];
    }

    function bewerte(k, ok) {
      const s = stand[k.id] || { f: 0, r: 0, w: 0 };
      if (ok) { s.f = s.f === 0 ? 2 : Math.min(5, s.f + 1); s.r++; gewusst++; }
      else { s.f = 1; s.w++; wieder.push({ k, ab: nr + 3 }); if (!falsch.some(x => x.id === k.id)) falsch.push(k); }
      s.z = Date.now(); stand[k.id] = s; schreib(SK, stand);
      zuletzt.push(k.id); if (zuletzt.length > 5) zuletzt.shift();
    }

    function zeige() {
      if (nr >= RUNDE) return ende();
      const k = naechste(), f = fach(k.id);
      let h = `<div class="leiste"><h1>${cfg.titel}</h1><span class="punkte">${gewusst} / ${RUNDE}</span></div>` +
        `<div class="balken"><i style="width:${100 * nr / RUNDE}%"></i></div>` +
        `<div class="kk-fachzeile klein"><span class="kk-punkt f${f}"></span>${f === 0 ? L.faecher[0] : f === 5 ? L.faecher[5] : L.fach + " " + f}</div>` +
        `<button class="kk-karte" type="button" aria-label="${L.umdrehen}"><span class="kk-seite kk-vorne">${k.vorne}</span>` +
        `<span class="kk-seite kk-hinten">${k.hinten}</span></button>`;
      if (modus === "tippen") {
        const zahl = k.eingabe === "zahl";
        h += `<form class="eingabe kk-eingabe" autocomplete="off"><input ${zahl ? 'inputmode="numeric"' : 'type="text" autocapitalize="off" autocorrect="off" spellcheck="false"'} enterkeyhint="done" aria-label="${L.antwort}" placeholder="?">` +
          `<button class="knopf" type="submit">${L.pruefen}</button></form><div class="rueck versteckt"></div>`;
      } else h += `<div class="kk-knoepfe"><button class="knopf breit" type="button" data-um>${L.umdrehen}</button></div>`;
      h += `<div class="kk-knoepfe kk-urteil versteckt"><button class="knopf kk-nein" type="button" data-nein>${L.nein}</button>` +
        `<button class="knopf kk-ja" type="button" data-ja>${L.ja}</button></div>` +
        `<div class="unten versteckt"><button class="knopf zwei kk-doch versteckt" type="button" data-doch>${L.doch}</button>` +
        `<button class="knopf" type="button" data-weiter>${L.weiter}</button></div>`;
      ziel.innerHTML = h;
      const karte = ziel.querySelector(".kk-karte"), urteil = ziel.querySelector(".kk-urteil");
      const weiter = () => { nr++; zeige(); window.scrollTo(0, 0); };
      const um = () => karte.classList.add("um");
      if (modus === "karte") {
        const zeigeUrteil = () => {
          if (karte.classList.contains("um")) return;
          um(); ziel.querySelector("[data-um]").parentNode.classList.add("versteckt"); urteil.classList.remove("versteckt");
          urteil.querySelector("[data-ja]").focus({ preventScroll: true });
        };
        karte.onclick = zeigeUrteil; ziel.querySelector("[data-um]").onclick = zeigeUrteil;
        urteil.querySelector("[data-ja]").onclick = () => { bewerte(k, true); weiter(); };
        urteil.querySelector("[data-nein]").onclick = () => { bewerte(k, false); weiter(); };
      } else {
        karte.tabIndex = -1;
        const form = ziel.querySelector("form"), inp = form.querySelector("input");
        setTimeout(() => inp.focus({ preventScroll: true }), 50);
        form.onsubmit = e => {
          e.preventDefault();
          const v = inp.value.trim();
          if (!v) return;
          let ok;
          if (k.eingabe === "zahl") { const z = U.zahl(v); if (isNaN(z)) { inp.value = ""; inp.placeholder = L.zahl; return; }
            ok = k.antworten.some(a => U.gleich(z, Number(a))); }
          else ok = k.antworten.some(a => norm(a) === norm(v));
          inp.disabled = true; form.querySelector("button").disabled = true;
          const vorher = Object.assign({ f: 0, r: 0, w: 0 }, stand[k.id]);
          um(); bewerte(k, ok);
          const r = ziel.querySelector(".rueck"); r.classList.remove("versteckt"); r.classList.add(ok ? "ok" : "falsch");
          r.textContent = ok ? L.ok : L.falsch;
          ziel.querySelector(".punkte").textContent = `${gewusst} / ${RUNDE}`;
          const u = ziel.querySelector(".unten"); u.classList.remove("versteckt");
          const d = u.querySelector("[data-doch]");
          /* Tippfehler oder andere richtige Übersetzung: selbst als gewusst werten (nur bei Wörtern) */
          if (!ok && k.eingabe !== "zahl") { d.classList.remove("versteckt"); d.onclick = () => {
            wieder = wieder.filter(w => w.k.id !== k.id); falsch = falsch.filter(x => x.id !== k.id);
            stand[k.id] = vorher; zuletzt.pop(); bewerte(k, true); weiter(); }; }
          const w = u.querySelector("[data-weiter]"); w.focus({ preventScroll: true }); w.onclick = weiter;
        };
      }
    }

    function ende() {
      let h = `<div class="leiste"><h1>${cfg.titel}</h1></div><div class="karte ende"><div class="kopf">${L.fertig}</div>` +
        `<div class="gross">${gewusst} ${L.von} ${RUNDE}</div><p class="zeile">${L.gewusst}</p>` + uebersicht() +
        U.haBox(cfg.titel, `${gewusst} ${L.von} ${RUNDE} ${L.gewusst}`, start, cfg.sprache);
      if (falsch.length) h += `<p class="klein">${L.bald}</p><ul class="liste">` +
        falsch.map(k => `<li>${k.vorne} <span class="klein">→</span> <b>${k.kurz || k.hinten}</b></li>`).join("") + "</ul>";
      h += `<div class="knoepfe-mehr"><button class="knopf breit" type="button" data-mehr>${L.mehr}</button>` +
        `<a class="knopf zwei breit" href="../">${L.zurueck}</a></div>` +
        `<button class="kk-reset klein" type="button">${L.reset}</button></div>`;
      ziel.innerHTML = h;
      ziel.querySelector("[data-mehr]").onclick = () => { neueRunde(); window.scrollTo(0, 0); };
      const r = ziel.querySelector(".kk-reset");
      r.onclick = () => {
        if (!r.dataset.sicher) { r.dataset.sicher = "1"; r.textContent = L.sicher; setTimeout(() => { delete r.dataset.sicher; r.textContent = L.reset; }, 4000); return; }
        stand = {}; loesch(SK); startbild(); window.scrollTo(0, 0);
      };
    }

    startbild();
  };
})();
