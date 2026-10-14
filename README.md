# 🎙️ VoxScribe — ASR (Automatic Speech Recognition) Tool

> A modern, browser-based **Automatic Speech Recognition (ASR)** tool that transcribes speech to text in real-time using the **Web Speech API**. Built with pure HTML, CSS, and JavaScript — no frameworks, no backend, no API keys required.

![VoxScribe ASR Tool](https://img.shields.io/badge/ASR-Speech%20Recognition-6366f1?style=for-the-badge&logo=google-chrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-06b6d4?style=for-the-badge)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎤 **Real-time Transcription** | Converts speech to text instantly as you speak |
| 🌐 **Multi-language Support** | Supports 14+ languages including English, Hindi, Spanish, French, German, Japanese, Korean, Chinese, and more |
| 📊 **Live Audio Visualizer** | Animated frequency bar visualizer that responds to your voice |
| 📈 **Live Statistics** | Real-time word count, character count, and session duration |
| 💾 **Session History** | Automatically saves transcription sessions with timestamps |
| 📋 **Copy & Download** | One-click copy to clipboard or download as a `.txt` file |
| ⚙️ **Customizable Settings** | Adjust font size, toggle continuous listening, interim results, timestamps, and more |
| ⌨️ **Keyboard Shortcuts** | Press `Space` to start/stop recording |
| 📱 **Fully Responsive** | Works on desktop, tablet, and mobile screens |
| 🌙 **Premium Dark Theme** | Glassmorphism UI with animated backgrounds and micro-interactions |
| 🔒 **Privacy-first** | All processing happens in your browser — no data sent to servers |

---

## 🛠️ Tools & Technologies Used

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic page structure |
| **CSS3** | Styling, animations, glassmorphism effects, responsive layout |
| **JavaScript (ES6+)** | Application logic, Web API integration |
| **Web Speech API** (`SpeechRecognition`) | Core speech-to-text engine |
| **Web Audio API** (`AudioContext`, `AnalyserNode`) | Real-time audio visualization |
| **MediaDevices API** (`getUserMedia`) | Microphone access |
| **LocalStorage API** | Persistent settings and session history |
| **Google Fonts** (Inter, JetBrains Mono) | Typography |

---

## 🚀 How to Run the Project

### Prerequisites

- A modern web browser (**Google Chrome** or **Microsoft Edge** recommended)
- That's it! No Node.js, no npm, no build step required.

### Option 1: Open Directly (Simplest)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/voxscribe-asr.git
   cd voxscribe-asr
   ```

2. **Open `index.html` in your browser:**
   - Double-click `index.html`, or
   - Right-click → "Open with" → Chrome/Edge

3. **Allow microphone access** when prompted.

4. **Click the microphone button** (or press `Space`) to start transcribing!

### Option 2: Using a Local Server (Recommended for full functionality)

Some browsers restrict microphone access on `file://` URLs. Use a simple local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Using PHP (if installed)
php -S localhost:8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 📁 Project Structure

```
voxscribe-asr/
├── index.html      # Main HTML page (semantic structure)
├── styles.css      # Complete CSS design system (dark theme, animations)
├── app.js          # Application logic (speech recognition, visualization)
├── README.md       # Project documentation (this file)
└── LICENSE         # MIT License
```

---

## 🎯 How It Works

1. **User clicks the microphone button** → the app requests microphone permission
2. **Web Speech API** starts listening and streams audio to the speech recognition engine
3. **Interim results** are displayed in real-time as faded italic text
4. **Final results** are committed to the transcript as the engine confirms words
5. **Audio Visualizer** processes the microphone stream via `AnalyserNode` to render frequency bars
6. **Sessions are auto-saved** to `localStorage` for later review

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│  Microphone  │────▶│  Web Speech API   │────▶│  Transcript  │
│  (getUserMedia)    │  (SpeechRecognition)    │  (DOM render) │
└──────────────┘     └───────────────────┘     └──────────────┘
       │                                              │
       ▼                                              ▼
┌──────────────┐                              ┌──────────────┐
│ Audio Context│                              │ LocalStorage │
│ (Visualizer) │                              │  (History)   │
└──────────────┘                              └──────────────┘
```

---

## ⚙️ Settings

Access settings via the gear icon (⚙️) in the top-right corner:

| Setting | Default | Description |
|---------|---------|-------------|
| Continuous Listening | ✅ On | Keep listening after pauses |
| Show Interim Results | ✅ On | Display partial results as you speak |
| Auto-save Sessions | ✅ On | Save transcripts to history automatically |
| Show Timestamps | ❌ Off | Prefix each segment with a timestamp |
| Font Size | 17px | Adjust transcript text size (14–28px) |

---

## 🌐 Supported Languages

| Language | Code | Language | Code |
|----------|------|----------|------|
| English (US) | `en-US` | Japanese | `ja-JP` |
| English (UK) | `en-GB` | Korean | `ko-KR` |
| English (India) | `en-IN` | Chinese (Simplified) | `zh-CN` |
| Hindi | `hi-IN` | Portuguese (Brazil) | `pt-BR` |
| Spanish | `es-ES` | Arabic | `ar-SA` |
| French | `fr-FR` | Russian | `ru-RU` |
| German | `de-DE` | Italian | `it-IT` |

---

## 🔑 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Stop recording |

---

## ⚠️ Browser Compatibility

| Browser | Support |
|---------|---------|
| Google Chrome | ✅ Full support |
| Microsoft Edge | ✅ Full support |
| Brave | ✅ Full support |
| Opera | ✅ Full support |
| Safari | ⚠️ Partial (limited Web Speech API) |
| Firefox | ❌ Not supported (no SpeechRecognition API) |

> **Note:** The Web Speech API is a Chromium-based feature. Firefox does not currently support it.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## 👤 Author

Built as part of **Speech Recognition Activity 2** — ASR Tool Implementation project.

---

<p align="center">
  <strong>🎙️ VoxScribe</strong> — Real-time speech recognition, right in your browser.
</p>
