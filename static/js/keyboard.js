import { $, esc } from "./helpers.js";

// Touch keyboard: a reusable, accessible QWERTZ input layer.
// The physical keyboard continues to work; no native Windows keyboard is required.
let keyboardTarget = null,
    keyboardShift = true,
    keyboardNumbers = false;
const keyboardRows = {
    letters: ["qwertzuiop", "asdfghjkl", "yxcvbnm"],
    numbers: ["1234567890", "@#€%&-+()/", ".,:;!?_ß"],
};
export function openKeyboard() {
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
export function closeKeyboard() {
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
