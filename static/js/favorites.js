import { model } from "./model.js";
import { $, esc } from "./helpers.js";
import { api } from "./api.js";
import { toast } from "./ui.js";

let editingFavorite = null;

export function renderFavoritesManager() {
    const favorites = model.state.favorites || [];
    const players = model.state.players;
    const options = players.map((p) =>
        `<label class="choice"><input type="checkbox" class="favorite-member" value="${p.id}"> ${esc(p.name)}</label>`
    ).join("");
    const entries = favorites.map((f) => `
        <div class="favorite-entry">
            <span><strong>${esc(f.name)}</strong> <small>(${f.players.length} Spieler)</small></span>
            <span class="flex">
                <button type="button" onclick="editFavorite('${f.id}')">Bearbeiten</button>
                <button type="button" class="danger" onclick="deleteFavorite('${f.id}')">×</button>
            </span>
        </div>`).join("");
    return `<section class="panel favorites-panel">
        <h2>Favoritenlisten</h2>
        <p class="mini">Benannte Listen für Familie, Dartclub oder Turniere. Spieler dürfen in mehreren Listen vorkommen.</p>
        <div class="field"><label>Listenname</label><input id="favorite-name" maxlength="50" placeholder="z. B. Dartclub"></div>
        <div class="favorite-members">${options || '<p class="muted">Noch keine Spieler vorhanden.</p>'}</div>
        <div class="flex">
            <button class="primary" type="button" onclick="saveFavorite()">Liste speichern</button>
            <button type="button" onclick="clearFavoriteEditor()">Neue Liste</button>
        </div>
        <div class="sectionline"></div>
        ${entries || '<p class="muted">Noch keine Favoritenlisten vorhanden.</p>'}
    </section>`;
}

export function editFavorite(id) {
    const favorite = (model.state.favorites || []).find((f) => f.id === id);
    if (!favorite) return;
    editingFavorite = id;
    $("favorite-name").value = favorite.name;
    document.querySelectorAll(".favorite-member").forEach((input) => {
        input.checked = favorite.players.includes(input.value);
    });
}

export function clearFavoriteEditor() {
    editingFavorite = null;
    $("favorite-name").value = "";
    document.querySelectorAll(".favorite-member").forEach((input) => { input.checked = false; });
}

export async function saveFavorite() {
    const name = $("favorite-name").value.trim();
    if (!name) return toast("Bitte einen Listennamen eingeben");
    const players = [...document.querySelectorAll(".favorite-member:checked")].map((input) => input.value);
    const id = editingFavorite;
    editingFavorite = null;
    await api("favorites", { id, name, players });
}

export function deleteFavorite(id) {
    if (confirm("Favoritenliste wirklich löschen? Die Spieler bleiben erhalten.")) {
        if (editingFavorite === id) editingFavorite = null;
        api("favorites_delete", { id });
    }
}
