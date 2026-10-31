# Darts Arena v0.1 – Windows-Prototyp

## Start unter Windows

1. Python 3.10 oder neuer von https://www.python.org/downloads/ installieren (bei Installation **Add Python to PATH** aktivieren).
2. ZIP entpacken.
3. `start_windows.bat` doppelklicken.
4. Der Browser öffnet `http://127.0.0.1:8765`.
5. **Spieler** → mindestens zwei Profile erstellen → **Neues Spiel** → Spielmodus und Spieler wählen → **Spiel starten**.

Die App nutzt ausschließlich die Python-Standardbibliothek, ohne zusätzliche Pakete oder Internetverbindung. Das Konsolenfenster muss während des Spielens geöffnet bleiben. Beenden mit Strg+C. Daten liegen in `data/state.json`; zum Sichern diese Datei kopieren.

## Umfang

- Bis zu 32 gespeicherte und gleichzeitig teilnehmende Spieler; Namen und Avatarbilder.
- x01: 101/201/301/501/701/1001; Single/Double/Master Out, Bust und automatische Siegererkennung.
- Cricket: Standard, Cut-Throat, No-Score; 15–20 und Bull, Markierungen, Punktelogik, Siegererkennung.
- Manuelle Treffer über Single/Double/Triple, Bull und Miss; maximal drei Darts pro Aufnahme.
- Offline, nur auf 127.0.0.1 erreichbar; lokaler Spielstand wird gespeichert.

## Bekannte Grenzen

- **Noch keine echte Autodarts-Integration oder Kameraverarbeitung.** Bestehendes Autodarts-System muss vor Anbindung identifiziert werden (Version, Schnittstelle, Kameramodell).
- **Noch keine iOS-/Android-Apps.** Diese Version ist eine lokal auf Windows laufende Browseroberfläche. Eine spätere plattformübergreifende Oberfläche ist möglich.
- Kein Undo, keine Legs/Sets/Turniere, keine Statistiken oder Live-Netzwerksynchronisation.
- Die x01-Regeln enthalten keine Double-In-Option.
- Die Reihenfolge der Spieler entspricht der Auswahlreihenfolge.
- Browser kann Daten nur lokal über den Python-Server speichern; keine direkte EXE.

## Entwicklung / Tests

Im Projektordner:

```bat
python -m unittest discover -s tests -v
```

Spielengine: `engine.py` · Lokaler HTTP-Server: `server.py` · Oberfläche: `static/`.

## Autodarts-Architektur (nächster Schritt)

Ein separater Hardwareadapter soll künftig validierte Treffer als `S20`, `D16`, `T19`, `S25`, `D25` oder `MISS` an die Spielengine übergeben. 1- und 3-Kamera-Betrieb gehören in diesen Adapter und dürfen die Regeln nicht beeinflussen. Es wird **keine** Kompatibilität mit einer bestimmten bestehenden Autodarts-Installation behauptet, solange ihre Schnittstelle nicht geprüft wurde.

## Version 0.1.1 – Check-In-Regeln

Bei x01 können im Menü **Check-In (Spielbeginn)** die Optionen Straight In (Standard), Double In und Master In gewählt werden. Double In erfordert als ersten zählenden Dart ein Doppel (inklusive Bullseye 50), Master In ein Doppel oder Triple (inklusive Bullseye 50). Nicht qualifizierende Darts zählen als geworfen, ziehen aber keine Punkte ab. Jeder Spieler hat einen separaten Einstiegsstatus. Check-Out bleibt unabhängig einstellbar.
