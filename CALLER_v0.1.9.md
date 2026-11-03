# Caller-Testintegration v0.1.9

- x01: nach dem dritten Dart bzw. vorzeitigem Spielerwechsel die Visit-Punkte (`an_<score>.wav`), bei 180 `an_180v2.wav`.
- Bust: `an_0.wav`.
- Spielabschluss: Match `gsm.wav`, Set `gls_1.wav`, sonst Leg `gl_1.wav`.
- Cricket: bei einem Treffer (nicht MISS) `Hit_3.wav`, keine gesprochenen Einzelwürfe.
- Korrekturen: laufende Wiedergabe stoppen und bei abgeschlossener Aufnahme erneut ansagen.
- Alle WAV-Dateien bleiben erhalten; keine Stille-Dateien erforderlich.
- `yr_*` derzeit nicht verwendet. Keine Einstellungsoberfläche hinzugefügt.

## Test

`start_windows.bat` starten. x01: drei Darts, 180, Bust, Checkout, Korrektur und vorzeitiger Spielerwechsel testen. Cricket: Treffer und Miss testen. Leg/Set/Match mit passenden Zieleinstellungen prüfen.

Hinweis: Browser-Audio und End-to-End-Szenarien sind hier nicht interaktiv getestet worden. Es sind 25 Python-Unittests erfolgreich.
