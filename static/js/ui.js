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
    document.body.classList.toggle("game-in-progress", model.view === "game" && Boolean(model.state.game));
    $("heading").textContent = { game: "Spielübersicht", players: "Spielerverwaltung", setup: "Neues Spiel" }[model.view];
    const roster = document.getElementById("roster-list");
    const oldScroll = roster ? roster.scrollTop : 0;
    const oldActive = roster?.querySelector("[aria-current=true]")?.dataset.playerIndex;
    $("content").innerHTML = { game: renderGame, players: renderPlayers, setup: renderSetup }[model.view]();
    if (model.view === "game") {
        const nextRoster = document.getElementById("roster-list");
        if (nextRoster) {
            const active = nextRoster.querySelector("[aria-current=true]");
            if (active && active.dataset.playerIndex !== oldActive) {
                // Center the active player in the internal list without moving the page.
                nextRoster.scrollTop = Math.max(0, active.offsetTop - nextRoster.offsetTop - nextRoster.clientHeight / 2);
            } else {
                nextRoster.scrollTop = oldScroll;
            }
        }
    }
}
