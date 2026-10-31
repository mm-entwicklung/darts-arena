let state = { players: [], game: null },
    view = "game",
    mult = "S",
    selected = [],
    editing = null,
    correcting = null;
const $ = (id) => document.getElementById(id),
    esc = (s) =>
        String(s ?? "").replace(
            /[&<>"']/g,
            (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
        );
const player = (id) => state.players.find((p) => p.id === id) || { name: "Unbekannt", avatar: "" };
function avatar(p, cls = "") {
    return p.avatar
        ? `<img class="avatar ${cls}" src="${p.avatar}" alt="">`
        : `<span class="avatar ${cls}">${esc((p.name || "?")[0].toUpperCase())}</span>`;
}
async function api(path, data = {}) {
    try {
        let r = await fetch("/api/" + path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }),
            v = await r.json();
        if (!r.ok) throw Error(v.error || "Fehler"); // Reset the scoring multiplier only when a new turn or game begins.
        const previousGame = state.game;
        const nextGame = v.game;
        const turnChanged =
            previousGame &&
            nextGame &&
            (previousGame.turn !== nextGame.turn ||
                previousGame.players[previousGame.turn] !== nextGame.players[nextGame.turn]);
        if (path === "next" || path === "start" || path === "reset" || turnChanged) {
            mult = "S";
            correcting = null;
        }
        state = v;
        render();
    } catch (e) {
        toast(e.message);
    }
}
function toast(s) {
    $("toast").textContent = s;
    $("toast").style.display = "block";
    setTimeout(() => ($("toast").style.display = "none"), 3500);
}
function changeView(v) {
    closeKeyboard();
    view = v;
    correcting = null;
    render();
}
function render() {
    closeKeyboard();
    document.querySelectorAll(".nav").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $("heading").textContent = { game: "Spielübersicht", players: "Spielerverwaltung", setup: "Neues Spiel" }[view];
    $("content").innerHTML = { game: renderGame, players: renderPlayers, setup: renderSetup }[view]();
}
function renderPlayers() {
    return `<div class="two"><section class="panel"><h2>${editing ? "Spieler bearbeiten" : "Neuen Spieler anlegen"}</h2><div class="field"><label>Spielername</label><input id="pname" maxlength="50" autocomplete="off" onfocus="openKeyboard()" onclick="openKeyboard()" placeholder="z. B. Max Mustermann" value="${esc(editing ? player(editing).name : "")}"></div><div class="field"><label>Avatar (PNG, JPG oder WebP, max. ca. 1 MB)</label><input id="pavatar" type="file" accept="image/png,image/jpeg,image/webp"></div><div class="flex"><button class="primary" onclick="savePlayer()">${editing ? "Speichern" : "Spieler hinzufügen"}</button>${editing ? '<button onclick="editing=null,correcting=null;render()">Abbrechen</button>' : ""}</div><p class="mini">${state.players.length} / 32 Spieler gespeichert</p></section><section class="panel"><h2>Spielerprofile</h2>${state.players.length ? state.players.map((p) => `<div class="playerrow"><div class="name">${avatar(p)} ${esc(p.name)}</div><div class="flex"><button onclick="editing='${p.id}';render()">Bearbeiten</button><button class="danger" onclick="removePlayer('${p.id}')">×</button></div></div>`).join("") : '<p class="muted">Noch keine Spieler angelegt.</p>'}</section></div>`;
}
async function savePlayer() {
    closeKeyboard();
    let name = $("pname").value.trim(),
        file = $("pavatar").files[0];
    if (!name) return toast("Bitte Namen eingeben");
    let avatar = editing ? player(editing).avatar : "";
    if (file) {
        if (file.size > 1000000) return toast("Bild zu groß (maximal 1 MB)");
        avatar = await new Promise((resolve, reject) => {
            let r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }
    let id = editing;
    ((editing = null), (correcting = null));
    await api("player", { id, name, avatar });
}
function removePlayer(id) {
    if (confirm("Spieler wirklich löschen?")) api("delete", { id });
}
function renderSetup() {
    return `<div class="two"><section class="panel"><h2>Spielregeln</h2><div class="field"><label>Spielmodus</label><select id="mode" onchange="updateMode()"><option value="x01">x01</option><option value="cricket">Cricket</option></select></div><div id="rules"><div class="field"><label>Startpunktzahl</label><select id="start">${[301, 501, 701, 901, 1001].map((x) => `<option ${x === 501 ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>Check-In (Spielbeginn)</label><select id="checkin"><option value="straight">Straight In</option><option value="double">Double In</option><option value="master">Master In</option></select></div><div class="field"><label>Checkout</label><select id="out"><option value="double">Double Out</option><option value="single">Single Out</option><option value="master">Master Out</option></select></div></div></section><section class="panel"><h2>Teilnehmer wählen <span class="mini" id="count">(0 ausgewählt)</span></h2>${state.players.length ? state.players.map((p) => `<label class="choice"><input type="checkbox" value="${p.id}" onchange="togglePlayer('${p.id}',this.checked)" ${selected.includes(p.id) ? "checked" : ""}>${avatar(p)} ${esc(p.name)}</label>`).join("") : '<p class="muted">Lege zuerst mindestens zwei Spieler an.</p>'}<div class="sectionline"></div><button class="primary" onclick="startGame()">Spiel starten →</button></section></div>`;
}
function updateMode() {
    let mode = $("mode").value;
    $("rules").innerHTML =
        mode === "x01"
            ? `<div class="field"><label>Startpunktzahl</label><select id="start">${[101, 201, 301, 501, 701, 1001].map((x) => `<option ${x === 501 ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>Check-In (Spielbeginn)</label><select id="checkin"><option value="straight">Straight In</option><option value="double">Double In</option><option value="master">Master In</option></select></div><div class="field"><label>Checkout</label><select id="out"><option value="double">Double Out</option><option value="single">Single Out</option><option value="master">Master Out</option></select></div>`
            : `<div class="field"><label>Cricket-Variante</label><select id="cricket"><option value="standard">Standard Cricket</option><option value="cutthroat">Cut-Throat Cricket</option><option value="noscore">No-Score Cricket</option></select></div>`;
}
function togglePlayer(id, yes) {
    selected = yes ? [...selected.filter((x) => x !== id), id] : selected.filter((x) => x !== id);
    $("count").textContent = `(${selected.length} ausgewählt)`;
}
function startGame() {
    if (selected.length < 2) return toast("Mindestens 2 Spieler auswählen");
    if (state.game && !confirm("Aktuelles Spiel ersetzen?")) return;
    let mode = $("mode").value;
    api("start", {
        players: selected,
        mode,
        start: mode === "x01" ? Number($("start").value) : 501,
        out: mode === "x01" ? $("out").value : "double",
        checkin: mode === "x01" ? $("checkin").value : "straight",
        cricket: mode === "cricket" ? $("cricket").value : "standard",
    });
    view = "game";
}
function renderGame() {
    let g = state.game;
    if (!g)
        return `<section class="panel empty"><div class="symbol">◎</div><h2>Bereit für die nächste Runde?</h2><p class="muted">Lege Spieler an und starte dein erstes x01- oder Cricket-Spiel.</p><button class="primary" onclick="changeView('setup')">Neues Spiel starten →</button></section>`;
    let current = g.players[g.turn],
        finished = !!g.winner,
        scorecards = `<div class="grid">${g.players.map((id, i) => `<div class="scorecard ${!finished && i === g.turn ? "current" : ""}" ${!finished && i === g.turn ? 'aria-current="true"' : ""}><div class="name">${avatar(player(id))}${esc(player(id).name)}</div><div class="score">${g.scores[id]}</div><div class="mini">${g.mode === "x01" ? "RESTPUNKTE" : g.cricket === "cutthroat" ? "STRAFPUNKTE" : "PUNKTE"}</div>${!finished && i === g.turn ? '<div class="active-turn-label">◎ JETZT AM ZUG</div>' : ""}</div>`).join("")}</div>`;
    let marks =
        g.mode === "cricket"
            ? `<section class="panel"><h2>Cricket-Marks</h2><div style="overflow:auto"><table class="marktable"><thead><tr><th>Feld</th>${g.players.map((id) => `<th>${esc(player(id).name)}</th>`).join("")}</tr></thead><tbody>${[20, 19, 18, 17, 16, 15, 25].map((n) => `<tr><th>${n === 25 ? "BULL" : n}</th>${g.players.map((id) => `<td>${"●".repeat(g.marks[id][n]) || "–"}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`
            : "";
    let buttons = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
        .map((n) => `<button onclick="dart('${mult}${n}')">${n}</button>`)
        .join("");
    return `${finished ? `<section class="panel"><h2>🏆 Sieger: ${esc(player(g.winner).name)}</h2><button class="primary" onclick="changeView('setup')">Neues Spiel</button></section>` : ""}${scorecards}<div class="two" style="margin-top:20px"><section class="panel"><h2>Treffer erfassen</h2>${!finished ? `<div class="scoring-turn-banner" aria-live="polite"><span>◎ JETZT AM ZUG</span><strong>${esc(player(current).name)}</strong></div>` : ""}<div class="flex" style="margin-bottom:15px">${["S", "D", "T"].map((m) => `<button class="${mult === m ? "primary" : ""}" onclick="mult='${m}';render()">${{ S: "Single", D: "Double", T: "Triple" }[m]}</button>`).join("")}</div><div class="dartboard">${buttons}</div><div class="flex" style="margin-top:15px"><button onclick="dart('S25')">Bull 25</button><button onclick="dart('D25')">Bull 50</button><button onclick="dart('MISS')">Miss</button></div></section><section class="panel"><h2>Aktuelle Aufnahme</h2><p class="muted">${esc(player(current).name)} · ${g.mode === "x01" ? g.start + " · " + (g.checkin || "straight") + " in / " + g.out + " out" : g.cricket}</p><div class="flex">${[0, 1, 2].map((i) => `<button class="visit-dart ${correcting === i ? "selected" : ""}" ${!g.darts[i] ? "disabled" : ""} onclick="correcting=${i};render()" title="Dart ${i + 1} korrigieren">${g.darts[i] || "–"}${g.darts[i] ? "<small>✎ Ändern</small>" : ""}</button>`).join("")}</div>${correcting !== null && g.darts[correcting] ? `<div class="correction"><strong>Dart ${correcting + 1} korrigieren</strong><p class="mini">Wähle Single / Double / Triple und danach das Feld.</p><div class="flex">${["S", "D", "T"].map((m) => `<button class="${mult === m ? "primary" : ""}" onclick="mult='${m}';render()">${m}</button>`).join("")}</div><div class="dartboard">${[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => `<button onclick="fixDart('${mult}${n}')">${n}</button>`).join("")}</div><div class="flex"><button onclick="fixDart('S25')">Bull 25</button><button onclick="fixDart('D25')">Bull 50</button><button onclick="fixDart('MISS')">MISS</button><button onclick="correcting=null;render()">Abbrechen</button></div></div>` : ""}${g.bust ? '<p style="color:#ff9292">BUST – Punktestand zurückgesetzt</p>' : ""}<div class="sectionline"></div><div class="flex"><button class="primary" onclick="api('next')" ${finished || !g.darts.length ? "disabled" : ""}>Nächster Spieler →</button><button class="danger" onclick="if(confirm('Spiel beenden?'))api('reset')">Spiel beenden</button></div><p class="mini">Nach maximal drei Darts zum nächsten Spieler wechseln. Die Aufnahme kann auch vorher beendet werden.</p></section></div>${marks}`;
}
function dart(v) {
    api("throw", { dart: v });
}
function fixDart(v) {
    let index = correcting;
    correcting = null;
    api("correct", { index, dart: v });
}
document.querySelectorAll(".nav").forEach((b) => b.addEventListener("click", () => changeView(b.dataset.view)));
fetch("/api/state")
    .then((r) => r.json())
    .then((v) => {
        state = v;
        render();
    })
    .catch(() => toast("Server nicht erreichbar"));

// Touch keyboard: a reusable, accessible QWERTZ input layer.
// The physical keyboard continues to work; no native Windows keyboard is required.
let keyboardTarget = null,
    keyboardShift = true,
    keyboardNumbers = false;
const keyboardRows = {
    letters: ["qwertzuiop", "asdfghjkl", "yxcvbnm"],
    numbers: ["1234567890", "@#€%&-+()/", ".,:;!?_ß"],
};
function openKeyboard() {
    const input = $("pname");
    if (!input) return;
    keyboardTarget = input;
    if (!$("touch-keyboard")) {
        const el = document.createElement("div");
        el.id = "touch-keyboard";
        el.className = "touch-keyboard";
        el.setAttribute("role", "group");
        el.setAttribute("aria-label", "Bildschirmtastatur");
        document.body.appendChild(el);
    }
    drawKeyboard();
}
function closeKeyboard() {
    keyboardTarget = null;
    const el = $("touch-keyboard");
    if (el) el.remove();
    keyboardShift = true;
    keyboardNumbers = false;
}
function keyboardPress(key) {
    const input = keyboardTarget;
    if (!input || !document.body.contains(input)) {
        closeKeyboard();
        return;
    }
    if (key === "done") {
        closeKeyboard();
        return;
    }
    if (key === "shift") {
        keyboardShift = !keyboardShift;
        drawKeyboard();
        return;
    }
    if (key === "mode") {
        keyboardNumbers = !keyboardNumbers;
        drawKeyboard();
        return;
    }
    const start = input.selectionStart ?? input.value.length,
        end = input.selectionEnd ?? start;
    let text = key === "space" ? " " : key;
    if (key === "backspace") {
        if (start === end && start === 0) return;
        const from = start === end ? start - 1 : start;
        input.setRangeText("", from, end, "end");
    } else {
        if (input.value.length - (end - start) + text.length > 50) return;
        input.setRangeText(text, start, end, "end");
        if (!keyboardNumbers && keyboardShift) {
            keyboardShift = false;
            drawKeyboard();
        }
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
}
function drawKeyboard() {
    const el = $("touch-keyboard");
    if (!el) return;
    const rows = keyboardNumbers ? keyboardRows.numbers : keyboardRows.letters;
    const key = (label, value, extra = "") =>
        `<button type="button" class="kb-key ${extra}" data-key="${esc(value)}" aria-label="${esc(label)}">${esc(label)}</button>`;
    el.innerHTML =
        `<div class="kb-header"><span>⌨ Bildschirmtastatur</span>${key("Schließen", "done", "kb-action")}</div>` +
        rows
            .map(
                (line) =>
                    `<div class="kb-row">${[...line].map((c) => key(keyboardShift && !keyboardNumbers ? c.toUpperCase() : c, keyboardShift && !keyboardNumbers ? c.toUpperCase() : c)).join("")}</div>`,
            )
            .join("") +
        `<div class="kb-row kb-special">${key(keyboardNumbers ? "ABC" : "123", "mode", "kb-action")}${key("⇧", "shift", "kb-action")}${key("ä", "ä")}${key("ö", "ö")}${key("ü", "ü")}${key("ß", "ß")}${key("Leerzeichen", "space", "kb-space")}${key("⌫", "backspace", "kb-action")}${key("Fertig", "done", "kb-done")}</div>`;
    // Prevent focus loss so selection/caret remains where the user placed it.
    el.querySelectorAll("button").forEach((b) => {
        b.addEventListener("pointerdown", (e) => e.preventDefault());
        b.addEventListener("click", () => keyboardPress(b.dataset.key));
    });
}
