// UI text in Traditional Chinese and English. Static text carries data-i18n / data-i18n-html /
// data-i18n-aria keys in index.html; app.js asks t() for the messages it builds at run time.

const I18N = {
  zh: {
    'page.title': 'FastEnhancer 降噪實驗室',
    eyebrow: '串流神經語音增強 · 手作課',
    'title.lab': '降噪實驗室',
    lede: '模型直接在你的手機或筆電上執行，聲音不會上傳到任何伺服器。每次只處理十幾毫秒的聲音，所以可以一邊講一邊降噪。',
    'model.aria': '模型',
    'model.label': '模型',
    'speed.line': '每 <b class="num" id="frameLen">–</b> ms 的聲音，運算 <b class="num" id="msPerFrame">–</b> ms',
    'tab.compare': '範例與錄音比較',
    'tab.live': '即時麥克風',
    'cmp.step1': '1. 選一段聲音',
    'cmp.rec': '錄 5 秒',
    'cmp.upload': '上傳音檔',
    'cmp.note': '範例：英文語音混入真實環境噪音。SNR 越低越吵，0 dB 代表噪音和人聲一樣大聲。',
    'cmp.step2': '2. 切換著聽',
    'cmp.abAria': '播放版本',
    'ab.noisy': '原始',
    'ab.enhanced': '降噪後',
    'ab.clean': '乾淨答案',
    'cmp.abNote': '三個版本同步播放，按鈕只切換你聽到哪一個，可以邊播邊切。',
    'cmp.download': '下載降噪後音檔',
    'scope.noisy': '原始（有噪音）·',
    'scope.enh': '降噪後',
    'scope.clean': '乾淨答案（混噪音之前）',
    'scope.note': '頻譜圖：橫軸是時間，縱軸是頻率（下低上高），越亮代表那個頻率越大聲。',
    'live.enh': '降噪',
    'live.strength': '降噪強度',
    'live.monitor': '從喇叭播出',
    'live.aec': '瀏覽器回音消除（AEC）',
    'live.note': '沒戴耳機時打開喇叭，麥克風會收到自己播出的聲音而產生回授。可以試著打開回音消除；或看下面的頻譜圖就好，或改用「錄 5 秒」。回音消除預設關閉，這樣聽到的差異都來自 FastEnhancer。',
    'live.in': '麥克風收到的',
    'stat.algo': '模型延遲（2 幀）',
    'stat.buf': '緩衝',
    'stat.dev': '裝置音訊',
    'stat.total': '估計總延遲',
    'stat.glitch': '斷音次數',
    'live.try': '試試看：拍手、敲鍵盤、開風扇、放音樂、兩個人同時講話。哪些噪音消得掉？哪些消不掉？',
    'foot.model': '模型：<a href="https://github.com/aask1357/fastenhancer" target="_blank" rel="noopener">FastEnhancer</a>（Ahn et al., 2025, MIT License）官方 ONNX 權重，以 <a href="https://onnxruntime.ai/" target="_blank" rel="noopener">ONNX Runtime Web</a> 在瀏覽器執行。',
    'foot.data': '範例音檔：VCTK / VoiceBank 語音（CC BY 4.0）混合 DEMAND 環境噪音（CC BY-SA 3.0）。',
    // run-time messages
    'btn.start': '開始',
    'btn.stop': '停止',
    'btn.play': '播放',
    'btn.recording': '錄音中… {t}',
    'sample.cafe': '咖啡廳',
    'sample.metro': '捷運車廂',
    'sample.station': '車站大廳',
    'sample.kitchen': '廚房',
    'src.mine': '我的錄音',
    'status.loading': '載入 {size} 模型中…',
    'status.loadFail': '模型載入失敗：{msg}',
    'status.initFail': '初始化失敗：{msg}',
    'status.ok': '輕鬆跟上即時',
    'status.warn': '勉強跟上，可能斷音',
    'status.bad': '跟不上即時，請換小一點的模型',
    'model.info': '{family} · 每次處理 {hop} 個取樣點 = {ms} ms 的聲音 · 模型檔 {kb} KB',
    'offline.stats': '{sec} 秒的聲音，切成 {frames} 幀逐幀處理，總運算 {ms} ms，RTF = {rtf}',
    'cmp.fail': '處理失敗：{msg}',
    'mic.https': '麥克風只能在 https:// 或 localhost 網址使用。',
    'mic.denied': '麥克風權限被拒絕了。請在瀏覽器網址列旁的設定裡允許麥克風，再按一次開始。',
    'mic.notfound': '找不到麥克風裝置。',
    'mic.other': '無法開啟麥克風：{msg}',
    'fam.dns16k': 'DNS-Challenge 訓練 · 16 kHz',
    'fam.fb48k': '全頻帶 · 48 kHz',
    'fam.vd16k': 'VoiceBank-DEMAND 訓練 · 16 kHz',
    'short.dns16k': 'DNS 16 kHz',
    'short.fb48k': '全頻帶 48 kHz',
    'short.vd16k': 'VoiceBank 16 kHz',
  },
  en: {
    'page.title': 'FastEnhancer Denoising Lab',
    eyebrow: 'Streaming neural speech enhancement · hands-on',
    'title.lab': 'Denoising Lab',
    lede: 'The model runs right on your phone or laptop; your audio is never uploaded. It processes about 16 ms of sound at a time, so it can denoise while you talk.',
    'model.aria': 'Model',
    'model.label': 'Model',
    'speed.line': 'Every <b class="num" id="frameLen">–</b> ms of audio takes <b class="num" id="msPerFrame">–</b> ms to compute',
    'tab.compare': 'Examples & recordings',
    'tab.live': 'Live microphone',
    'cmp.step1': '1. Pick a sound',
    'cmp.rec': 'Record 5 s',
    'cmp.upload': 'Upload an audio file',
    'cmp.note': 'Examples: English speech mixed with real-world noise. Lower SNR means noisier; 0 dB means the noise is as loud as the speech.',
    'cmp.step2': '2. Listen and switch',
    'cmp.abAria': 'Version to play',
    'ab.noisy': 'Original',
    'ab.enhanced': 'Denoised',
    'ab.clean': 'Clean',
    'cmp.abNote': 'All three versions play in sync; the buttons only switch which one you hear, so you can switch while it plays.',
    'cmp.download': 'Download the denoised audio',
    'scope.noisy': 'Original (noisy) ·',
    'scope.enh': 'Denoised',
    'scope.clean': 'Clean (before the noise was added)',
    'scope.note': 'Spectrogram: time runs left to right, frequency bottom (low) to top (high); brighter means louder.',
    'live.enh': 'Denoise',
    'live.strength': 'Strength',
    'live.monitor': 'Play through speaker',
    'live.aec': 'Browser echo cancellation (AEC)',
    'live.note': 'Without earphones, the microphone picks up the speaker and you get feedback. You can try turning on echo cancellation, just watch the spectrograms, or use "Record 5 s" instead. Echo cancellation is off by default, so every difference you hear comes from FastEnhancer.',
    'live.in': 'Microphone input',
    'stat.algo': 'Model latency (2 frames)',
    'stat.buf': 'Buffer',
    'stat.dev': 'Device audio',
    'stat.total': 'Estimated total latency',
    'stat.glitch': 'Dropouts',
    'live.try': 'Try it: clap, type, turn on a fan, play music, or have two people talk at once. Which noises go away, and which do not?',
    'foot.model': 'Model: <a href="https://github.com/aask1357/fastenhancer" target="_blank" rel="noopener">FastEnhancer</a> (Ahn et al., 2025, MIT License) official ONNX weights, running in your browser with <a href="https://onnxruntime.ai/" target="_blank" rel="noopener">ONNX Runtime Web</a>.',
    'foot.data': 'Example clips: VCTK / VoiceBank speech (CC BY 4.0) mixed with DEMAND environmental noise (CC BY-SA 3.0).',
    'btn.start': 'Start',
    'btn.stop': 'Stop',
    'btn.play': 'Play',
    'btn.recording': 'Recording… {t}',
    'sample.cafe': 'Café',
    'sample.metro': 'Metro car',
    'sample.station': 'Station hall',
    'sample.kitchen': 'Kitchen',
    'src.mine': 'My recording',
    'status.loading': 'Loading the {size} model…',
    'status.loadFail': 'Could not load the model: {msg}',
    'status.initFail': 'Could not start: {msg}',
    'status.ok': 'Easily real time',
    'status.warn': 'Barely real time, may drop out',
    'status.bad': 'Too slow for real time, pick a smaller model',
    'model.info': '{family} · {hop} samples per step = {ms} ms of audio · model file {kb} KB',
    'offline.stats': '{sec} s of audio, processed frame by frame in {frames} frames, total compute {ms} ms, RTF = {rtf}',
    'cmp.fail': 'Processing failed: {msg}',
    'mic.https': 'The microphone only works on https:// or localhost addresses.',
    'mic.denied': 'Microphone permission was denied. Allow the microphone in the site settings next to the address bar, then press Start again.',
    'mic.notfound': 'No microphone was found.',
    'mic.other': 'Could not open the microphone: {msg}',
    'fam.dns16k': 'Trained on DNS-Challenge · 16 kHz',
    'fam.fb48k': 'Full-band · 48 kHz',
    'fam.vd16k': 'Trained on VoiceBank-DEMAND · 16 kHz',
    'short.dns16k': 'DNS 16 kHz',
    'short.fb48k': 'Full-band 48 kHz',
    'short.vd16k': 'VoiceBank 16 kHz',
  },
};

function pickLang() {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch { /* storage may be blocked */ }
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'zh' || q === 'en') return q;
  const langs = navigator.languages || [navigator.language || ''];
  return langs.some((l) => /^zh/i.test(l)) ? 'zh' : 'en';
}

let LANG = pickLang();

function t(key, vars = {}) {
  const s = (I18N[LANG] && I18N[LANG][key]) ?? I18N.zh[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

function applyI18n() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant' : 'en';
  document.title = t('page.title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
}

function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  applyI18n();
  window.dispatchEvent(new Event('langchange'));
}
