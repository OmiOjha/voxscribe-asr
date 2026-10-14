/* ============================================
   VoxScribe — ASR Speech Recognition Tool
   Application Logic (app.js)
   ============================================ */

(function () {
    'use strict';

    // ——————————————————————————————————
    // 1. Feature Detection
    // ——————————————————————————————————
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;font-family:'Inter',sans-serif;color:#f0f4fc;background:#0a0e17;">
                <div>
                    <h1 style="font-size:1.5rem;margin-bottom:1rem;">⚠️ Browser Not Supported</h1>
                    <p style="color:#94a3b8;max-width:400px;">
                        Your browser does not support the Web Speech API.<br>
                        Please use <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or another Chromium-based browser.
                    </p>
                </div>
            </div>`;
        return;
    }

    // ——————————————————————————————————
    // 2. DOM References
    // ——————————————————————————————————
    const dom = {
        statusBar: document.getElementById('status-bar'),
        statusText: document.getElementById('status-text'),
        wordCount: document.getElementById('word-count'),
        charCount: document.getElementById('char-count'),
        durationDisplay: document.getElementById('duration-display'),
        transcriptPlaceholder: document.getElementById('transcript-placeholder'),
        transcriptContent: document.getElementById('transcript-content'),
        interimText: document.getElementById('interim-text'),
        transcriptArea: document.getElementById('transcript-area'),
        micButton: document.getElementById('mic-button'),
        micIcon: document.getElementById('mic-icon'),
        micIconStop: document.getElementById('mic-icon-stop'),
        micLabel: document.getElementById('mic-label'),
        btnCopy: document.getElementById('btn-copy'),
        btnDownload: document.getElementById('btn-download'),
        btnClear: document.getElementById('btn-clear'),
        btnSettings: document.getElementById('btn-settings'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        settingsModal: document.getElementById('settings-modal'),
        languageSelect: document.getElementById('language-select'),
        historyList: document.getElementById('history-list'),
        historyEmpty: document.getElementById('history-empty'),
        btnClearHistory: document.getElementById('btn-clear-history'),
        canvas: document.getElementById('audio-visualizer'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toast-message'),
        toastIcon: document.getElementById('toast-icon'),
        // Settings inputs
        settingContinuous: document.getElementById('setting-continuous'),
        settingInterim: document.getElementById('setting-interim'),
        settingAutosave: document.getElementById('setting-autosave'),
        settingTimestamps: document.getElementById('setting-timestamps'),
        settingFontSize: document.getElementById('setting-font-size'),
        fontSizeValue: document.getElementById('font-size-value'),
    };

    // ——————————————————————————————————
    // 3. App State
    // ——————————————————————————————————
    const state = {
        isListening: false,
        finalTranscript: '',
        segments: [],          // array of { text, timestamp }
        startTime: null,
        durationInterval: null,
        elapsedSeconds: 0,
        // Audio Visualization
        audioContext: null,
        analyser: null,
        mediaStream: null,
        animationFrame: null,
        // Settings
        settings: {
            continuous: true,
            interimResults: true,
            autoSave: true,
            showTimestamps: false,
            fontSize: 17,
        },
        // History
        history: [],
    };

    // ——————————————————————————————————
    // 4. Settings Persistence
    // ——————————————————————————————————
    function loadSettings() {
        try {
            const saved = localStorage.getItem('voxscribe_settings');
            if (saved) {
                Object.assign(state.settings, JSON.parse(saved));
            }
        } catch (e) { /* ignore */ }
        // Apply to DOM
        dom.settingContinuous.checked = state.settings.continuous;
        dom.settingInterim.checked = state.settings.interimResults;
        dom.settingAutosave.checked = state.settings.autoSave;
        dom.settingTimestamps.checked = state.settings.showTimestamps;
        dom.settingFontSize.value = state.settings.fontSize;
        dom.fontSizeValue.textContent = state.settings.fontSize + 'px';
        document.documentElement.style.setProperty('--transcript-font-size', state.settings.fontSize + 'px');
    }

    function saveSettings() {
        state.settings.continuous = dom.settingContinuous.checked;
        state.settings.interimResults = dom.settingInterim.checked;
        state.settings.autoSave = dom.settingAutosave.checked;
        state.settings.showTimestamps = dom.settingTimestamps.checked;
        state.settings.fontSize = parseInt(dom.settingFontSize.value, 10);
        try {
            localStorage.setItem('voxscribe_settings', JSON.stringify(state.settings));
        } catch (e) { /* ignore */ }
    }

    // ——————————————————————————————————
    // 5. History Persistence
    // ——————————————————————————————————
    function loadHistory() {
        try {
            const saved = localStorage.getItem('voxscribe_history');
            if (saved) state.history = JSON.parse(saved);
        } catch (e) { /* ignore */ }
        renderHistory();
    }

    function saveHistory() {
        try {
            localStorage.setItem('voxscribe_history', JSON.stringify(state.history.slice(0, 50)));
        } catch (e) { /* ignore */ }
    }

    function addToHistory(transcript, durationSec, wordCount) {
        if (!transcript.trim()) return;
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            preview: transcript.substring(0, 120),
            fullText: transcript,
            duration: durationSec,
            words: wordCount,
            language: dom.languageSelect.value,
        };
        state.history.unshift(entry);
        if (state.history.length > 50) state.history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (state.history.length === 0) {
            dom.historyEmpty.style.display = 'block';
            // Remove any history items
            const items = dom.historyList.querySelectorAll('.history-item');
            items.forEach(el => el.remove());
            return;
        }

        dom.historyEmpty.style.display = 'none';
        // Remove existing items
        const items = dom.historyList.querySelectorAll('.history-item');
        items.forEach(el => el.remove());

        state.history.forEach(entry => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.setAttribute('data-id', entry.id);

            const date = new Date(entry.date);
            const dateStr = date.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            el.innerHTML = `
                <div class="history-item-content">
                    <div class="history-item-date">${dateStr}</div>
                    <div class="history-item-preview">${escapeHtml(entry.preview)}${entry.fullText.length > 120 ? '…' : ''}</div>
                    <div class="history-item-meta">
                        <span class="history-meta-tag">${entry.words} words</span>
                        <span class="history-meta-tag">${formatDuration(entry.duration)}</span>
                        <span class="history-meta-tag">${entry.language}</span>
                    </div>
                </div>
            `;

            el.addEventListener('click', () => {
                state.finalTranscript = entry.fullText;
                state.segments = [{ text: entry.fullText, timestamp: '' }];
                renderTranscript();
                updateStats();
                showToast('✅', 'Session loaded');
            });

            dom.historyList.appendChild(el);
        });
    }

    // ——————————————————————————————————
    // 6. Speech Recognition Setup
    // ——————————————————————————————————
    const recognition = new SpeechRecognition();

    function configureRecognition() {
        recognition.lang = dom.languageSelect.value;
        recognition.continuous = state.settings.continuous;
        recognition.interimResults = state.settings.interimResults;
        recognition.maxAlternatives = 1;
    }

    recognition.onstart = () => {
        state.isListening = true;
        updateUI();
    };

    recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                const text = result[0].transcript;
                const timestamp = state.settings.showTimestamps ? formatDuration(state.elapsedSeconds) : '';
                state.segments.push({ text, timestamp });
                state.finalTranscript += text;
            } else {
                interim += result[0].transcript;
            }
        }
        dom.interimText.textContent = interim;
        renderTranscript();
        updateStats();
        scrollToBottom();
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setStatus('error', 'Microphone access denied');
            showToast('❌', 'Microphone permission was denied. Please allow access.');
            stopListening();
        } else if (event.error === 'no-speech') {
            setStatus('idle', 'No speech detected');
            // Don't stop — continuous mode will keep trying
        } else if (event.error === 'network') {
            setStatus('error', 'Network error');
            showToast('❌', 'Network error. Please check your connection.');
            stopListening();
        } else if (event.error === 'aborted') {
            // User aborted — no action
        } else {
            setStatus('error', `Error: ${event.error}`);
        }
    };

    recognition.onend = () => {
        // Restart if continuous and still supposed to be listening
        if (state.isListening && state.settings.continuous) {
            try {
                recognition.start();
            } catch (e) {
                stopListening();
            }
        } else {
            stopListening();
        }
    };

    // ——————————————————————————————————
    // 7. Start / Stop Listening
    // ——————————————————————————————————
    function startListening() {
        configureRecognition();
        state.finalTranscript = '';
        state.segments = [];
        state.elapsedSeconds = 0;
        dom.interimText.textContent = '';
        state.isListening = true;

        try {
            recognition.start();
        } catch (e) {
            // Already started — ignore
        }

        // Timer
        state.startTime = Date.now();
        state.durationInterval = setInterval(() => {
            state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
            dom.durationDisplay.textContent = formatDuration(state.elapsedSeconds);
        }, 1000);

        // Audio visualization
        startAudioVisualization();
        updateUI();
    }

    function stopListening() {
        state.isListening = false;

        try {
            recognition.stop();
        } catch (e) { /* ignore */ }

        // Stop timer
        if (state.durationInterval) {
            clearInterval(state.durationInterval);
            state.durationInterval = null;
        }

        // Stop audio
        stopAudioVisualization();

        // Auto-save to history
        if (state.settings.autoSave && state.finalTranscript.trim()) {
            const wc = countWords(state.finalTranscript);
            addToHistory(state.finalTranscript, state.elapsedSeconds, wc);
        }

        dom.interimText.textContent = '';
        updateUI();
    }

    function toggleListening() {
        if (state.isListening) {
            stopListening();
        } else {
            startListening();
        }
    }

    // ——————————————————————————————————
    // 8. Audio Visualization
    // ——————————————————————————————————
    async function startAudioVisualization() {
        try {
            state.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            state.analyser = state.audioContext.createAnalyser();
            state.analyser.fftSize = 256;

            const source = state.audioContext.createMediaStreamSource(state.mediaStream);
            source.connect(state.analyser);

            dom.canvas.classList.add('active');
            drawVisualizer();
        } catch (e) {
            console.warn('Audio visualization not available:', e);
        }
    }

    function stopAudioVisualization() {
        dom.canvas.classList.remove('active');

        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
            state.animationFrame = null;
        }

        if (state.mediaStream) {
            state.mediaStream.getTracks().forEach(t => t.stop());
            state.mediaStream = null;
        }

        if (state.audioContext) {
            state.audioContext.close().catch(() => {});
            state.audioContext = null;
        }

        // Clear canvas
        const ctx = dom.canvas.getContext('2d');
        ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    }

    function drawVisualizer() {
        if (!state.analyser) return;

        const canvas = dom.canvas;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const bufferLength = state.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            state.animationFrame = requestAnimationFrame(draw);
            state.analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, rect.width, rect.height);

            const barCount = 40;
            const barWidth = rect.width / barCount;
            const gap = 2;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor(i * bufferLength / barCount);
                const value = dataArray[dataIndex] / 255;
                const barHeight = Math.max(2, value * rect.height * 0.85);

                const x = i * barWidth;
                const y = (rect.height - barHeight) / 2;

                // Gradient color based on intensity
                const hue = 240 + value * 60; // blue to cyan
                const alpha = 0.5 + value * 0.5;
                ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;

                ctx.beginPath();
                ctx.roundRect(x + gap / 2, y, barWidth - gap, barHeight, 2);
                ctx.fill();
            }
        }

        draw();
    }

    // ——————————————————————————————————
    // 9. UI Updates
    // ——————————————————————————————————
    function updateUI() {
        if (state.isListening) {
            dom.micButton.classList.add('active');
            dom.micIcon.style.display = 'none';
            dom.micIconStop.style.display = 'flex';
            dom.micLabel.textContent = 'Listening…';
            setStatus('listening', 'Listening…');
        } else {
            dom.micButton.classList.remove('active');
            dom.micIcon.style.display = 'flex';
            dom.micIconStop.style.display = 'none';
            dom.micLabel.textContent = 'Click to start';
            setStatus('idle', 'Ready to listen');
        }
    }

    function setStatus(type, text) {
        dom.statusBar.className = 'status-bar ' + (type === 'listening' ? 'listening' : type === 'error' ? 'error' : '');
        dom.statusText.textContent = text;
    }

    function renderTranscript() {
        if (state.segments.length === 0 && !dom.interimText.textContent) {
            dom.transcriptPlaceholder.style.display = 'flex';
            dom.transcriptContent.innerHTML = '';
            return;
        }

        dom.transcriptPlaceholder.style.display = 'none';

        // Build HTML from segments
        let html = '';
        state.segments.forEach((seg, idx) => {
            const cls = idx === state.segments.length - 1 ? 'transcript-segment new' : 'transcript-segment';
            const tsHtml = seg.timestamp ? `<span class="transcript-timestamp">${seg.timestamp}</span>` : '';
            html += `<span class="${cls}">${tsHtml}${escapeHtml(seg.text)}</span>`;
        });

        dom.transcriptContent.innerHTML = html;
    }

    function updateStats() {
        const text = state.finalTranscript;
        const words = countWords(text);
        const chars = text.length;
        dom.wordCount.textContent = words;
        dom.charCount.textContent = chars;
    }

    function scrollToBottom() {
        dom.transcriptArea.scrollTop = dom.transcriptArea.scrollHeight;
    }

    // ——————————————————————————————————
    // 10. Actions: Copy, Download, Clear
    // ——————————————————————————————————
    function copyTranscript() {
        const text = state.finalTranscript.trim();
        if (!text) {
            showToast('⚠️', 'Nothing to copy');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showToast('✅', 'Copied to clipboard');
        }).catch(() => {
            showToast('❌', 'Failed to copy');
        });
    }

    function downloadTranscript() {
        const text = state.finalTranscript.trim();
        if (!text) {
            showToast('⚠️', 'Nothing to download');
            return;
        }

        const lang = dom.languageSelect.value;
        const date = new Date().toISOString().slice(0, 10);
        const filename = `VoxScribe_Transcript_${date}_${lang}.txt`;

        const header = `VoxScribe — ASR Transcript\nDate: ${new Date().toLocaleString()}\nLanguage: ${lang}\nWords: ${countWords(text)}\n${'—'.repeat(40)}\n\n`;
        const blob = new Blob([header + text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('✅', `Downloaded as ${filename}`);
    }

    function clearTranscript() {
        state.finalTranscript = '';
        state.segments = [];
        dom.transcriptContent.innerHTML = '';
        dom.interimText.textContent = '';
        dom.transcriptPlaceholder.style.display = 'flex';
        updateStats();
        showToast('🗑️', 'Transcript cleared');
    }

    function clearHistory() {
        state.history = [];
        saveHistory();
        renderHistory();
        showToast('🗑️', 'History cleared');
    }

    // ——————————————————————————————————
    // 11. Toast Notification
    // ——————————————————————————————————
    let toastTimer = null;

    function showToast(icon, message) {
        if (toastTimer) clearTimeout(toastTimer);

        dom.toastIcon.textContent = icon;
        dom.toastMessage.textContent = message;
        dom.toast.style.display = 'flex';
        dom.toast.classList.remove('toast-out');

        toastTimer = setTimeout(() => {
            dom.toast.classList.add('toast-out');
            setTimeout(() => {
                dom.toast.style.display = 'none';
                dom.toast.classList.remove('toast-out');
            }, 300);
        }, 2500);
    }

    // ——————————————————————————————————
    // 12. Utility Functions
    // ——————————————————————————————————
    function countWords(text) {
        const trimmed = text.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).length;
    }

    function formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ——————————————————————————————————
    // 13. Event Listeners
    // ——————————————————————————————————
    // Mic button
    dom.micButton.addEventListener('click', toggleListening);

    // Action buttons
    dom.btnCopy.addEventListener('click', copyTranscript);
    dom.btnDownload.addEventListener('click', downloadTranscript);
    dom.btnClear.addEventListener('click', clearTranscript);
    dom.btnClearHistory.addEventListener('click', clearHistory);

    // Settings modal
    dom.btnSettings.addEventListener('click', () => {
        dom.settingsModal.style.display = 'flex';
    });

    dom.btnCloseSettings.addEventListener('click', () => {
        dom.settingsModal.style.display = 'none';
        saveSettings();
    });

    dom.settingsModal.addEventListener('click', (e) => {
        if (e.target === dom.settingsModal) {
            dom.settingsModal.style.display = 'none';
            saveSettings();
        }
    });

    // Settings changes — live update
    dom.settingFontSize.addEventListener('input', () => {
        const val = dom.settingFontSize.value;
        dom.fontSizeValue.textContent = val + 'px';
        document.documentElement.style.setProperty('--transcript-font-size', val + 'px');
        saveSettings();
    });

    [dom.settingContinuous, dom.settingInterim, dom.settingAutosave, dom.settingTimestamps].forEach(el => {
        el.addEventListener('change', saveSettings);
    });

    // Language change
    dom.languageSelect.addEventListener('change', () => {
        if (state.isListening) {
            stopListening();
            setTimeout(() => startListening(), 200);
        }
    });

    // Keyboard shortcut: Space to toggle (when not in input)
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            toggleListening();
        }
    });

    // ——————————————————————————————————
    // 14. Initialize
    // ——————————————————————————————————
    loadSettings();
    loadHistory();
    updateUI();

    // Log to console
    console.log(
        '%c🎙️ VoxScribe ASR Tool %c Loaded successfully',
        'background:#6366f1;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;',
        'color:#94a3b8;'
    );

})();
