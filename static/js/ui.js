import { model } from "./model.js";
import { closeKeyboard } from "./keyboard.js";
import { renderGame } from "./game.js";
import { renderPlayers } from "./players.js";
import { renderSetup } from "./setup.js";
import { $ } from "./helpers.js";

export function toast(s) {
    $("toast").textContent = s;
    $("toast").style.display = "block";
    setTimeout(() => ($("toast").style.display = "none"), 3500);
}
export function changeView(v) {
    closeKeyboard();
    model.view = v;
    model.correcting = null;
    render();
}
export function render() {
    closeKeyboard();
    document.querySelectorAll(".nav").forEach((b) => b.classList.toggle("active", b.dataset.view === model.view));
    $("heading").textContent = { game: "Spielübersicht", players: "Spielerverwaltung", setup: "Neues Spiel" }[model.view];
    $("content").innerHTML = { game: renderGame, players: renderPlayers, setup: renderSetup }[model.view]();
}
