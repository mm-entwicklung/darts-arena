import { model } from "./model.js";
import {renderTraining} from "./training.js";
import { esc, avatar, player } from "./helpers.js";
import { api } from "./api.js";
import { changeView, render } from "./ui.js";

export function renderGame() {
    let g = model.state.game;
    if (!g)
        return `<section class="panel empty"><div class="symbol">◎</div><h2>Bereit für die nächste Runde?</h2><p class="muted">Lege Spieler an und starte dein erstes x01- oder Cricket-Spiel.</p><button class="primary" onclick="changeView('setup')">Neues Spiel starten →</button></section>`;
    if (!(["x01","cricket"].includes(g.mode))) return renderTraining(g);
    let current = g.players[g.turn];
    let finished = !!g.winner;
    const matchFinished = !!g.match_winner;
    const matchActive = (g.legs_target || 1) > 1 || (g.sets_target || 1) > 1;
    const cricket = g.mode === "cricket";
    const fields = [20, 19, 18, 17, 16, 15, 25];
    const markIcon = (count) => {
        const n = Math.min(3, Math.max(0, Number(count) || 0));
        if (!n) return '<span class="cricket-empty">–</span>';
        return `<svg class="cricket-mark-icon" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M11 29 L29 11" />
            ${n >= 2 ? '<path d="M11 11 L29 29" />' : ''}
            ${n >= 3 ? '<circle cx="20" cy="20" r="17" />' : ''}
        </svg>`;
    };
    const cricketHeading = cricket
        ? `<div class="cricket-roster-head" aria-hidden="true"><span></span>${fields.map(n => `<span>${n === 25 ? "Bull" : n}</span>`).join("")}<span>Pkt.</span></div>`
        : "";
    let scorecards = `<section class="panel roster-panel ${cricket ? "cricket-roster" : ""}" aria-label="Spielstände">
        <div class="roster-heading"><h2>Spielstände</h2><button class="help-icon" onclick="openHelp('${g.mode}','game')">? Hilfe</button><span class="mini">${g.players.length} Spieler · Set ${g.set_number || 1}, Leg ${g.leg_number || 1}</span></div>
        ${cricketHeading}
        <div class="roster-list" id="roster-list">${g.players.map((id, i) => `
            <div class="roster-player ${cricket ? "cricket-player" : ""} ${!finished && i === g.turn ? "current" : ""}" data-player-index="${i}" ${!finished && i === g.turn ? 'aria-current="true"' : ""}>
                <span class="roster-position">${i + 1}</span>
                ${avatar(player(id))}
                <span class="roster-name" title="${esc(player(id).name)}">${esc(player(id).name)}</span>
                ${cricket ? fields.map(n => `<span class="cricket-mark" aria-label="${n === 25 ? "Bull" : n}: ${Math.min(3, g.marks?.[id]?.[n] || 0)} Markierungen">${markIcon(g.marks?.[id]?.[n])}</span>`).join("") : ""}
                <strong class="roster-score">${g.scores[id]}</strong>
                ${matchActive ? `<span class="roster-match-score" title="Gewonnene Sets / Legs">${g.set_wins?.[id] || 0} S · ${g.leg_wins?.[id] || 0} L</span>` : ""}
                ${!finished && i === g.turn ? '<span class="roster-active">AM ZUG</span>' : ""}
            </div>`).join("")}</div></section>`;
    // x01: tatsächlicher Punktabzug (Bust und Check-In berücksichtigt).
    // Cricket: Summe der geworfenen Segmentwerte; keine Cricket-Wertung.
    const dartValue = (dart) => {
        const match = /^([SDT])(\d+)$/.exec(dart || "");
        return match ? ({ S: 1, D: 2, T: 3 }[match[1]] * Number(match[2])) : 0;
    };
    const visitPoints = cricket
        ? g.darts.reduce((total, dart) => total + dartValue(dart), 0)
        : Math.max(0, Number(g.turn_start ?? g.start) - Number(g.scores[current]));
    const boardInput = model.inputMode === "board";
    let buttons = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
        .map((n) => `<button onclick="enterDart('${model.mult}${n}')">${n}</button>`)
        .join("");
    const correcting = model.correcting !== null && !!g.darts[model.correcting];
    const correctionControls = correcting ? `<div class="visit-correction" role="status"><div class="visit-correction-text"><strong>Dart ${model.correcting + 1} korrigieren</strong><span>Treffer oben oder auf der Dartscheibe wählen.</span></div><button class="cancel-correction" onclick="cancelDartCorrection()">Abbrechen</button></div>` : "";
    return `
        <div class="game-layout ${cricket ? "cricket-layout" : ""}" ${model.inputMode === "board" && model.keyLayoutHeight ? `style="min-height:${model.keyLayoutHeight}px"` : ""}>
            ${scorecards}
            <section class="panel board-panel"><div class="board-heading"><h2>Dartscheibe</h2><span class="board-mode">${g.mode === "x01" ? `${g.start} · ${esc(g.checkin || "straight")} in / ${esc(g.out)} out` : `Cricket · ${esc(g.cricket || "")}`}</span></div><div class="board-stage">${renderTargetBoard(g, boardInput && !finished)}</div></section>
            <div class="game-controls ${boardInput ? "board-input-controls" : ""}">
                <section class="panel scoring-panel input-mode-panel"><div class="input-mode-switch" role="group" aria-label="Eingabeart"><button class="${!boardInput ? "primary" : ""}" onclick="setInputMode('keys')">Tasten</button><button class="${boardInput ? "primary" : ""}" onclick="setInputMode('board')">Dartscheibe</button></div>${!boardInput ? `<div class="scoring-heading"><h2>Treffer erfassen</h2></div>${!finished ? `<div class="scoring-turn-banner" aria-live="polite"><span>◎ JETZT AM ZUG</span><strong>${esc(player(current).name)}</strong></div>` : ""}<div class="flex multiplier-buttons">${["S", "D", "T"].map((m) => `<button class="${model.mult === m ? "primary" : ""}" onclick="model.mult='${m}';render()">${{S:"Single",D:"Double",T:"Triple"}[m]}</button>`).join("")}</div><div class="dartboard">${buttons}</div><div class="flex bull-buttons"><button onclick="enterDart('S25')">Bull 25</button><button onclick="enterDart('D25')">Bull 50</button><button onclick="enterDart('MISS')">Miss</button></div>` : `<div class="scoring-heading"><h2>Treffer direkt auf der Dartscheibe wählen</h2></div>${!finished ? `<div class="scoring-turn-banner" aria-live="polite"><span>◎ JETZT AM ZUG</span><strong>${esc(player(current).name)}</strong></div>` : ""}<p class="board-input-help">Freie Fläche außerhalb des Rings = Miss.</p>`}</section>
                <section class="panel visit-panel"><h2>Aktuelle Aufnahme</h2><div class="flex visit-buttons">${[0,1,2].map((i) => `<button class="visit-dart ${model.correcting === i ? "selected" : ""}" ${!g.darts[i] ? "disabled" : ""} onclick="model.correcting=${i};render()" title="Dart ${i+1} korrigieren">${g.darts[i] || "–"}${g.darts[i] ? "<small>✎ Ändern</small>" : '<small class="visit-dart-placeholder" aria-hidden="true">✎ Ändern</small>'}</button>`).join("")}</div>${g.bust ? '<p class="bust-note">BUST – Punktestand zurückgesetzt</p>' : ""}<div class="sectionline"></div><div class="visit-action-slot ${correcting ? "is-correcting" : ""}"><div class="visit-action-default" ${correcting ? "aria-hidden='true' inert" : ""}><div class="flex visit-actions"><button class="primary" onclick="api('next')" ${finished || !g.darts.length || correcting ? "disabled" : ""}>${g.players.length===1?"Nächste Aufnahme":"Nächster Spieler"} →</button><button class="danger" onclick="if(confirm('Spiel beenden?'))api('reset')" ${correcting ? "disabled" : ""}>Spiel beenden</button></div><p class="mini">Nach maximal drei Darts wechseln; auch früher möglich.</p></div>${correctionControls}</div></section>
                <section class="panel board-info-panel"><h2>Aufnahme-Info</h2>${finished ? `<div class="match-result"><strong class="result-title">🏆 ${matchFinished ? "MATCH GEWONNEN" : "LEG GEWONNEN"}</strong><strong class="result-name">${esc(player(g.winner).name)}</strong><p>Set ${g.set_number || 1} · Leg ${g.leg_number || 1}</p>${matchActive ? `<p>${g.players.map(id => `${esc(player(id).name)}: ${g.set_wins?.[id] || 0} Sets / ${g.leg_wins?.[id] || 0} Legs`).join(" · ")}</p>` : ""}<div class="flex result-actions">${matchFinished ? `<button class="primary" onclick="api('rematch')">Revanche</button><button onclick="changeView('setup')">Neues Spiel</button>` : `<button class="primary" onclick="api('advance_leg')">${(g.leg_wins?.[g.winner] || 0) >= (g.legs_target || 1) ? "Nächstes Set starten" : "Nächstes Leg starten"}</button>`}</div></div>` : `<p>Darts: <strong>${g.darts.length} / 3</strong></p><p>${cricket ? "Trefferwert" : "Aufnahmesumme"}: <strong>${visitPoints}</strong>${cricket ? ' <span class="mini">(ohne Cricket-Wertung)</span>' : ""}</p>`}</section>
            </div>
        </div>`;
}

// Das getroffene Ringsegment wird nur nach einem erfolgreichen Wurf animiert.
// Reines Neuzeichnen (z. B. Wechsel von Double zu Single) löst kein Blinken aus.
const BOARD_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const boardPoint = (r, a) => `${(150 + r * Math.cos(a)).toFixed(2)},${(150 + r * Math.sin(a)).toFixed(2)}`;

function ringPath(inner, outer, start, end) {
    return `M${boardPoint(inner,start)} L${boardPoint(outer,start)} A${outer},${outer} 0 0 1 ${boardPoint(outer,end)} L${boardPoint(inner,end)} A${inner},${inner} 0 0 0 ${boardPoint(inner,start)} Z`;
}

export function renderTargetBoard(game, interactive = false) {
    const darts = game.darts || [];
    const flashIndex = model.flashHit;
    model.flashHit = null; // Einmaliges Ereignis, nicht aus dem aktuellen Spielstand ableiten.
    const hits = darts.map((value, index) => {
        const match = /^([SDT])(\d+)$/.exec(value || "");
        if (!match) return null;
        const number = Number(match[2]);
        if (number === 25) {
            const radius = match[1] === "D" ? 0 : 9;
            return { x: 150 + radius * Math.cos(index * 2.1), y: 150 + radius * Math.sin(index * 2.1), value, index };
        }
        const sector = BOARD_NUMBERS.indexOf(number);
        if (sector < 0) return null;
        const angle = (sector * 18 - 90) * Math.PI / 180;
        const radius = match[1] === "D" ? 135 : match[1] === "T" ? 84 : 108;
        const offset = (index - 1) * 2.5;
        return { x: 150 + radius * Math.cos(angle) + offset, y: 150 + radius * Math.sin(angle) + offset, value, index };
    }).filter(Boolean);
    const rings = [
        { key: "S", inner: 13, outer: 77 },
        { key: "T", inner: 77, outer: 91 },
        { key: "S", inner: 91, outer: 127 },
        { key: "D", inner: 127, outer: 140 },
    ];
    const segments = BOARD_NUMBERS.map((number, sector) => {
        const start = (sector * 18 - 99) * Math.PI / 180;
        const end = start + Math.PI / 10;
        const paths = rings.map((ring, ringIndex) => {
            const value = `${ring.key}${number}`;
            const flash = hits.some((hit) => hit.index === flashIndex && hit.value === value);
            const colored = ring.key === "D" || ring.key === "T";
            const fill = colored ? (sector % 2 ? "#188b60" : "#b92d32") : (sector % 2 ? "#d4c6a7" : "#28312e");
            return `<path ${interactive ? `data-dart="${value}"` : ""} class="board-sector ${flash ? "board-hit-sector" : ""}" d="${ringPath(ring.inner, ring.outer, start, end)}" fill="${fill}" stroke="#59635b" stroke-width=".7"/>`;
        }).join("");
        const middle = (start + end) / 2;
        return `${paths}<text x="${(150 + 148 * Math.cos(middle)).toFixed(1)}" y="${(150 + 148 * Math.sin(middle)).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="10" fill="#e9f4ef">${number}</text>`;
    }).join("");
    const flashBull = hits.some((hit) => hit.index === flashIndex && hit.value === "S25");
    const flashDoubleBull = hits.some((hit) => hit.index === flashIndex && hit.value === "D25");
    const markers = hits.map((hit) => `<circle pointer-events="none" class="board-hit-point" cx="${hit.x.toFixed(1)}" cy="${hit.y.toFixed(1)}" r="5" fill="#ffe188" stroke="#0a1713" stroke-width="2"><title>Dart ${hit.index + 1}: ${hit.value}</title></circle>`).join("");
    return `<svg class="target-board ${interactive ? "board-interactive" : ""}" ${interactive ? `onclick="boardTap(event)"` : ""} viewBox="-10 -10 320 320" role="img" aria-label="Dartscheibe mit ${hits.length} schematischen Treffermarkierungen"><rect x="-10" y="-10" width="320" height="320" fill="transparent"/> <circle cx="150" cy="150" r="155" fill="#0a1011"/>${segments}<circle ${interactive ? 'data-dart="S25"' : ""} class="board-sector ${flashBull ? "board-hit-sector" : ""}" cx="150" cy="150" r="13" fill="#1a9b66"/><circle ${interactive ? 'data-dart="D25"' : ""} class="board-sector ${flashDoubleBull ? "board-hit-sector" : ""}" cx="150" cy="150" r="6" fill="#c83a40"/>${markers}</svg>`;
}

export function enterDart(v) {
    if (model.correcting !== null) fixDart(v);
    else dart(v);
}

export function cancelDartCorrection() {
    model.correcting = null;
    render();
}

export function dart(v) {
    api("throw", { dart: v });
}
export function fixDart(v) {
    let index = model.correcting;
    model.correcting = null;
    api("correct", { index, dart: v });
}

export function setInputMode(mode) {
    // Preserve the naturally sized v0.1.7 keyboard layout when its controls are hidden.
    // Do not impose a guessed viewport-height clamp on either mode.
    if (mode === "board" && model.inputMode !== "board") {
        const layout = document.querySelector(".game-layout");
        if (layout) model.keyLayoutHeight = Math.ceil(layout.getBoundingClientRect().height);
    }
    model.inputMode = mode === "board" ? "board" : "keys";
    model.correcting = null;
    render();
}

export function boardTap(event) {
    if (model.inputMode !== "board" || !model.state.game || model.state.game.winner || model.state.game.training_finished) return;
    const svg = event.currentTarget;
    const target = event.target.closest("[data-dart]");
    let value = target?.getAttribute("data-dart");
    if (!value) {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const matrix = svg.getScreenCTM();
        if (!matrix) return;
        const local = point.matrixTransform(matrix.inverse());
        if (Math.hypot(local.x - 150, local.y - 150) < 155) return;
        value = "MISS";
    }
    if (model.correcting !== null) fixDart(value);
    else if ((model.state.game.darts || []).length < 3) dart(value);
}
