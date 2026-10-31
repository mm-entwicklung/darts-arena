import { model } from "./model.js";
import { esc, avatar, player } from "./helpers.js";
import { api } from "./api.js";
import { changeView, render } from "./ui.js";

export function renderGame() {
    let g = model.state.game;
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
        .map((n) => `<button onclick="dart('${model.mult}${n}')">${n}</button>`)
        .join("");
    return `${finished ? `<section class="panel"><h2>🏆 Sieger: ${esc(player(g.winner).name)}</h2><button class="primary" onclick="changeView('setup')">Neues Spiel</button></section>` : ""}${scorecards}<div class="two" style="margin-top:20px"><section class="panel"><h2>Treffer erfassen</h2>${!finished ? `<div class="scoring-turn-banner" aria-live="polite"><span>◎ JETZT AM ZUG</span><strong>${esc(player(current).name)}</strong></div>` : ""}<div class="flex" style="margin-bottom:15px">${["S", "D", "T"].map((m) => `<button class="${model.mult === m ? "primary" : ""}" onclick="model.mult='${m}';render()">${{ S: "Single", D: "Double", T: "Triple" }[m]}</button>`).join("")}</div><div class="dartboard">${buttons}</div><div class="flex" style="margin-top:15px"><button onclick="dart('S25')">Bull 25</button><button onclick="dart('D25')">Bull 50</button><button onclick="dart('MISS')">Miss</button></div></section><section class="panel"><h2>Aktuelle Aufnahme</h2><p class="muted">${esc(player(current).name)} · ${g.mode === "x01" ? g.start + " · " + (g.checkin || "straight") + " in / " + g.out + " out" : g.cricket}</p><div class="flex">${[0, 1, 2].map((i) => `<button class="visit-dart ${model.correcting === i ? "model.selected" : ""}" ${!g.darts[i] ? "disabled" : ""} onclick="model.correcting=${i};render()" title="Dart ${i + 1} korrigieren">${g.darts[i] || "–"}${g.darts[i] ? "<small>✎ Ändern</small>" : ""}</button>`).join("")}</div>${model.correcting !== null && g.darts[model.correcting] ? `<div class="correction"><strong>Dart ${model.correcting + 1} korrigieren</strong><p class="mini">Wähle Single / Double / Triple und danach das Feld.</p><div class="flex">${["S", "D", "T"].map((m) => `<button class="${model.mult === m ? "primary" : ""}" onclick="model.mult='${m}';render()">${m}</button>`).join("")}</div><div class="dartboard">${[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => `<button onclick="fixDart('${model.mult}${n}')">${n}</button>`).join("")}</div><div class="flex"><button onclick="fixDart('S25')">Bull 25</button><button onclick="fixDart('D25')">Bull 50</button><button onclick="fixDart('MISS')">MISS</button><button onclick="model.correcting=null;render()">Abbrechen</button></div></div>` : ""}${g.bust ? '<p style="color:#ff9292">BUST – Punktestand zurückgesetzt</p>' : ""}<div class="sectionline"></div><div class="flex"><button class="primary" onclick="api('next')" ${finished || !g.darts.length ? "disabled" : ""}>Nächster Spieler →</button><button class="danger" onclick="if(confirm('Spiel beenden?'))api('reset')">Spiel beenden</button></div><p class="mini">Nach maximal drei Darts zum nächsten Spieler wechseln. Die Aufnahme kann auch vorher beendet werden.</p></section></div>${marks}`;
}
export function dart(v) {
    api("throw", { dart: v });
}
export function fixDart(v) {
    let index = model.correcting;
    model.correcting = null;
    api("correct", { index, dart: v });
}
