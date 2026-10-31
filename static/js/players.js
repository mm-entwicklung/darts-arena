import { model } from "./model.js";
import { $, esc, player, avatar } from "./helpers.js";
import { api } from "./api.js";
import { closeKeyboard } from "./keyboard.js";
import { render, toast } from "./ui.js";
import { renderFavoritesManager } from "./favorites.js";

export function toggleAvatarRemoval() {
    const button = $("remove-avatar");
    const preview = $("avatar-preview");
    if (!button || !preview) return;

    const removing = button.dataset.removing !== "true";
    button.dataset.removing = String(removing);
    button.textContent = removing ? "Rückgängig" : "Entfernen";
    button.classList.toggle("danger", !removing);
    button.setAttribute("aria-pressed", String(removing));
    preview.classList.toggle("avatar-pending-removal", removing);
    const status = $("avatar-status");
    if (status) status.textContent = removing
        ? "Avatar wird beim Speichern entfernt."
        : "Aktuelles Avatarbild";
    if (removing) $("pavatar").value = "";
}

export function onAvatarFileChange() {
    const button = $("remove-avatar");
    if (button?.dataset.removing === "true") toggleAvatarRemoval();
}

export function renderPlayers() {
    return `<div class="two"><section class="panel"><h2>${model.editing ? "Spieler bearbeiten" : "Neuen Spieler anlegen"}</h2><p class="mini player-capacity">${model.state.players.length} / 32 Spieler erstellt</p><div class="field"><label>Spielername</label><input id="pname" maxlength="50" autocomplete="off" onfocus="openKeyboard()" onclick="openKeyboard()" placeholder="z. B. Max Mustermann" value="${esc(model.editing ? player(model.editing).name : "")}"></div>${model.editing && player(model.editing).avatar ? `<div class="avatar-editor"><div id="avatar-preview" class="avatar-editor-preview">${avatar(player(model.editing))}</div><div class="avatar-editor-info"><strong id="avatar-status">Aktuelles Avatarbild</strong><span>Änderungen werden erst beim Speichern übernommen.</span></div><button id="remove-avatar" class="danger avatar-remove-button" type="button" data-removing="false" aria-pressed="false" onclick="toggleAvatarRemoval()">Entfernen</button></div>` : ""}<div class="field"><label for="pavatar">${model.editing ? "Neues Avatarbild auswählen" : "Avatar auswählen"} (JPG, PNG, WebP oder HEIC, Original max. 25 MB)</label><input id="pavatar" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif" onchange="onAvatarFileChange()"></div><div class="flex"><button class="primary" onclick="savePlayer()">${model.editing ? "Speichern" : "Spieler hinzufügen"}</button>${model.editing ? '<button onclick="model.editing=null,model.correcting=null;render()">Abbrechen</button>' : ""}</div></section><section class="panel"><h2>Spielerprofile</h2>${model.state.players.length ? model.state.players.map((p, i) => `<div class="playerrow"><div class="name"><span class="player-number">${i + 1}.</span> ${avatar(p)} ${esc(p.name)}</div><div class="flex"><button onclick="model.editing='${p.id}';render()">Bearbeiten</button><button class="danger" onclick="removePlayer('${p.id}')">×</button></div></div>`).join("") : '<p class="muted">Noch keine Spieler angelegt.</p>'}</section></div>${renderFavoritesManager()}`;
}
export async function savePlayer() {
    closeKeyboard();
    let name = $("pname").value.trim(),
        file = $("pavatar").files[0];
    if (!name) return toast("Bitte Namen eingeben");
    const removeAvatar = Boolean(model.editing && $("remove-avatar")?.dataset.removing === "true");
    let avatar = removeAvatar ? "" : (model.editing ? player(model.editing).avatar : "");
    if (file) {
        if (file.size > 25 * 1024 * 1024) return toast("Originalbild zu groß (maximal 25 MB)");
        try {
            const image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const response = await fetch("/api/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Bildverarbeitung fehlgeschlagen");
            avatar = result.avatar;
        } catch (error) {
            return toast(error.message || "Bild konnte nicht verarbeitet werden");
        }
    }
    let id = model.editing;
    ((model.editing = null), (model.correcting = null));
    await api("player", { id, name, avatar });
}
export function removePlayer(id) {
    if (confirm("Spieler wirklich löschen?")) api("delete", { id });
}
