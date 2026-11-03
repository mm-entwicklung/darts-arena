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

// A target announcement is composed of the short "you require" prefix and
// the existing numeric recording. No other caller announcements are changed.
function playSpeechParts(names, token = sequence) {
    if (token !== sequence || !names?.length) return;
    if (speech) { speech.pause(); speech.currentTime = 0; speech = null; }
    let index = 0;
    const next = () => {
        if (token !== sequence || index >= names.length) return;
        const audio = new Audio(sound(names[index++]));
        speech = audio;
        audio.addEventListener('ended', () => {
            if (speech === audio) speech = null;
            if (token === sequence) next();
        }, { once: true });
        audio.addEventListener('error', () => {
            console.warn('Caller Sprachdatei nicht gefunden:', audio.src);
            if (speech === audio) speech = null;
            if (token === sequence) next();
        }, { once: true });
        audio.play().catch(error => {
            console.warn('Caller Sprachwiedergabe:', error);
            if (speech === audio) speech = null;
        });
    };
    next();
}

function playSpeech(name, token = sequence) {
    if (name) playSpeechParts(Array.isArray(name) ? name : [name], token);
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

// The training caller only uses existing numeric WAV files. Double/Triple
// announcements remain a separate future feature.
const TRAINING = new Set(['clock', 'random_clock', 'bobs27', 'shanghai', 'bull', 'scoring']);
const numericSpeech = value => Number.isInteger(value) && value >= 0 && value <= 180
    ? (value === 180 ? 'an_180v2' : `an_${value}`) : null;

function activeTraining(g) {
    if (!g || !TRAINING.has(g.mode)) return null;
    const id = g.players?.[g.turn];
    return id === undefined ? null : g.training?.[id] || null;
}

function trainingTarget(g) {
    const t = activeTraining(g);
    if (!t || t.done) return null;
    const progress = t.progress;
    if (g.mode === 'clock' || g.mode === 'random_clock')
        return g.target_order?.[Math.min(progress, 20)] ?? null;
    if (g.mode === 'bobs27') return progress < 20 ? progress + 1 : 25;
    if (g.mode === 'shanghai') return progress < 7 ? progress + 1 : null;
    return null;
}

function dartPoints(dart) {
    if (dart === 'MISS') return 0;
    const match = /^([SDT])(\d{1,2})$/.exec(dart || '');
    if (!match) return 0;
    return ({S: 1, D: 2, T: 3}[match[1]] || 0) * Number(match[2]);
}

function trainingVisitSpeech(g) {
    if (!g?.darts?.length) return null;
    const score = g.darts.reduce((total, dart) => total + dartPoints(dart), 0);
    return numericSpeech(score);
}

function targetSpeech(value) {
    const number = numericSpeech(value);
    return number ? ['you_require', number] : null;
}

function isTargetTraining(g) {
    return !!g && ['clock', 'random_clock', 'bobs27', 'shanghai'].includes(g.mode);
}

function trainingThrowSpeech(before, after) {
    if (after.mode === 'clock' || after.mode === 'random_clock') {
        const oldTarget = trainingTarget(before);
        const newTarget = trainingTarget(after);
        // At the third dart the next turn is pending: announce its target
        // only when the player actually starts that turn.
        if (after.darts?.length === 3 && !after.training_finished) return null;
        return oldTarget !== newTarget ? targetSpeech(newTarget) : null;
    }
    // Announce the completed visit immediately after dart three, as in x01.
    // Also announce a shorter final visit when the training ends.
    if (after.mode === 'bull' || after.mode === 'scoring') {
        if (after.darts?.length === 3 || (after.training_finished && after.darts?.length))
            return trainingVisitSpeech(after);
    }
    return null;
}

function trainingNextSpeech(before, after) {
    if (before.mode === 'bull' || before.mode === 'scoring')
        return before.darts?.length > 0 && before.darts.length < 3
            ? trainingVisitSpeech(before) : null;
    if (before.mode === 'bobs27' || before.mode === 'shanghai') {
        const oldTarget = trainingTarget(before);
        const newTarget = trainingTarget(after);
        return oldTarget !== newTarget ? targetSpeech(newTarget) : null;
    }
    return null;
}

export function handleCallerAction(path, before, after, data = {}) {
    if (['start', 'reset', 'rematch', 'advance_leg'].includes(path)) {
        stopCaller();
        if (['start', 'rematch'].includes(path) && isTargetTraining(after)) {
            playSpeech(targetSpeech(trainingTarget(after)));
        }
        return;
    }
    if (!after || !before) return;
    if (path === 'correct') {
        stopCaller();
        if (after.winner) playSpeech(winName(after));
        else if (after.mode === 'x01' && (after.bust || after.darts?.length === 3)) {
            const name = visitName(after);
            if (name) playSpeech(name);
        }
        else if (TRAINING.has(after.mode)) {
            const name = trainingThrowSpeech(before, after);
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
        } else if (TRAINING.has(after.mode)) {
            const hit = after.darts?.at(-1) !== 'MISS';
            const name = trainingThrowSpeech(before, after);
            if (hit) playHitThen(name);
            else if (name) { stopCaller(); playSpeech(name); }
        }
        return;
    }
    if (path === 'next') {
        if (before.mode === 'x01' && !before.bust && before.darts?.length && before.darts.length < 3) {
            stopCaller();
            const name = visitName(before);
            if (name) playSpeech(name);
        } else if (TRAINING.has(before.mode)) {
            // Read the active player's target from the *new* game state.
            // This works for both player changes and solo next visits.
            const name = isTargetTraining(after)
                ? targetSpeech(trainingTarget(after)) : trainingNextSpeech(before, after);
            if (name) { stopCaller(); playSpeech(name); }
        }
    }
}
