// FastEnhancer browser demo: the ONNX model runs locally with onnxruntime-web (WASM).
/* global ort, LiveSpectrogram, spectrumColumn, drawSpectrogram, encodeWav, decodeToRate, resampleTo */

ort.env.wasm.wasmPaths = new URL('ort/', location.href).href;
ort.env.wasm.numThreads = 1; // no SharedArrayBuffer needed, works on every phone

const SAMPLES = [
  { id: 'cafe', detail: '0 dB' },
  { id: 'metro', detail: '0 dB' },
  { id: 'station', detail: '5 dB' },
  { id: 'kitchen', detail: '0 dB' },
];

const $ = (id) => document.getElementById(id);
const state = { models: [], meta: null, session: null, sessions: new Map(), live: null, busy: false };

// ---------- model ----------
class Enhancer {
  constructor(session, meta) {
    this.session = session;
    this.meta = meta;
    this.hop = meta.inputs.wav_in[1];
    this.reset();
  }
  reset() {
    this.feed = {};
    for (const [name, shape] of Object.entries(this.meta.inputs)) {
      if (!name.startsWith('cache_in_')) continue;
      this.feed[name] = new ort.Tensor('float32', new Float32Array(shape.reduce((a, b) => a * b, 1)), shape);
    }
  }
  // One hop in, one hop out (delayed by one hop). Returns the output and the compute time.
  async step(x) {
    this.feed.wav_in = new ort.Tensor('float32', x, [1, this.hop]);
    const t0 = performance.now();
    const r = await this.session.run(this.feed);
    const ms = performance.now() - t0;
    for (const name of Object.keys(this.feed)) {
      if (name.startsWith('cache_in_')) this.feed[name] = r[name.replace('_in_', '_out_')];
    }
    return { y: r.wav_out.data.slice(), ms };
  }
}

const frameMs = (m) => (m.inputs.wav_in[1] / m.sr) * 1000;
const modelGroup = (m) => m.id.split('_')[0]; // dns16k / fb48k / vd16k

// Model menu, grouped by training data; rebuilt when the language changes.
function buildModelOptions() {
  const sel = $('model');
  const keep = sel.value;
  sel.innerHTML = '';
  for (const grp of [...new Set(state.models.map(modelGroup))]) {
    const g = document.createElement('optgroup');
    g.label = t(`fam.${grp}`);
    for (const m of state.models.filter((x) => modelGroup(x) === grp)) {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = `${m.size} · ${t(`short.${grp}`)}`;
      g.appendChild(o);
    }
    sel.appendChild(g);
  }
  if (keep) sel.value = keep;
}

function showModelInfo() {
  const m = state.meta;
  if (!m) return;
  $('modelInfo').textContent = t('model.info', {
    family: t(`fam.${modelGroup(m)}`), hop: m.inputs.wav_in[1], ms: frameMs(m).toFixed(1), kb: Math.round(m.bytes / 1024),
  });
}

function sourceLabel(src) {
  if (src.sampleId) return LANG === 'zh' ? `${t(`sample.${src.sampleId}`)}（SNR ${src.detail}）` : `${t(`sample.${src.sampleId}`)} (SNR ${src.detail})`;
  if (src.labelKey) return t(src.labelKey);
  return src.label;
}

function buildSampleChips() {
  const chips = $('samples');
  chips.innerHTML = '';
  for (const s of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.sample = s.id;
    b.setAttribute('aria-pressed', String(state.source?.sampleId === s.id));
    b.innerHTML = `<span>${t(`sample.${s.id}`)}</span><small>SNR ${s.detail}</small>`;
    b.addEventListener('click', () => loadSample(s.id));
    chips.appendChild(b);
  }
}

// Re-render everything built at run time in the newly chosen language.
function refreshLanguage() {
  if (!state.models.length) return;
  buildModelOptions();
  buildSampleChips();
  showModelInfo();
  if (state.lastMs != null && state.meta) showSpeed(state.lastMs);
  if (state.offline) $('offlineStats').textContent = t('offline.stats', state.offline);
  if (state.source) $('srcLabel').textContent = sourceLabel(state.source);
  $('liveBtn').textContent = t(state.live ? 'btn.stop' : 'btn.start');
  $('playBtn').textContent = t(play.nodes ? 'btn.stop' : 'btn.play');
  if (!$('recBtn').disabled) $('recBtn').textContent = t('cmp.rec');
}

async function loadModels() {
  state.models = await (await fetch('models/manifest.json')).json();
  const sel = $('model');
  buildModelOptions();
  sel.value = 'dns16k_b';
  sel.addEventListener('change', () => selectModel(sel.value));
  await selectModel(sel.value);
}

async function selectModel(id) {
  const wasLive = !!state.live;
  if (wasLive) await stopLive();
  const meta = state.models.find((m) => m.id === id);
  setModelStatus('loading', t('status.loading', { size: meta.size }));
  try {
    if (!state.sessions.has(id)) {
      const s = await ort.InferenceSession.create(meta.file, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      state.sessions.set(id, s);
    }
    state.meta = meta;
    state.session = state.sessions.get(id);
    showModelInfo();
    await benchmark();
    if (wasLive) await startLive();
    if (state.source) await runCompare();
  } catch (err) {
    setModelStatus('bad', t('status.loadFail', { msg: err.message }));
    console.error(err);
  }
}

// Times 60 frames of silence so the speed chip shows a number before anyone presses Start.
async function benchmark() {
  const enh = new Enhancer(state.session, state.meta);
  const x = new Float32Array(enh.hop);
  for (let i = 0; i < 10; i++) await enh.step(x);
  let total = 0;
  for (let i = 0; i < 60; i++) total += (await enh.step(x)).ms;
  showSpeed(total / 60);
}

function showSpeed(ms) {
  const fm = frameMs(state.meta);
  const rtf = ms / fm;
  $('msPerFrame').textContent = ms.toFixed(2);
  $('frameLen').textContent = fm.toFixed(1);
  $('rtf').textContent = rtf.toFixed(3);
  state.lastMs = ms;
  if (rtf < 0.5) setModelStatus('ok', t('status.ok'));
  else if (rtf < 1) setModelStatus('warn', t('status.warn'));
  else setModelStatus('bad', t('status.bad'));
}

function setModelStatus(kind, text) {
  const el = $('speedChip');
  el.dataset.kind = kind;
  el.textContent = text;
}

// ---------- microphone capture (shared by live mode and recording) ----------
async function openMic(onHop, aec = false) {
  const ctx = new AudioContext({ latencyHint: 'interactive' });
  await ctx.audioWorklet.addModule('worklet.js');
  const stream = await navigator.mediaDevices.getUserMedia({
    // The browser's own noise suppression would hide what the model does. Its echo
    // cancellation is optional: it only removes what the speaker plays back into the mic.
    audio: { echoCancellation: aec, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
  });
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'enhancer-processor', {
    numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1],
    processorOptions: { modelRate: state.meta.sr, hop: state.meta.inputs.wav_in[1] },
  });
  const gain = ctx.createGain();
  src.connect(node).connect(gain).connect(ctx.destination);
  node.port.onmessage = (e) => onHop(e.data);
  await ctx.resume();
  return {
    ctx, node, gain,
    close: async () => { stream.getTracks().forEach((t) => t.stop()); await ctx.close(); },
  };
}

// ---------- live mode ----------
async function startLive() {
  if (state.busy) return;
  const btn = $('liveBtn');
  btn.disabled = true;
  try {
    const meta = state.meta;
    const hop = meta.inputs.wav_in[1];
    const enh = new Enhancer(state.session, meta);
    const maxHz = meta.sr > 24000 ? 16000 : 8000;
    const live = {
      enh, queue: [], running: false, prevRaw: new Float32Array(hop), prevOut: new Float32Array(hop),
      emaMs: null, dropped: 0, underruns: 0, prebufferMs: 0, maxHz,
      specIn: new LiveSpectrogram($('liveIn')), specOut: new LiveSpectrogram($('liveOut')),
    };
    $('liveAxis').textContent = `0 – ${maxHz / 1000} kHz`;
    live.mic = await openMic((msg) => {
      if (msg.type === 'in') { live.queue.push(msg.samples); pump(live); }
      else if (msg.type === 'stats') { live.underruns = msg.underruns; live.prebufferMs = msg.prebufferMs; }
    }, $('aec').checked);
    live.mic.gain.gain.value = $('monitor').checked ? 1 : 0;
    state.live = live;
    try { live.wake = await navigator.wakeLock?.request('screen'); } catch { /* optional */ }
    btn.textContent = t('btn.stop');
    btn.dataset.on = '1';
    $('liveHint').hidden = true;
    requestAnimationFrame(() => drawLive(live));
  } catch (err) {
    $('liveHint').hidden = false;
    $('liveHint').textContent = micErrorText(err);
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

function micErrorText(err) {
  if (!window.isSecureContext) return t('mic.https');
  if (err && err.name === 'NotAllowedError') return t('mic.denied');
  if (err && err.name === 'NotFoundError') return t('mic.notfound');
  return t('mic.other', { msg: err && err.message });
}

async function pump(live) {
  if (live.running) return;
  live.running = true;
  const hop = live.enh.hop;
  while (live.queue.length && state.live === live) {
    // If the device cannot keep up, drop the backlog instead of letting latency grow.
    if (live.queue.length > 6) {
      live.dropped += live.queue.length - 1;
      live.queue.splice(0, live.queue.length - 1);
    }
    const x = live.queue.shift();
    const { y, ms } = await live.enh.step(x);
    live.emaMs = live.emaMs == null ? ms : 0.95 * live.emaMs + 0.05 * ms;
    // The model output is one hop late, so mix it with the previous raw hop.
    const w = $('enhOn').checked ? $('strength').value / 100 : 0;
    const out = new Float32Array(hop);
    for (let i = 0; i < hop; i++) out[i] = w * y[i] + (1 - w) * live.prevRaw[i];
    const sr = state.meta.sr;
    const frameIn = new Float32Array(2 * hop); frameIn.set(live.prevRaw); frameIn.set(x, hop);
    const frameOut = new Float32Array(2 * hop); frameOut.set(live.prevOut); frameOut.set(out, hop);
    live.specIn.push(spectrumColumn(frameIn, sr, live.maxHz));
    live.specOut.push(spectrumColumn(frameOut, sr, live.maxHz));
    live.prevRaw = x;
    live.prevOut = out;
    if (state.live === live) live.mic.node.port.postMessage({ type: 'out', samples: out });
  }
  live.running = false;
}

function drawLive(live) {
  if (state.live !== live) return;
  live.specIn.flush();
  live.specOut.flush();
  if (live.emaMs != null) showSpeed(live.emaMs);
  const m = state.meta;
  const algo = 2 * frameMs(m);
  const dev = ((live.mic.ctx.baseLatency || 0) + (live.mic.ctx.outputLatency || 0)) * 1000;
  $('latAlgo').textContent = algo.toFixed(0);
  $('latBuf').textContent = live.prebufferMs.toFixed(0);
  $('latDev').textContent = dev.toFixed(0);
  $('latTotal').textContent = (algo + live.prebufferMs + dev).toFixed(0);
  $('glitches').textContent = String(live.underruns + live.dropped);
  requestAnimationFrame(() => drawLive(live));
}

async function stopLive() {
  const live = state.live;
  if (!live) return;
  state.live = null;
  try { await live.wake?.release(); } catch { /* ignore */ }
  await live.mic.close();
  $('liveBtn').textContent = t('btn.start');
  delete $('liveBtn').dataset.on;
}

// ---------- compare mode ----------
async function loadSample(id) {
  const meta = SAMPLES.find((s) => s.id === id);
  const sr = 16000;
  const [noisy, clean] = await Promise.all(
    ['noisy', 'clean'].map(async (k) => decodeToRate(await (await fetch(`samples/${id}_${k}.wav`)).arrayBuffer(), sr)),
  );
  state.source = { name: id, sampleId: id, detail: meta.detail, x: noisy, clean, sr };
  markSource(id);
  await runCompare();
}

async function loadFile(file) {
  const x = await decodeToRate(await file.arrayBuffer(), 48000);
  state.source = { name: file.name.replace(/\.[^.]+$/, ''), label: file.name, x, sr: 48000 };
  markSource(null);
  await runCompare();
}

async function record(seconds = 5) {
  if (state.busy) return;
  await stopLive();
  const btn = $('recBtn');
  const sr = state.meta.sr;
  const chunks = [];
  let mic;
  try {
    mic = await openMic((msg) => { if (msg.type === 'in') chunks.push(msg.samples); });
  } catch (err) {
    $('compareMsg').textContent = micErrorText(err);
    return;
  }
  btn.disabled = true;
  for (let sec = seconds; sec > 0; sec--) {
    btn.textContent = t('btn.recording', { t: sec });
    await new Promise((r) => setTimeout(r, 1000));
  }
  await mic.close();
  btn.textContent = t('cmp.rec');
  btn.disabled = false;
  const x = new Float32Array(chunks.length * chunks[0].length);
  chunks.forEach((c, i) => x.set(c, i * c.length));
  state.source = { name: 'my_recording', labelKey: 'src.mine', x, sr };
  markSource(null);
  await runCompare();
}

function markSource(id) {
  document.querySelectorAll('[data-sample]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sample === id)));
}

async function runCompare() {
  const src = state.source;
  if (!src || state.busy) return;
  state.busy = true;
  stopPlayback();
  const meta = state.meta;
  const sr = meta.sr;
  $('compareMsg').textContent = '';
  $('srcLabel').textContent = sourceLabel(src);
  try {
    const x = await resampleTo(src.x, src.sr, sr);
    const enh = new Enhancer(state.session, meta);
    const hop = enh.hop;
    const frames = Math.ceil(x.length / hop) + 1; // +1 hop flushes the model's delay
    const padded = new Float32Array(frames * hop);
    padded.set(x);
    const y = new Float32Array(frames * hop);
    let compute = 0;
    for (let f = 0; f < frames; f++) {
      const r = await enh.step(padded.slice(f * hop, (f + 1) * hop));
      y.set(r.y, f * hop);
      compute += r.ms;
      if (f % 25 === 0) {
        $('progress').value = f / frames;
        await new Promise((res) => requestAnimationFrame(res));
      }
    }
    $('progress').value = 1;
    const out = y.slice(hop, hop + x.length);
    const audioMs = (x.length / sr) * 1000;
    state.offline = { sec: (audioMs / 1000).toFixed(1), frames, ms: compute.toFixed(0), rtf: (compute / audioMs).toFixed(3) };
    $('offlineStats').textContent = t('offline.stats', state.offline);
    showSpeed(compute / frames);
    state.result = { noisy: x, enhanced: out, clean: src.clean ? await resampleTo(src.clean, src.sr, sr) : null, sr };
    const maxHz = Math.min(src.sr, sr) / 2;
    $('cmpAxis').textContent = `0 – ${maxHz / 1000} kHz`;
    drawSpectrogram($('specNoisy'), x, sr, maxHz);
    drawSpectrogram($('specEnh'), out, sr, maxHz);
    $('cleanRow').hidden = !state.result.clean;
    if (state.result.clean) drawSpectrogram($('specClean'), state.result.clean, sr, maxHz);
    $('abClean').hidden = !state.result.clean;
    $('results').hidden = false;
    const a = $('download');
    if (a.href) URL.revokeObjectURL(a.href);
    a.href = URL.createObjectURL(encodeWav(out, sr));
    a.download = `${src.name}_${meta.id}_enhanced.wav`;
  } catch (err) {
    $('compareMsg').textContent = t('cmp.fail', { msg: err.message });
    console.error(err);
  } finally {
    state.busy = false;
  }
}

// A/B playback: all versions play in sync, the switch only moves the volume.
const play = { ctx: null, nodes: null, pick: 'noisy' };

function startPlayback() {
  const r = state.result;
  if (!r) return;
  stopPlayback();
  play.ctx = play.ctx || new AudioContext();
  play.ctx.resume();
  const t0 = play.ctx.currentTime + 0.05;
  play.nodes = {};
  for (const k of ['noisy', 'enhanced', 'clean']) {
    if (!r[k]) continue;
    const b = play.ctx.createBuffer(1, r[k].length, r.sr);
    b.copyToChannel(r[k], 0);
    const s = play.ctx.createBufferSource();
    s.buffer = b;
    const g = play.ctx.createGain();
    g.gain.value = k === play.pick ? 1 : 0;
    s.connect(g).connect(play.ctx.destination);
    s.start(t0);
    play.nodes[k] = { s, g };
  }
  const first = play.nodes.noisy.s;
  play.src = first;
  first.onended = () => { if (play.src === first) stopPlayback(); };
  $('playBtn').textContent = t('btn.stop');
  $('playBtn').dataset.on = '1';
}

function stopPlayback() {
  if (play.nodes) for (const { s } of Object.values(play.nodes)) { try { s.stop(); } catch { /* already stopped */ } }
  play.nodes = null;
  play.src = null;
  $('playBtn').textContent = t('btn.play');
  delete $('playBtn').dataset.on;
}

function pickAB(k) {
  play.pick = k;
  document.querySelectorAll('[data-ab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ab === k)));
  if (play.nodes) {
    for (const [name, { g }] of Object.entries(play.nodes)) g.gain.setTargetAtTime(name === k ? 1 : 0, play.ctx.currentTime, 0.01);
  }
}

// ---------- wiring ----------
function selectTab(name) {
  document.querySelectorAll('[role=tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  document.querySelectorAll('[role=tabpanel]').forEach((p) => { p.hidden = p.id !== `panel-${name}`; });
  if (name !== 'live') stopLive();
  if (name !== 'compare') stopPlayback();
}

window.addEventListener('DOMContentLoaded', async () => {
  applyI18n();
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  window.addEventListener('langchange', refreshLanguage);
  $('liveBtn').textContent = t('btn.start');
  $('playBtn').textContent = t('btn.play');
  $('recBtn').textContent = t('cmp.rec');
  document.querySelectorAll('[role=tab]').forEach((tab) => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));
  $('liveBtn').addEventListener('click', () => (state.live ? stopLive() : startLive()));
  // AEC is a microphone setting, so changing it reopens the microphone.
  $('aec').addEventListener('change', async () => { if (state.live) { await stopLive(); await startLive(); } });
  $('monitor').addEventListener('change', (e) => { if (state.live) state.live.mic.gain.gain.value = e.target.checked ? 1 : 0; });
  $('strength').addEventListener('input', (e) => { $('strengthVal').textContent = `${e.target.value}%`; });
  buildSampleChips();
  $('fileIn').addEventListener('change', (e) => e.target.files[0] && loadFile(e.target.files[0]));
  $('recBtn').addEventListener('click', () => record(5));
  $('playBtn').addEventListener('click', () => (play.nodes ? stopPlayback() : startPlayback()));
  document.querySelectorAll('[data-ab]').forEach((b) => b.addEventListener('click', () => pickAB(b.dataset.ab)));
  try {
    await loadModels();
    await loadSample('cafe');
  } catch (err) {
    setModelStatus('bad', t('status.initFail', { msg: err.message }));
    console.error(err);
  }
});
