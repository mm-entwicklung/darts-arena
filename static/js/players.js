import { model } from "./model.js";
import { $, esc, player, avatar } from "./helpers.js";
import { api } from "./api.js";
import { closeKeyboard } from "./keyboard.js";
import { render, toast } from "./ui.js";

export function renderPlayers() {
    return `<div class="two"><section class="panel"><h2>${model.editing ? "Spieler bearbeiten" : "Neuen Spieler anlegen"}</h2><p class="mini player-capacity">${model.state.players.length} / 32 Spieler erstellt</p><div class="field"><label>Spielername</label><input id="pname" maxlength="50" autocomplete="off" onfocus="openKeyboard()" onclick="openKeyboard()" placeholder="z. B. Max Mustermann" value="${esc(model.editing ? player(model.editing).name : "")}"></div><div class="field"><label>Avatar (PNG, JPG oder WebP, max. ca. 1 MB)</label><input id="pavatar" type="file" accept="image/png,image/jpeg,image/webp"></div><div class="flex"><button class="primary" onclick="savePlayer()">${model.editing ? "Speichern" : "Spieler hinzufügen"}</button>${model.editing ? '<button onclick="model.editing=null,model.correcting=null;render()">Abbrechen</button>' : ""}</div></section><section class="panel"><h2>Spielerprofile</h2>${model.state.players.length ? model.state.players.map((p, i) => `<div class="playerrow"><div class="name"><span class="player-number">${i + 1}.</span> ${avatar(p)} ${esc(p.name)}</div><div class="flex"><button onclick="model.editing='${p.id}';render()">Bearbeiten</button><button class="danger" onclick="removePlayer('${p.id}')">×</button></div></div>`).join("") : '<p class="muted">Noch keine Spieler angelegt.</p>'}</section></div>`;
}
export async function savePlayer() {
    closeKeyboard();
    let name = $("pname").value.trim(),
        file = $("pavatar").files[0];
    if (!name) return toast("Bitte Namen eingeben");
    let avatar = model.editing ? player(model.editing).avatar : "";
    if (file) {
        if (file.size > 1000000) return toast("Bild zu groß (maximal 1 MB)");
        avatar = await new Promise((resolve, reject) => {
            let r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }
    let id = model.editing;
    ((model.editing = null), (model.correcting = null));
    await api("player", { id, name, avatar });
}
export function removePlayer(id) {
    if (confirm("Spieler wirklich löschen?")) api("delete", { id });
}
