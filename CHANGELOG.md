# Änderungsprotokoll

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
