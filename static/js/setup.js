import { model } from "./model.js";
import { $, esc, avatar } from "./helpers.js";
import { api } from "./api.js";
import { toast } from "./ui.js";

export function renderSetup() {
    return `<div class="two"><section class="panel"><h2>Spielregeln</h2><div class="field"><label>Spielmodus</label><select id="mode" onchange="updateMode()"><option value="x01">x01</option><option value="cricket">Cricket</option></select></div><div id="rules"><div class="field"><label>Startpunktzahl</label><select id="start">${[301, 501, 701, 901, 1001].map((x) => `<option ${x === 501 ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>Check-In (Spielbeginn)</label><select id="checkin"><option value="straight">Straight In</option><option value="double">Double In</option><option value="master">Master In</option></select></div><div class="field"><label>Checkout</label><select id="out"><option value="double">Double Out</option><option value="single">Single Out</option><option value="master">Master Out</option></select></div></div></section><section class="panel"><h2>Teilnehmer wählen <span class="mini" id="count">(0 ausgewählt)</span></h2>${model.state.players.length ? model.state.players.map((p) => `<label class="choice"><input type="checkbox" value="${p.id}" onchange="togglePlayer('${p.id}',this.checked)" ${model.selected.includes(p.id) ? "checked" : ""}>${avatar(p)} ${esc(p.name)}</label>`).join("") : '<p class="muted">Lege zuerst mindestens zwei Spieler an.</p>'}<div class="sectionline"></div><button class="primary" onclick="startGame()">Spiel starten →</button></section></div>`;
}
export function updateMode() {
    let mode = $("mode").value;
    $("rules").innerHTML =
        mode === "x01"
            ? `<div class="field"><label>Startpunktzahl</label><select id="start">${[301, 501, 701, 901, 1001].map((x) => `<option ${x === 501 ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>Check-In (Spielbeginn)</label><select id="checkin"><option value="straight">Straight In</option><option value="double">Double In</option><option value="master">Master In</option></select></div><div class="field"><label>Checkout</label><select id="out"><option value="double">Double Out</option><option value="single">Single Out</option><option value="master">Master Out</option></select></div>`
            : `<div class="field"><label>Cricket-Variante</label><select id="cricket"><option value="standard">Standard Cricket</option><option value="cutthroat">Cut-Throat Cricket</option><option value="noscore">No-Score Cricket</option></select></div>`;
}
export function togglePlayer(id, yes) {
    model.selected = yes ? [...selected.filter((x) => x !== id), id] : model.selected.filter((x) => x !== id);
    $("count").textContent = `(${model.selected.length} ausgewählt)`;
}
export function startGame() {
    if (model.selected.length < 2) return toast("Mindestens 2 Spieler auswählen");
    if (model.state.game && !confirm("Aktuelles Spiel ersetzen?")) return;
    let mode = $("mode").value;
    api("start", {
        players: model.selected,
        mode,
        start: mode === "x01" ? Number($("start").value) : 501,
        out: mode === "x01" ? $("out").value : "double",
        checkin: mode === "x01" ? $("checkin").value : "straight",
        cricket: mode === "cricket" ? $("cricket").value : "standard",
    });
    model.view = "game";
}
