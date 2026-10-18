// Audio thread. Mic samples at the device rate -> resample to the model rate -> post one
// hop at a time to the page. Enhanced hops come back -> resample to the device rate ->
// play from a small FIFO. The model itself runs on the page (onnxruntime-web).

// Streaming windowed-sinc resampler with a precomputed polyphase table.
class Resampler {
  constructor(inRate, outRate, zeros = 12, phases = 256) {
    this.step = inRate / outRate;
    this.passthrough = inRate === outRate;
    const fc = Math.min(1, outRate / inRate) * 0.95; // cutoff, relative to input Nyquist
    this.half = Math.ceil(zeros / fc);
    this.phases = phases;
    const width = 2 * this.half;
    this.table = new Float32Array((phases + 1) * width);
    for (let p = 0; p <= phases; p++) {
      const frac = p / phases;
      for (let j = 0; j < width; j++) {
        const d = j - this.half + 1 - frac; // distance from output position to tap
        const x = Math.PI * fc * d;
        const sinc = d === 0 ? 1 : Math.sin(x) / x;
        const w = Math.abs(d) < this.half ? 0.5 * (1 + Math.cos(Math.PI * d / this.half)) : 0;
        this.table[p * width + j] = fc * sinc * w;
      }
    }
    this.buf = new Float32Array(4096);
    this.len = this.half; // left context starts as zeros
    this.pos = this.half - 1;
  }

  // Appends input, returns all output samples that are now computable.
  push(input) {
    if (this.passthrough) return input.slice();
    if (this.len + input.length > this.buf.length) {
      const nb = new Float32Array(Math.max(this.buf.length * 2, this.len + input.length));
      nb.set(this.buf.subarray(0, this.len));
      this.buf = nb;
    }
    this.buf.set(input, this.len);
    this.len += input.length;
    const out = [];
    const width = 2 * this.half;
    while (Math.floor(this.pos) + this.half < this.len) {
      const i0 = Math.floor(this.pos);
      const frac = this.pos - i0;
      const p = Math.round(frac * this.phases);
      const base = p * width;
      const start = i0 - this.half + 1;
      let acc = 0;
      for (let j = 0; j < width; j++) acc += this.buf[start + j] * this.table[base + j];
      out.push(acc);
      this.pos += this.step;
    }
    // Drop samples no future output can reach.
    const drop = Math.floor(this.pos) - this.half + 1;
    if (drop > 0) {
      this.buf.copyWithin(0, drop, this.len);
      this.len -= drop;
      this.pos -= drop;
    }
    return Float32Array.from(out);
  }
}

class EnhancerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { modelRate, hop } = options.processorOptions;
    this.hop = hop;
    this.down = new Resampler(sampleRate, modelRate);
    this.up = new Resampler(modelRate, sampleRate);
    this.acc = new Float32Array(hop);
    this.accLen = 0;
    // Output FIFO at the device rate.
    this.fifo = new Float32Array(sampleRate * 2);
    this.rd = 0;
    this.wr = 0;
    // Start playing once two hops are queued; each underrun adds one hop of cushion (max 8).
    this.hopDev = Math.ceil((hop * sampleRate) / modelRate);
    this.prebuffer = 2 * this.hopDev + 128;
    this.maxPrebuffer = 8 * this.hopDev;
    this.playing = false;
    this.underruns = 0;
    this.lastReport = 0;
    this.port.onmessage = (e) => {
      if (e.data.type === 'out') this.enqueue(this.up.push(e.data.samples));
    };
  }

  fifoSize() {
    return (this.wr - this.rd + this.fifo.length) % this.fifo.length;
  }

  enqueue(samples) {
    for (let i = 0; i < samples.length; i++) {
      this.fifo[this.wr] = samples[i];
      this.wr = (this.wr + 1) % this.fifo.length;
      if (this.wr === this.rd) this.rd = (this.rd + 1) % this.fifo.length; // overflow: drop oldest
    }
  }

  process(inputs, outputs) {
    const inp = inputs[0] && inputs[0][0];
    if (inp) {
      const ds = this.down.push(inp);
      let i = 0;
      while (i < ds.length) {
        const n = Math.min(this.hop - this.accLen, ds.length - i);
        this.acc.set(ds.subarray(i, i + n), this.accLen);
        this.accLen += n;
        i += n;
        if (this.accLen === this.hop) {
          this.port.postMessage({ type: 'in', samples: this.acc.slice() });
          this.accLen = 0;
        }
      }
    }

    const out = outputs[0][0];
    if (out) {
      if (!this.playing && this.fifoSize() >= this.prebuffer) this.playing = true;
      for (let i = 0; i < out.length; i++) {
        if (this.playing && this.fifoSize() > 0) {
          out[i] = this.fifo[this.rd];
          this.rd = (this.rd + 1) % this.fifo.length;
        } else {
          if (this.playing) {
            this.playing = false;
            this.underruns++;
            this.prebuffer = Math.min(this.prebuffer + this.hopDev, this.maxPrebuffer);
          }
          out[i] = 0;
        }
      }
      for (let c = 1; c < outputs[0].length; c++) outputs[0][c].set(out);
    }

    if (currentTime - this.lastReport > 0.5) {
      this.lastReport = currentTime;
      this.port.postMessage({
        type: 'stats',
        underruns: this.underruns,
        fifoMs: (this.fifoSize() / sampleRate) * 1000,
        prebufferMs: (this.prebuffer / sampleRate) * 1000,
      });
    }
    return true;
  }
}

registerProcessor('enhancer-processor', EnhancerProcessor);
