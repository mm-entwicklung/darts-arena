// Darts Arena offline caller: predecoded hit effect + serialized speech.
let speech = null;
let hitSource = null;
let audioContext = null;
let hitBufferPromise = null;
let sequence = 0;
const sound = name => `/sounds/${encodeURIComponent(name)}.wav`;

function getContext() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    if (!audioContext) audioContext = new Context();
    return audioContext;
}

function loadHit() {
    const ctx = getContext();
    if (!ctx) return Promise.resolve(null);
    if (!hitBufferPromise) {
        hitBufferPromise = fetch(sound('Hit_3'))
            .then(response => { if (!response.ok) throw new Error('Hit-Sound nicht gefunden'); return response.arrayBuffer(); })
            .then(bytes => ctx.decodeAudioData(bytes))
            .catch(error => { console.warn('Caller Hit-Sound:', error); hitBufferPromise = null; return null; });
    }
    return hitBufferPromise;
}

// Start loading early; the context is resumed by the first user interaction.
if (typeof window !== 'undefined') loadHit();

export function stopCaller() {
    ++sequence;
    if (speech) {
        speech.pause();
        speech.currentTime = 0;
        speech = null;
    }
    if (hitSource) {
        try { hitSource.stop(); } catch (_) { /* already stopped */ }
        hitSource = null;
    }
}

function playSpeech(name, token = sequence) {
    if (token !== sequence) return;
    if (speech) { speech.pause(); speech.currentTime = 0; }
    const audio = new Audio(sound(name));
    speech = audio;
    const clear = () => { if (speech === audio) speech = null; };
    audio.addEventListener('ended', clear, { once: true });
    audio.addEventListener('error', clear, { once: true });
    audio.play().catch(clear);
}

async function playHitThen(speechName = null) {
    stopCaller();
    const token = sequence;
    const ctx = getContext();
    try {
        if (ctx) {
            await ctx.resume();
            const buffer = await loadHit();
            if (token !== sequence) return;
            if (buffer) {
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                hitSource = source;
                source.start(0);
                if (speechName) {
                    source.onended = () => {
                        if (hitSource === source) hitSource = null;
                        if (token === sequence) playSpeech(speechName, token);
                    };
                } else {
                    source.onended = () => { if (hitSource === source) hitSource = null; };
                }
                return;
            }
        }
    } catch (error) { console.warn('Caller audio:', error); }
    // Fallback: speech must not disappear if hit playback is unavailable.
    if (speechName && token === sequence) playSpeech(speechName, token);
}

function scoreForVisit(g) {
    if (!g || g.mode !== 'x01' || !g.darts?.length) return null;
    if (g.bust) return 0;
    const id = g.players[g.turn];
    const points = Number(g.turn_start) - Number(g.scores[id]);
    return Number.isInteger(points) && points >= 0 && points <= 180 ? points : null;
}

function visitName(g) {
    const score = scoreForVisit(g);
    return score === null ? null : score === 180 ? 'an_180v2' : `an_${score}`;
}

function winName(g) {
    if (g.match_winner) return 'gsm';
    if ((g.leg_wins?.[g.winner] || 0) >= (g.legs_target || 1)) return 'gls_1';
    return 'gl_1';
}

export function handleCallerAction(path, before, after, data = {}) {
    if (['start', 'reset', 'rematch', 'advance_leg'].includes(path)) { stopCaller(); return; }
    if (!after || !before) return;
    if (path === 'correct') {
        stopCaller();
        if (after.winner) playSpeech(winName(after));
        else if (after.mode === 'x01' && (after.bust || after.darts?.length === 3)) {
            const name = visitName(after);
            if (name) playSpeech(name);
        }
        // Corrections intentionally do not replay hit effects.
        return;
    }
    if (path === 'throw') {
        if (after.mode === 'x01') {
            const name = after.winner ? winName(after) :
                (after.bust || after.darts?.length === 3 ? visitName(after) : null);
            playHitThen(name);
        } else if (after.mode === 'cricket') {
            const hit = after.darts?.at(-1) !== 'MISS';
            if (hit) playHitThen(after.winner ? winName(after) : null);
            else if (after.winner) { stopCaller(); playSpeech(winName(after)); }
        }
        return;
    }
    if (path === 'next' && before.mode === 'x01' && !before.bust && before.darts?.length && before.darts.length < 3) {
        stopCaller();
        const name = visitName(before);
        if (name) playSpeech(name);
    }
}
