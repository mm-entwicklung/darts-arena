- v0.1.7 Korrektur: Ringgenaues Trefferblinken (Single/Double/Triple/Bull), ausschließlich nach einem Treffer; keine Wiederholung bei UI-Klicks.
# Änderungsprotokoll

## v0.1.7 – Responsive Spielansicht

- Nachbesserung: Tastendruck-Feedback für Bildschirmtastatur (150 ms) und Spielstart-Schaltfläche unter den Spielregeln statt unter der Teilnehmerliste.

- Dreispaltige Spielansicht für 1920 × 1080: kompakte Spielerliste, virtuelle Dartscheibe und Eingabe/Aufnahme.
- Spielerliste bis 32 Spieler intern scrollbar; aktiver Spieler automatisch sichtbar und mit Punktestand hervorgehoben.
- Touchfreundliche Bedienelemente und responsive Anordnung bei schmaleren Fenstern.
- Schematische Trefferpunkte und kurze Segment-Hervorhebung nach manueller Eingabe; keine Behauptung exakter Einschlagpositionen.
- Spielregeln, Backend und SQLite unverändert.

## v0.1.5

- Avatar-Editor touchfreundlich überarbeitet: Vorschau und Entfernen-Schaltfläche nebeneinander, Rückgängig vor dem Speichern.

- Avatar im Spielereditor entfernen: Löschung wird erst beim Speichern übernommen; Abbrechen behält das Bild.

- Benannte Favoritenlisten: erstellen, bearbeiten, löschen; Spieler können mehreren Listen angehören.
- Favoritenlisten bei der Spielvorbereitung als Vorauswahl laden; einzelne Spieler vorübergehend abwählen.
- Avatarbilder (JPEG, PNG, WebP, HEIC/HEIF) werden lokal auf 256 × 256 Pixel zugeschnitten und als WebP gespeichert.
- Originalbilder bis 25 MB; nur optimierte Avatare werden im JSON-Spielstand abgelegt.
- Zusätzliche lokale Abhängigkeiten Pillow und pillow-heif (siehe README).
- Keine Teamspiel-Logik und keine SQLite-Migration (für spätere Versionen geplant).

## v0.1.4

- QWERTZ-Tastatur mit permanenter Zahlenreihe, vier Sonderzeichen und Shift für Umlaute; ß bleibt ß.
- Spielernummerierung, Spielerzähler und „Alle auswählen“.
- Syntaxkorrektur in der Teilnehmerauswahl.

## v0.1.3

- Frontend in JavaScript-Module und CSS-Dateien aufgeteilt.
- Lokale Auslieferung der Moduldateien ergänzt.

## v0.1.2

- Touch-Steuerung, Wurfkorrektur, Bildschirmtastatur, aktiver Spieler und Single-Reset.

## v0.1.6 – SQLite-Datenbank
- Lokale SQLite-Datenbank (`data/darts_arena.db`) mit automatischer Initialisierung.
- Spieler und WebP-Avatare als BLOB, Favoritenlisten mit Mehrfachzuordnung sowie aktives Spiel dauerhaft gespeichert.
- Datenbankzugriffe in `database.py` ausgelagert; atomare Transaktionen und Fremdschlüssel.
- Keine Migration von JSON-Testdaten; bestehende `data/state.json` bleibt unangetastet.

### v0.1.7 – Spielansicht / Testkomfort (Nachbesserung)
- Navigation bei aktivem Spiel ausgeblendet; nach Spielende wieder sichtbar.
- Virtuelle Dartscheibe nutzt den frei gewordenen Platz.
- Zwei Testschaltflächen ergänzen vorhandene Spieler auf 16 oder 32 mit zufälligen Namen.

### v0.1.7 – Spielansicht (Layoutkorrektur)
- Spielerliste breiter und Treffererfassung schmaler; Dartscheibenkarte bleibt großzügig.
- Spielmodus rechts oben im Dartscheibenfeld, Entwicklungshinweise entfernt.
- Dartscheibe nutzt die verfügbare Kartenhöhe, ohne die Überschrift zu überdecken.
- Aktuelle Aufnahme ohne redundante Spieler-/Moduszeile.
- Rechter Bereich an Kartenhöhe ausgerichtet, mehr Platz für die Treffer-Tasten.
- Spielername im Feld „JETZT AM ZUG“ vergrößert.

- v0.1.7 Cricket layout fine-tuning: narrower player roster, more space for the dartboard, larger player names, field headings and marks; unchanged avatar and score sizes.
