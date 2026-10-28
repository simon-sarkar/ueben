# Üben

Übungen für den Unterricht, die im Browser laufen. Keine Anmeldung, keine Datenerfassung: Ergebnisse bleiben auf dem Gerät.

## Hausaufgabe mit Nachweis

Hängt man an die Adresse einer Übung `?ha=Wort` an (etwa `…/englisch/u2-intro/check/?ha=Mango`), zeigt das Schlussbild
einen Kasten mit dem Wort, dem Ergebnis, Datum, Uhrzeit und Bearbeitungsdauer. Ein Screenshot davon taugt als Abgabe.
Ohne `?ha=` erscheint nichts. Das Wort wird nirgends gespeichert oder verschickt; erlaubt sind Buchstaben, Ziffern,
Leerzeichen und Bindestrich, höchstens 24 Zeichen.

## Gleiche Aufgaben für alle

Standardmäßig bekommen alle dieselben Aufgaben: Der Zufall hat einen festen Startwert aus der Adresse der Übung (und
dem Wort aus `?ha=`). Am Ende stehen bis zu drei Knöpfe: „∞ Endlos weiterüben“ (nur wo die Übung wirklich neue Aufgaben erzeugt, etwa
Rechnen und IP-Adressen; feste Listen wie Vokabeln nicht) (neue Zufallsaufgaben, oben bleibt das Ergebnis der festen Runde
stehen, daneben ∞ richtig/beantwortet, z. B. „8/10 · ∞ 18/20“; „Ergebnis“ zeigt beides und den Nachweis), „Wiederholen“
(dieselben Aufgaben) und „Zurück zur Auswahl“. Übungen mit eigenem Aufbau, die neue Aufgaben erzeugen können (Bausteine, Dreieck antippen, schriftlich,
privat/öffentlich), haben „Neue zufällige Aufgaben“. Mit `?zufall=1` gibt es von Anfang an bei jeder Runde neue Aufgaben. Die Spiele (Blasen, Paketpost) und der Kopfrechen-Sprint (Warm-up-Ritual) würfeln immer frei.

## Designs

`?design=` an der Adresse wählt das Aussehen: `wellig` (Standard), `tinte`, `salbei`, `lagune`, `pflaume`, `nacht`, `verspielt`, `magazin`.
`magazin` und `verspielt` kommen aus den Familien der Kursmühle. Ein Design in der Adresse ersetzt das fest eingestellte der Seite ganz (auch Rand und Farbe), etwa `…/rechnen/einmaleins/?design=magazin`. `?kasten=wellig|sehr-wellig` zieht den Rand der Karten in der Akzentfarbe nach.
`?farbe=2b5a8f` setzt eine eigene Farbe für Knöpfe, Nummern und Fortschritt. Beides geht auch fest in einer Seite
(`<html data-design="tinte" data-farbe="#2b5a8f">`).

## Lernkartei

`basis/kartei.js` macht aus einer Kartenliste eine Lernkartei: Karte umdrehen und „Wusste ich“ oder „Wusste ich nicht“
antippen, oder die Antwort tippen (`?modus=tippen`). Nicht gewusste Karten kommen nach drei anderen wieder und landen in
Fach 1; gewusste rücken ein Fach weiter und kommen seltener. Eine Runde hat 20 Karten. Der Stand bleibt im Browser des
Geräts und lässt sich am Ende zurücksetzen. Die Kartei würfelt frei, weil sich die Reihenfolge nach dem richtet, was das
Kind nicht weiß. Beim Einmaleins wählt `?reihen=3,7` die Reihen vor.
