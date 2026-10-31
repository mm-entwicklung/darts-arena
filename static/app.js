import { model } from "./js/model.js";
import { $, esc, player, avatar } from "./js/helpers.js";
import { api } from "./js/api.js";
import { toast, changeView, render } from "./js/ui.js";
import { renderPlayers, savePlayer, removePlayer } from "./js/players.js";
import { renderSetup, updateMode, togglePlayer, startGame } from "./js/setup.js";
import { renderGame, dart, fixDart } from "./js/game.js";
import { openKeyboard, closeKeyboard } from "./js/keyboard.js";

// Inline event handlers in the existing HTML templates use these global names.
// Keep this compatibility layer until event delegation is introduced separately.
Object.assign(window, {
    model,
    api, toast, changeView, render, renderPlayers, savePlayer, removePlayer,
    renderSetup, updateMode, togglePlayer, startGame, renderGame, dart, fixDart,
    openKeyboard, closeKeyboard, $, esc, player, avatar,
});

document.querySelectorAll(".nav").forEach((b) => b.addEventListener("click", () => changeView(b.dataset.view)));
fetch("/api/state")
    .then((r) => r.json())
    .then((v) => {
        model.state = v;
        render();
    })
    .catch(() => toast("Server nicht erreichbar"));

