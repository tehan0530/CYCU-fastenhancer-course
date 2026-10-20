# FastEnhancer Hands-on: Making Speech Clearer

[中文版 (Traditional Chinese)](README.md)

Streaming neural speech enhancement in practice: a 50-minute hands-on session on real-time speech denoising, using [FastEnhancer](https://github.com/aask1357/fastenhancer) (Ahn et al., 2025).

| | |
|---|---|
| Time | Tue 20 Oct 2026, 12:10–13:00 |
| Place | Lecture Hall 112, Teaching Building, Chung Yuan Christian University (please bring a laptop or tablet) |
| Speakers | Mr. Hsin-Te Hwang 黃信德 (former postdoctoral researcher, Institute of Information Science, Academia Sinica) and Assoc. Prof. Chen 陳雅湞 (Chung Yuan Christian University) |

- **Denoising web version** (works on phones, tablets and laptops): <https://benevolent-pithivier-3ffb14.netlify.app/?lang=en>
  Switch between 中文 and EN at the top right of the page.
- **Colab notebook** (bilingual, Chinese + English): [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/tehan0530/CYCU-fastenhancer-course/blob/main/notebook/FastEnhancer_handson.ipynb) (needs a Google account)
- **Slides (PDF)**: [English](slides/FastEnhancer_course_slides_en.pdf) · [中文](slides/FastEnhancer_course_slides.pdf)
- **No Google account?** Open the [pre-run copy](https://colab.research.google.com/github/tehan0530/CYCU-fastenhancer-course/blob/main/notebook/FastEnhancer_handson_with_outputs.ipynb): every cell's plots, numbers and audio are already saved in it.

| Folder | Contents |
|---|---|
| `web/` | The denoising web version: the model runs in your browser with onnxruntime-web (static files, ready to deploy) |
| `notebook/` | Colab notebook: from setup to denoising, just press ▶ on each cell; `_with_outputs` is the pre-run copy |
| `slides/` | Course slides (PDF, Chinese and English) |
| `tools/` | `serve.py` runs the web version on your own computer |

## Host your own copy

The web version is just static files: the model runs in the browser, so no server code is needed. Pick one:

1. **Netlify Drop (easiest)**: on this page press Code → Download ZIP, unzip it, and drag the `web` folder onto <https://app.netlify.com/drop>. Sign up and log in to Netlify (free) first, or the site is deleted after about an hour.
2. **On your own computer**: needs Python 3. Download this repo, run `python tools/serve.py` in its folder, and open <http://localhost:8765>. (Do not use `python -m http.server`: on Windows it may report the wrong type for `.mjs` files and the page will not load.)
3. **GitHub Pages (a lasting address)**: fork this repo → Settings → Pages → Source: "GitHub Actions" → enable workflows on the Actions tab → run "Deploy web to Pages". Your site will be at `https://<your-account>.github.io/<repo-name>/`.

A phone's microphone only works on `https://` addresses, so on a phone use option 1 or 3; option 2 only works on the same computer.

## Licences

- FastEnhancer model weights: MIT License (aask1357/fastenhancer)
- onnxruntime-web: MIT License
- Example clips: VCTK / VoiceBank (CC BY 4.0) + DEMAND (CC BY-SA 3.0)
