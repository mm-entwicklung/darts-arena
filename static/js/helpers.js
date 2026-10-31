import { model } from "./model.js";
export const $ = (id) => document.getElementById(id);
export const esc = (s) =>
    String(s ?? "").replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
export const player = (id) => model.state.players.find((p) => p.id === id) || { name: "Unbekannt", avatar: "" };
export function avatar(p, cls = "") {
    return p.avatar
        ? `<img class="avatar ${cls}" src="${p.avatar}" alt="">`
        : `<span class="avatar ${cls}">${esc((p.name || "?")[0].toUpperCase())}</span>`;
}
