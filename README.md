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

`?design=` an der Adresse wählt das Aussehen: `wellig` (Standard), `tinte`, `salbei`, `lagune`, `pflaume`, `nacht`.
`?farbe=2b5a8f` setzt eine eigene Farbe für Knöpfe, Nummern und Fortschritt. Beides geht auch fest in einer Seite
(`<html data-design="tinte" data-farbe="#2b5a8f">`).
