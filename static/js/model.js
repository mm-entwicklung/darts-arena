// Shared UI state. Accessors preserve the existing event-handler semantics.
const model = { state: { players: [], game: null }, view: "game", mult: "S", selected: [], editing: null, correcting: null };
for (const key of Object.keys(model)) {
    Object.defineProperty(window, key, { get: () => model[key], set: (value) => { model[key] = value; }, configurable: false });
}
export { model };
