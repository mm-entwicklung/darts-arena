import { model } from "./js/model.js";
import { $, esc, player, avatar } from "./js/helpers.js";
import { api } from "./js/api.js";
import { toast, changeView, render } from "./js/ui.js";
import { renderPlayers, savePlayer, removePlayer, toggleAvatarRemoval, onAvatarFileChange, fillTestPlayers } from "./js/players.js";
import { renderSetup, updateMode, togglePlayer, toggleAllPlayers, selectFavorite, startGame } from "./js/setup.js";
import { editFavorite, clearFavoriteEditor, saveFavorite, deleteFavorite } from "./js/favorites.js";
import { renderGame, dart, enterDart, cancelDartCorrection, fixDart, setInputMode, boardTap } from "./js/game.js";
import { openKeyboard, closeKeyboard } from "./js/keyboard.js";

// Inline event handlers in the existing HTML templates use these global names.
// Keep this compatibility layer until event delegation is introduced separately.
Object.assign(window, {
    model,
    api, toast, changeView, render, renderPlayers, savePlayer, removePlayer, toggleAvatarRemoval, onAvatarFileChange, fillTestPlayers,
    renderSetup, updateMode, togglePlayer, toggleAllPlayers, selectFavorite, startGame, renderGame, dart, enterDart, cancelDartCorrection, fixDart, setInputMode, boardTap,
    editFavorite, clearFavoriteEditor, saveFavorite, deleteFavorite,
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

