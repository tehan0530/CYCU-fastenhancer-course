# FastEnhancer 手作課：讓聲音更清晰

[English version](README.en.md)

串流神經語音增強實務（FastEnhancer）：50 分鐘的串流語音降噪實作課，使用 [FastEnhancer](https://github.com/aask1357/fastenhancer)（Ahn et al., 2025）。

| | |
|---|---|
| 時間 | 2026/10/20（二）12:10–13:00 |
| 地點 | 中原大學教學樓 112 講堂（請自備筆電或平板） |
| 講者 | 黃信德 先生（中央研究院資訊科學研究所 前博士後研究員）、陳雅湞 副教授（中原大學） |

- **降噪網頁版**（手機、平板、電腦都能用）：<https://benevolent-pithivier-3ffb14.netlify.app/>
- **Colab notebook**（中英對照）：[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/tehan0530/CYCU-fastenhancer-course/blob/main/notebook/FastEnhancer_handson.ipynb)（需要 Google 帳號）
- **投影片（PDF）**：[中文](slides/FastEnhancer_course_slides.pdf) · [English](slides/FastEnhancer_course_slides_en.pdf)
- **沒有 Google 帳號？** 看 [附結果版](https://colab.research.google.com/github/tehan0530/CYCU-fastenhancer-course/blob/main/notebook/FastEnhancer_handson_with_outputs.ipynb)：每一格的圖表、數字、聲音都已存在裡面，打開就能看

| 資料夾 | 內容 |
|---|---|
| `web/` | 降噪網頁版：模型以 onnxruntime-web 在手機／筆電瀏覽器裡即時執行（純靜態，可直接部署） |
| `notebook/` | Colab notebook：從安裝到降噪，每個 cell 按 ▶ 即可；`_with_outputs` 是附結果版 |
| `slides/` | 課堂投影片 PDF（中文、英文） |
| `tools/` | `serve.py` 在自己電腦上跑網頁 |

## 自己架一份（給有興趣的同學）

網頁是純靜態檔案：模型在瀏覽器裡跑，不需要任何伺服器程式。三種方式擇一：

1. **Netlify Drop（最簡單）**：在本頁按 Code → Download ZIP，解壓縮後把裡面的 `web` 資料夾拖進 <https://app.netlify.com/drop>。先註冊並登入 Netlify（免費），網站才會一直保留。
2. **在自己電腦上跑**：需要 Python 3。下載本 repo 後在資料夾裡執行 `python tools/serve.py`，打開 <http://localhost:8765>。（不要用 `python -m http.server`：Windows 上它可能把 `.mjs` 檔的格式回報錯，網頁會載入失敗。）
3. **GitHub Pages（長期網址）**：Fork 本 repo → Settings → Pages → Source 選「GitHub Actions」→ Actions 分頁啟用 workflows → 執行「Deploy web to Pages」。完成後網址是 `https://<你的帳號>.github.io/<repo 名稱>/`。

手機的麥克風只能在 `https://` 網址使用，所以手機請用方式 1 或 3；方式 2 只能在同一台電腦上用。

## 授權

- FastEnhancer 模型權重：MIT License（aask1357/fastenhancer）
- onnxruntime-web：MIT License
- 範例音檔：VCTK / VoiceBank（CC BY 4.0）＋ DEMAND（CC BY-SA 3.0）
