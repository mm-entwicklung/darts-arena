import { $, esc } from "./helpers.js";

// Touch keyboard: a reusable, accessible QWERTZ input layer.
// The physical keyboard continues to work; no native Windows keyboard is required.
let keyboardTarget = null,
    keyboardShift = true;
const keyboardRows = ["1234567890", "qwertzuiop", "asdfghjklä", "yxcvbnmöüß"];
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
        if (keyboardShift && /^[a-zäöüß]$/i.test(text)) {
            keyboardShift = false;
            drawKeyboard();
        }
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
}
function drawKeyboard() {
    const el = $("touch-keyboard");
    if (!el) return;
    const key = (label, value, extra = "") =>
        `<button type="button" class="kb-key ${extra}" data-key="${esc(value)}" aria-label="${esc(label)}">${esc(label)}</button>`;

    const letter = (character) =>
        keyboardShift && character !== "ß" ? character.toLocaleUpperCase("de-DE") : character;

    const mainRows = keyboardRows
        .map((line, index) => {
            const buttons = [...line]
                .map((character) => {
                    const value = index === 0 ? character : letter(character);
                    return key(value, value);
                })
                .join("");
            return `<div class="kb-row kb-main-row">${buttons}</div>`;
        })
        .join("");

    const specialRow = [
        key("⇧", "shift", `kb-action ${keyboardShift ? "kb-active" : ""}`),
        key("-", "-"),
        key("'", "'"),
        key(".", "."),
        key("_", "_"),
        key("Leerzeichen", "space", "kb-space"),
        key("⌫", "backspace", "kb-action"),
        key("Fertig", "done", "kb-done"),
    ].join("");

    el.innerHTML =
        `<div class="kb-header"><span>⌨ Bildschirmtastatur</span>${key("Schließen", "done", "kb-action")}</div>` +
        mainRows +
        `<div class="kb-row kb-special">${specialRow}</div>`;

    // Prevent focus loss so selection/caret remains where the user placed it.
    el.querySelectorAll("button").forEach((b) => {
        b.addEventListener("pointerdown", (e) => e.preventDefault());
        b.addEventListener("click", () => {
            const pressedKey = b.dataset.key;
            keyboardPress(pressedKey);
            // Redrawing the keyboard (e.g. after Shift) replaces its buttons.
            // Highlight the current matching button for a short, visible confirmation.
            const current = [...(el.querySelectorAll("button") || [])]
                .find((button) => button.dataset.key === pressedKey);
            if (current) {
                current.classList.add("kb-pressed");
                window.setTimeout(() => current.classList.remove("kb-pressed"), 150);
            }
        });
    });
}
