// Small DSP helpers for the page: FFT, spectrogram drawing, WAV I/O.

// In-place radix-2 FFT on (re, im); n must be a power of two.
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}

const hannCache = new Map();
function hann(n) {
  if (!hannCache.has(n)) {
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
    hannCache.set(n, w);
  }
  return hannCache.get(n);
}

// dB magnitude (0..1 after mapping) of one windowed frame; returns bins up to maxHz.
const DB_FLOOR = -95, DB_TOP = -15;
function spectrumColumn(frame, sr, maxHz) {
  const n = frame.length;
  const w = hann(n);
  const re = new Float32Array(n), im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = frame[i] * w[i];
  fft(re, im);
  const bins = Math.min(n / 2, Math.round((maxHz / sr) * n));
  const col = new Float32Array(bins);
  for (let k = 0; k < bins; k++) {
    const mag = Math.hypot(re[k], im[k]) / (n / 4);
    const db = 20 * Math.log10(mag + 1e-9);
    col[k] = Math.min(1, Math.max(0, (db - DB_FLOOR) / (DB_TOP - DB_FLOOR)));
  }
  return col;
}

// Magma-like colour map, precomputed to 256 RGB triplets.
const CMAP = (() => {
  const stops = [
    [0.0, [8, 8, 20]], [0.25, [59, 15, 112]], [0.5, [140, 41, 129]],
    [0.72, [222, 73, 104]], [0.88, [254, 159, 109]], [1.0, [252, 253, 191]],
  ];
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let s = 0;
    while (s < stops.length - 2 && t > stops[s + 1][0]) s++;
    const [t0, c0] = stops[s], [t1, c1] = stops[s + 1];
    const f = (t - t0) / (t1 - t0);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = c0[c] + f * (c1[c] - c0[c]);
  }
  return lut;
})();

// Draws a full spectrogram of `x` into `canvas`.
function drawSpectrogram(canvas, x, sr, maxHz = 8000) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const n = sr > 24000 ? 2048 : 512;
  const hop = Math.max(1, Math.floor((x.length - n) / W));
  const img = ctx.createImageData(W, H);
  for (let col = 0; col < W; col++) {
    const start = col * hop;
    const frame = new Float32Array(n);
    if (start < x.length) frame.set(x.subarray(start, Math.min(start + n, x.length)));
    const spec = spectrumColumn(frame, sr, maxHz);
    for (let row = 0; row < H; row++) {
      const k = Math.floor(((H - 1 - row) / H) * spec.length);
      const v = Math.round(spec[k] * 255) * 3;
      const p = (row * W + col) * 4;
      img.data[p] = CMAP[v]; img.data[p + 1] = CMAP[v + 1]; img.data[p + 2] = CMAP[v + 2]; img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Scrolling spectrogram: push one column at a time.
class LiveSpectrogram {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pending = [];
    this.clear();
  }
  clear() {
    this.ctx.fillStyle = 'rgb(8,8,20)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.pending = [];
  }
  push(col) { this.pending.push(col); }
  flush() {
    const k = this.pending.length;
    if (!k) return;
    const { canvas, ctx } = this;
    const W = canvas.width, H = canvas.height;
    ctx.drawImage(canvas, k, 0, W - k, H, 0, 0, W - k, H);
    const img = ctx.createImageData(k, H);
    this.pending.forEach((spec, c) => {
      for (let row = 0; row < H; row++) {
        const bin = Math.floor(((H - 1 - row) / H) * spec.length);
        const v = Math.round(spec[bin] * 255) * 3;
        const p = (row * k + c) * 4;
        img.data[p] = CMAP[v]; img.data[p + 1] = CMAP[v + 1]; img.data[p + 2] = CMAP[v + 2]; img.data[p + 3] = 255;
      }
    });
    ctx.putImageData(img, W - k, 0);
    this.pending = [];
  }
}

// 16-bit PCM mono WAV.
function encodeWav(x, sr) {
  const buf = new ArrayBuffer(44 + x.length * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + x.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, x.length * 2, true);
  for (let i = 0; i < x.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i])) * 32767, true);
  return new Blob([buf], { type: 'audio/wav' });
}

// Decode any audio file and return mono samples at `sr` (browser-quality resampling).
async function decodeToRate(arrayBuffer, sr) {
  const tmp = new OfflineAudioContext(1, 1, sr);
  const decoded = await tmp.decodeAudioData(arrayBuffer);
  const len = Math.ceil((decoded.duration) * sr);
  const off = new OfflineAudioContext(1, len, sr);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination); // multi-channel sources are down-mixed to mono here
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0).slice();
}

// Same, for samples already in memory at another rate.
async function resampleTo(x, fromSr, toSr) {
  if (fromSr === toSr) return x;
  const len = Math.ceil((x.length * toSr) / fromSr);
  const off = new OfflineAudioContext(1, len, toSr);
  const b = off.createBuffer(1, x.length, fromSr);
  b.copyToChannel(x, 0);
  const src = off.createBufferSource();
  src.buffer = b;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0).slice();
}
