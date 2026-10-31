import { model } from "./model.js";
import { $, esc, avatar } from "./helpers.js";
import { api } from "./api.js";
import { toast } from "./ui.js";

export function renderSetup() {
    return `<div class="two"><section class="panel"><h2>Spielregeln</h2><div class="field"><label>Spielmodus</label><select id="mode" onchange="updateMode()"><option value="x01">x01</option><option value="cricket">Cricket</option></select></div><div id="rules"><div class="field"><label>Startpunktzahl</label><select id="start">${[301, 501, 701, 901, 1001].map((x) => `<option ${x === 501 ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>Check-In (Spielbeginn)</label><select id="checkin"><option value="straight">Straight In</option><option value="double">Double In</option><option value="master">Master In</option></select></div><div class="field"><label>Checkout</label><select id="out"><option value="double">Double Out</option><option value="single">Single Out</option><option value="master">Master Out</option></select></div></div><div class="setup-start"><button class="primary" onclick="startGame()">Spiel starten →</button></div></section><section class="panel"><h2>Teilnehmer wählen <span class="mini" id="count">(${model.selected.length} ausgewählt)</span></h2>${renderFavoritePicker()}${model.state.players.length ? `<label class="choice select-all"><input id="select-all-players" type="checkbox" onchange="toggleAllPlayers(this.checked)" ${model.selected.length === model.state.players.length ? "checked" : ""}>Alle auswählen</label>` : ""}${model.state.players.length ? model.state.players.map((p, i) => `<label class="choice"><input type="checkbox" value="${p.id}" onchange="togglePlayer('${p.id}',this.checked)" ${model.selected.includes(p.id) ? "checked" : ""}><span class="player-number">${i + 1}.</span> ${avatar(p)} ${esc(p.name)}</label>`).join("") : '<p class="muted">Lege zuerst mindestens zwei Spieler an.</p>'}</section></div>`;
}
export function updateMode() {
    let mode = $("mode").value;
    $("rules").innerHTML =
        mode === "x01"
            ? `<div class="field"><label>Startpunktzahl</label><select id="start">${[301, 501, 701, 901, 1001].map((x) => `<option ${x === 501 ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>Check-In (Spielbeginn)</label><select id="checkin"><option value="straight">Straight In</option><option value="double">Double In</option><option value="master">Master In</option></select></div><div class="field"><label>Checkout</label><select id="out"><option value="double">Double Out</option><option value="single">Single Out</option><option value="master">Master Out</option></select></div>`
            : `<div class="field"><label>Cricket-Variante</label><select id="cricket"><option value="standard">Standard Cricket</option><option value="cutthroat">Cut-Throat Cricket</option><option value="noscore">No-Score Cricket</option></select></div>`;
}
export function togglePlayer(id, yes) {
    model.selected = yes ? [...model.selected.filter((x) => x !== id), id] : model.selected.filter((x) => x !== id);
    updateSelectionCount();
}
export function toggleAllPlayers(yes) {
    model.selected = yes ? model.state.players.map((p) => p.id) : [];
    document.querySelectorAll(".choice input[type=checkbox]").forEach((input) => {
        if (input.id !== "select-all-players") input.checked = yes;
    });
    updateSelectionCount();
}
function updateSelectionCount() {
    $("count").textContent = `(${model.selected.length} ausgewählt)`;
    const selectAll = $("select-all-players");
    if (selectAll) {
        selectAll.checked = model.state.players.length > 0 && model.selected.length === model.state.players.length;
        selectAll.indeterminate = model.selected.length > 0 && model.selected.length < model.state.players.length;
    }
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

function renderFavoritePicker() {
    const favorites = model.state.favorites || [];
    if (!favorites.length) return "";
    return `<div class="field"><label>Favoritenliste laden (Auswahl bleibt anpassbar)</label>
        <select id="favorite-picker" onchange="selectFavorite(this.value)">
            <option value="">Liste auswählen …</option>
            ${favorites.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}
        </select></div>`;
}

export function selectFavorite(id) {
    const favorite = (model.state.favorites || []).find((f) => f.id === id);
    if (!favorite) return;
    const known = new Set(model.state.players.map((p) => p.id));
    model.selected = favorite.players.filter((id) => known.has(id));
    document.querySelectorAll('.choice input[type="checkbox"]').forEach((input) => {
        if (input.id !== "select-all-players") input.checked = model.selected.includes(input.value);
    });
    updateSelectionCount();
}
