import { model } from "./model.js";
import { render, toast } from "./ui.js";

export async function api(path, data = {}) {
    try {
        let r = await fetch("/api/" + path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }),
            v = await r.json();
        if (!r.ok) throw Error(v.error || "Fehler"); // Reset the scoring multiplier only when a new turn or game begins.
        const previousGame = model.state.game;
        const nextGame = v.game;
        const turnChanged =
            previousGame &&
            nextGame &&
            (previousGame.turn !== nextGame.turn ||
                previousGame.players[previousGame.turn] !== nextGame.players[nextGame.turn]);
        if (path === "next" || path === "start" || path === "reset" || turnChanged) {
            model.mult = "S";
            model.correcting = null;
        }
        model.state = v;
        render();
    } catch (e) {
        toast(e.message);
    }
}
