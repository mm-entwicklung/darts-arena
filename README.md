# Darts Arena v0.1 – Windows-Prototyp

## Start unter Windows

1. Python 3.10 oder neuer von https://www.python.org/downloads/ installieren (bei Installation **Add Python to PATH** aktivieren).
2. ZIP entpacken.
3. `start_windows.bat` doppelklicken.
4. Der Browser öffnet `http://127.0.0.1:8765`.
5. **Spieler** → mindestens zwei Profile erstellen → **Neues Spiel** → Spielmodus und Spieler wählen → **Spiel starten**.

Für die Avatarverarbeitung benötigt die App die lokalen Python-Pakete aus `requirements.txt`. Einmalig bei bestehender Internetverbindung installieren: `python -m pip install -r requirements.txt`. Danach funktioniert die App offline. Das Konsolenfenster muss während des Spielens geöffnet bleiben. Beenden mit Strg+C. Daten liegen in `data/state.json`; zum Sichern diese Datei kopieren.

## Umfang

- Bis zu 32 gespeicherte und gleichzeitig teilnehmende Spieler; Namen und Avatarbilder.
- x01: 301/501/701/901/1001; Single/Double/Master Out, Bust und automatische Siegererkennung.
- Cricket: Standard, Cut-Throat, No-Score; 15–20 und Bull, Markierungen, Punktelogik, Siegererkennung.
- Manuelle Treffer über Single/Double/Triple, Bull und Miss; maximal drei Darts pro Aufnahme.
- Offline, nur auf 127.0.0.1 erreichbar; lokaler Spielstand wird gespeichert.

## Bekannte Grenzen

- **Noch keine echte Autodarts-Integration oder Kameraverarbeitung.** Bestehendes Autodarts-System muss vor Anbindung identifiziert werden (Version, Schnittstelle, Kameramodell).
- **Noch keine iOS-/Android-Apps.** Diese Version ist eine lokal auf Windows laufende Browseroberfläche. Eine spätere plattformübergreifende Oberfläche ist möglich.
- Keine Legs/Sets/Turniere, keine Statistiken oder Live-Netzwerksynchronisation.
- x01 unterstützt Straight/Double/Master In.
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

## Version 0.1.2 – Touch und Wurfkorrektur

- `MISS` wird als eigener Treffer mit 0 Punkten erfasst (bereits in 0.1.1 vorhanden).
- In der **aktuellen Aufnahme** kann jeder bereits erfasste Dart durch Antippen
  und erneute Auswahl des Feldes korrigiert werden, auch nach Bust oder Checkout.
- Die aktuelle Aufnahme wird bei Korrekturen von ihrem Startzustand aus neu
  berechnet (x01 inkl. Double/Master-In, Cricket, Bust, Checkout).
- Touch-freundlichere Schaltflächen und Fokusdarstellung.
- Korrektur ist auf die aktuelle Aufnahme begrenzt. Bereits abgeschlossene
  Aufnahmen und Aufnahmen aus älteren, laufenden Spielständen können noch nicht
  korrigiert werden. Ein neues Spiel speichert die erforderlichen Snapshots.


## Frontend-Struktur (v0.1.3)

`static/app.js` ist der ES-Modul-Einstiegspunkt. Die Module in `static/js/` trennen API, Spieler, Setup, Spielanzeige, Tastatur und UI. Styles liegen in `static/css/` (base, game, keyboard). Der Python-Server muss die statischen Unterverzeichnisse bereitstellen.

## Version 0.1.5 – Favoritenlisten und Avatare

In der **Spielerverwaltung** können benannte Favoritenlisten angelegt, bearbeitet und gelöscht werden. Spieler können mehreren Listen angehören. Unter **Neues Spiel** kann eine Liste geladen und die Teilnehmerauswahl anschließend beliebig angepasst werden; die gespeicherte Liste bleibt unverändert. Die Listen liegen mit den Spielern in `data/state.json`.

Avatarbilder (JPEG, PNG, WebP, HEIC/HEIF) werden **lokal auf dem Python-Server** mit Pillow und pillow-heif dekodiert, mittig quadratisch zugeschnitten und als 256 × 256 WebP mit Qualität 85 gespeichert. Originalbilder werden nicht dauerhaft in Darts Arena abgelegt. Das Foto auf dem ursprünglichen Gerät wird nicht gelöscht. Maximale Originalgröße: 25 MB; maximal 100 Megapixel. Bestehende Avatare bleiben nutzbar.

**Einmalige Installation unter Windows (Internet nur für die Installation):**

```bat
python -m pip install -r requirements.txt
```

Die Anwendung selbst bleibt vollständig lokal/offline. Falls HEIC-Dateien nicht verarbeitet werden, die Installation von `pillow-heif` überprüfen. Die Speicherung bleibt in v0.1.5 JSON; SQLite ist für v0.1.6 vorgesehen.
