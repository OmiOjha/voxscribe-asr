/* =========================================================================
   VoxScribe Pro — Advanced ASR Speech Recognition & Evaluation Tool
   Application Logic (app.js)
   ========================================================================= */

(function () {
    'use strict';

    // ——————————————————————————————————————————————————
    // 1. Feature Detection
    // ——————————————————————————————————————————————————
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;font-family:'Inter',sans-serif;color:#f0f4fc;background:#0a0e17;">
                <div style="background:#111827;padding:3rem;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:500px;">
                    <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
                    <h1 style="font-size:1.5rem;margin-bottom:1rem;color:#f0f4fc;">Browser Not Supported</h1>
                    <p style="color:#94a3b8;line-height:1.6;font-size:0.95rem;">
                        Your browser does not support the <strong>Web Speech API (SpeechRecognition)</strong>.<br><br>
                        Please open this page in <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or <strong>Brave</strong>.
                    </p>
                </div>
            </div>`;
        return;
    }

    // ——————————————————————————————————————————————————
    // 2. DOM Elements Cache
    // ——————————————————————————————————————————————————
    const dom = {
        html: document.documentElement,
        themeSelect: document.getElementById('theme-select'),
        languageSelect: document.getElementById('language-select'),
        statusBar: document.getElementById('status-bar'),
        statusText: document.getElementById('status-text'),
        badgeRec: document.getElementById('badge-rec'),
        wordCount: document.getElementById('word-count'),
        charCount: document.getElementById('char-count'),
        wpmDisplay: document.getElementById('wpm-display'),
        confidenceDisplay: document.getElementById('confidence-display'),
        durationDisplay: document.getElementById('duration-display'),
        // Playback Banner
        audioPlaybackBanner: document.getElementById('audio-playback-banner'),
        recordedAudioPlayer: document.getElementById('recorded-audio-player'),
        btnDownloadAudio: document.getElementById('btn-download-audio'),
        btnDismissAudio: document.getElementById('btn-dismiss-audio'),
        // Transcript Panel
        transcriptArea: document.getElementById('transcript-area'),
        transcriptPlaceholder: document.getElementById('transcript-placeholder'),
        transcriptContent: document.getElementById('transcript-content'),
        interimText: document.getElementById('interim-text'),
        searchInput: document.getElementById('search-input'),
        searchCount: document.getElementById('search-count'),
        // Action Buttons
        btnTtsSpeak: document.getElementById('btn-tts-speak'),
        ttsBtnText: document.getElementById('tts-btn-text'),
        btnCopy: document.getElementById('btn-copy'),
        btnExportMenu: document.getElementById('btn-export-menu'),
        exportDropdown: document.getElementById('export-dropdown'),
        exportTxt: document.getElementById('export-txt'),
        exportSrt: document.getElementById('export-srt'),
        exportJson: document.getElementById('export-json'),
        exportMd: document.getElementById('export-md'),
        btnClear: document.getElementById('btn-clear'),
        // NLP Formatting Toolbar
        btnRemoveFillers: document.getElementById('btn-remove-fillers'),
        btnAutoPunctuate: document.getElementById('btn-auto-punctuate'),
        btnUppercase: document.getElementById('btn-uppercase'),
        btnLowercase: document.getElementById('btn-lowercase'),
        btnTitlecase: document.getElementById('btn-titlecase'),
        // Microphone Control
        micButton: document.getElementById('mic-button'),
        micIcon: document.getElementById('mic-icon'),
        micIconStop: document.getElementById('mic-icon-stop'),
        micLabel: document.getElementById('mic-label'),
        canvas: document.getElementById('audio-visualizer'),
        // Modals & Triggers
        btnWerBenchmark: document.getElementById('btn-wer-benchmark'),
        werModal: document.getElementById('wer-modal'),
        btnCloseWer: document.getElementById('btn-close-wer'),
        werRefText: document.getElementById('wer-ref-text'),
        werHypText: document.getElementById('wer-hyp-text'),
        btnCopyCurrentToHyp: document.getElementById('btn-copy-current-to-hyp'),
        btnCalculateWer: document.getElementById('btn-calculate-wer'),
        werResultsCard: document.getElementById('wer-results-card'),
        resWer: document.getElementById('res-wer'),
        resAccuracy: document.getElementById('res-accuracy'),
        resCer: document.getElementById('res-cer'),
        resDetails: document.getElementById('res-details'),
        alignmentDiff: document.getElementById('alignment-diff'),
        // Voice Commands Modal
        btnHelpCommands: document.getElementById('btn-help-commands'),
        commandsModal: document.getElementById('commands-modal'),
        btnCloseCommands: document.getElementById('btn-close-commands'),
        // Settings Modal
        btnSettings: document.getElementById('btn-settings'),
        settingsModal: document.getElementById('settings-modal'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        settingContinuous: document.getElementById('setting-continuous'),
        settingInterim: document.getElementById('setting-interim'),
        settingCommands: document.getElementById('setting-commands'),
        settingRecordAudio: document.getElementById('setting-record-audio'),
        settingAutosave: document.getElementById('setting-autosave'),
        settingTimestamps: document.getElementById('setting-timestamps'),
        settingFontSize: document.getElementById('setting-font-size'),
        fontSizeValue: document.getElementById('font-size-value'),
        // History
        historyList: document.getElementById('history-list'),
        historyEmpty: document.getElementById('history-empty'),
        btnClearHistory: document.getElementById('btn-clear-history'),
        // Toast
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toast-icon'),
        toastMessage: document.getElementById('toast-message'),
    };

    // ——————————————————————————————————————————————————
    // 3. Application State
    // ——————————————————————————————————————————————————
    const state = {
        isListening: false,
        finalTranscript: '',
        segments: [], // [{ text, timestamp, duration, confidence }]
        startTime: null,
        durationInterval: null,
        elapsedSeconds: 0,
        currentConfidence: null,
        // Audio Visualization & Raw Recording
        audioContext: null,
        analyser: null,
        mediaStream: null,
        mediaRecorder: null,
        audioChunks: [],
        recordedBlob: null,
        recordedAudioUrl: null,
        animationFrame: null,
        // Text-to-Speech
        isSpeaking: false,
        speechSynthesisUtterance: null,
        // Settings
        settings: {
            continuous: true,
            interimResults: true,
            voiceCommands: true,
            recordAudio: true,
            autoSave: true,
            showTimestamps: false,
            fontSize: 17,
            theme: 'midnight'
        },
        history: []
    };

    // ——————————————————————————————————————————————————
    // 4. Persistence (Settings & History)
    // ——————————————————————————————————————————————————
    function loadSettings() {
        try {
            const saved = localStorage.getItem('voxscribe_pro_settings');
            if (saved) Object.assign(state.settings, JSON.parse(saved));
        } catch (e) { }

        dom.settingContinuous.checked = state.settings.continuous;
        dom.settingInterim.checked = state.settings.interimResults;
        dom.settingCommands.checked = state.settings.voiceCommands !== false;
        dom.settingRecordAudio.checked = state.settings.recordAudio !== false;
        dom.settingAutosave.checked = state.settings.autoSave;
        dom.settingTimestamps.checked = state.settings.showTimestamps;
        dom.settingFontSize.value = state.settings.fontSize;
        dom.fontSizeValue.textContent = state.settings.fontSize + 'px';
        dom.html.style.setProperty('--transcript-font-size', state.settings.fontSize + 'px');

        if (state.settings.theme) {
            dom.themeSelect.value = state.settings.theme;
            dom.html.setAttribute('data-theme', state.settings.theme);
        }
    }

    function saveSettings() {
        state.settings.continuous = dom.settingContinuous.checked;
        state.settings.interimResults = dom.settingInterim.checked;
        state.settings.voiceCommands = dom.settingCommands.checked;
        state.settings.recordAudio = dom.settingRecordAudio.checked;
        state.settings.autoSave = dom.settingAutosave.checked;
        state.settings.showTimestamps = dom.settingTimestamps.checked;
        state.settings.fontSize = parseInt(dom.settingFontSize.value, 10);
        state.settings.theme = dom.themeSelect.value;

        try {
            localStorage.setItem('voxscribe_pro_settings', JSON.stringify(state.settings));
        } catch (e) { }
    }

    function loadHistory() {
        try {
            const saved = localStorage.getItem('voxscribe_pro_history');
            if (saved) state.history = JSON.parse(saved);
        } catch (e) { }
        renderHistory();
    }

    function saveHistory() {
        try {
            localStorage.setItem('voxscribe_pro_history', JSON.stringify(state.history.slice(0, 50)));
        } catch (e) { }
    }

    function addToHistory(transcript, durationSec, wordCount, confidence) {
        if (!transcript.trim()) return;
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            preview: transcript.substring(0, 120),
            fullText: transcript,
            duration: durationSec,
            words: wordCount,
            confidence: confidence ? Math.round(confidence * 100) : null,
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
            const items = dom.historyList.querySelectorAll('.history-item');
            items.forEach(el => el.remove());
            return;
        }

        dom.historyEmpty.style.display = 'none';
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
                        ${entry.confidence ? `<span class="history-meta-tag">${entry.confidence}% conf</span>` : ''}
                        <span class="history-meta-tag">${entry.language}</span>
                    </div>
                </div>
            `;

            el.addEventListener('click', () => {
                state.finalTranscript = entry.fullText;
                state.segments = [{ text: entry.fullText, timestamp: '' }];
                renderTranscript();
                updateStats();
                showToast('📋', 'Session transcript restored');
            });

            dom.historyList.appendChild(el);
        });
    }

    // ——————————————————————————————————————————————————
    // 5. Speech Recognition Core
    // ——————————————————————————————————————————————————
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
        let latestConfidence = null;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const candidate = result[0];

            if (candidate && candidate.confidence > 0) {
                latestConfidence = candidate.confidence;
            }

            if (result.isFinal) {
                let text = candidate.transcript;

                // Voice Commands Processing
                if (state.settings.voiceCommands) {
                    text = processVoiceCommands(text);
                }

                if (text) {
                    const timestamp = state.settings.showTimestamps ? formatDuration(state.elapsedSeconds) : '';
                    state.segments.push({
                        text: text,
                        timestamp: timestamp,
                        timeSec: state.elapsedSeconds,
                        confidence: candidate.confidence || 0.95
                    });
                    state.finalTranscript += (state.finalTranscript && !state.finalTranscript.endsWith('\n') && !text.startsWith('\n') ? ' ' : '') + text.trim();
                }
            } else {
                interim += candidate.transcript;
            }
        }

        if (latestConfidence) {
            state.currentConfidence = latestConfidence;
            dom.confidenceDisplay.textContent = Math.round(latestConfidence * 100) + '%';
        }

        dom.interimText.textContent = interim;
        renderTranscript();
        updateStats();
        scrollToBottom();
    };

    recognition.onerror = (event) => {
        console.error('ASR Error:', event.error);
        if (event.error === 'not-allowed') {
            setStatus('error', 'Microphone access denied');
            showToast('❌', 'Microphone permission denied.');
            stopListening();
        } else if (event.error === 'network') {
            setStatus('error', 'Network error');
            showToast('❌', 'Network connection issue with Speech Engine.');
            stopListening();
        } else if (event.error === 'no-speech') {
            setStatus('idle', 'Listening for speech...');
        } else {
            setStatus('error', `Error: ${event.error}`);
        }
    };

    recognition.onend = () => {
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

    // ——————————————————————————————————————————————————
    // 6. Voice Commands Engine
    // ——————————————————————————————————————————————————
    function processVoiceCommands(rawText) {
        let text = rawText;

        const lower = text.trim().toLowerCase();
        if (lower === 'clear transcript' || lower === 'clear all') {
            clearTranscript();
            showToast('🗑️', 'Transcript cleared by voice command');
            return '';
        }
        if (lower === 'stop listening' || lower === 'stop recording') {
            stopListening();
            showToast('⏹️', 'Stopped by voice command');
            return '';
        }

        // Punctuation replacements
        text = text
            .replace(/\b(period|full stop)\b/gi, '.')
            .replace(/\b(comma)\b/gi, ',')
            .replace(/\b(question mark)\b/gi, '?')
            .replace(/\b(exclamation mark|exclamation point)\b/gi, '!')
            .replace(/\b(colon)\b/gi, ':')
            .replace(/\b(semicolon)\b/gi, ';')
            .replace(/\b(new line|new paragraph|enter)\b/gi, '\n');

        return text;
    }

    // ——————————————————————————————————————————————————
    // 7. Start / Stop Listening & Recording
    // ——————————————————————————————————————————————————
    async function startListening() {
        configureRecognition();
        state.finalTranscript = '';
        state.segments = [];
        state.elapsedSeconds = 0;
        state.currentConfidence = null;
        dom.interimText.textContent = '';
        dom.confidenceDisplay.textContent = '--';
        dom.wpmDisplay.textContent = '0';
        state.isListening = true;

        try {
            recognition.start();
        } catch (e) { }

        // Duration & WPM Timer
        state.startTime = Date.now();
        state.durationInterval = setInterval(() => {
            state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
            dom.durationDisplay.textContent = formatDuration(state.elapsedSeconds);
            updateWpm();
        }, 1000);

        // Audio Visualization & Raw Media Recording
        await setupAudioHardware();
        updateUI();
    }

    function stopListening() {
        if (!state.isListening) return;
        state.isListening = false;

        try { recognition.stop(); } catch (e) { }

        if (state.durationInterval) {
            clearInterval(state.durationInterval);
            state.durationInterval = null;
        }

        stopAudioHardware();

        // Auto-save session
        if (state.settings.autoSave && state.finalTranscript.trim()) {
            const wc = countWords(state.finalTranscript);
            addToHistory(state.finalTranscript, state.elapsedSeconds, wc, state.currentConfidence);
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

    // ——————————————————————————————————————————————————
    // 8. Audio Visualizer & MediaRecorder Engine
    // ——————————————————————————————————————————————————
    async function setupAudioHardware() {
        try {
            state.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Visualizer Analyser
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            state.analyser = state.audioContext.createAnalyser();
            state.analyser.fftSize = 256;
            const source = state.audioContext.createMediaStreamSource(state.mediaStream);
            source.connect(state.analyser);

            dom.canvas.classList.add('active');
            drawVisualizer();

            // MediaRecorder for raw audio saving
            if (state.settings.recordAudio && window.MediaRecorder) {
                state.audioChunks = [];
                state.mediaRecorder = new MediaRecorder(state.mediaStream);
                state.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) state.audioChunks.push(e.data);
                };
                state.mediaRecorder.onstop = () => {
                    if (state.audioChunks.length > 0) {
                        state.recordedBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
                        if (state.recordedAudioUrl) URL.revokeObjectURL(state.recordedAudioUrl);
                        state.recordedAudioUrl = URL.createObjectURL(state.recordedBlob);

                        dom.recordedAudioPlayer.src = state.recordedAudioUrl;
                        dom.audioPlaybackBanner.style.display = 'flex';
                    }
                };
                state.mediaRecorder.start(250);
                dom.badgeRec.style.display = 'inline-block';
            }
        } catch (e) {
            console.warn('Audio hardware initialisation failed:', e);
        }
    }

    function stopAudioHardware() {
        dom.canvas.classList.remove('active');
        dom.badgeRec.style.display = 'none';

        if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
            state.mediaRecorder.stop();
        }

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

            const barCount = 48;
            const barWidth = rect.width / barCount;
            const gap = 2;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor(i * bufferLength / barCount);
                const value = dataArray[dataIndex] / 255;
                const barHeight = Math.max(3, value * rect.height * 0.9);

                const x = i * barWidth;
                const y = (rect.height - barHeight) / 2;

                const hue = 200 + value * 80;
                const alpha = 0.4 + value * 0.6;
                ctx.fillStyle = `hsla(${hue}, 85%, 65%, ${alpha})`;

                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x + gap / 2, y, barWidth - gap, barHeight, 2);
                } else {
                    ctx.rect(x + gap / 2, y, barWidth - gap, barHeight);
                }
                ctx.fill();
            }
        }

        draw();
    }

    // ——————————————————————————————————————————————————
    // 9. UI & Stats Computation (WPM, Char, Word)
    // ——————————————————————————————————————————————————
    function updateUI() {
        if (state.isListening) {
            dom.micButton.classList.add('active');
            dom.micIcon.style.display = 'none';
            dom.micIconStop.style.display = 'flex';
            dom.micLabel.textContent = 'Listening (Say "stop listening" to end)';
            setStatus('listening', 'Speech engine active');
        } else {
            dom.micButton.classList.remove('active');
            dom.micIcon.style.display = 'flex';
            dom.micIconStop.style.display = 'none';
            dom.micLabel.textContent = 'Click or press Space to start';
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

        const searchTerm = dom.searchInput.value.trim().toLowerCase();
        let matchTotal = 0;

        let html = '';
        state.segments.forEach((seg, idx) => {
            const cls = idx === state.segments.length - 1 ? 'transcript-segment new' : 'transcript-segment';
            const tsHtml = seg.timestamp ? `<span class="transcript-timestamp">${seg.timestamp}</span>` : '';

            let segmentText = escapeHtml(seg.text);

            if (searchTerm) {
                const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
                const matches = segmentText.match(regex);
                if (matches) matchTotal += matches.length;
                segmentText = segmentText.replace(regex, `<mark class="highlight-match">$1</mark>`);
            }

            html += `<span class="${cls}">${tsHtml}${segmentText}</span> `;
        });

        dom.transcriptContent.innerHTML = html;

        if (searchTerm) {
            dom.searchCount.textContent = matchTotal > 0 ? `${matchTotal} found` : 'no match';
        } else {
            dom.searchCount.textContent = '';
        }
    }

    function updateStats() {
        const text = state.finalTranscript;
        const words = countWords(text);
        const chars = text.length;
        dom.wordCount.textContent = words;
        dom.charCount.textContent = chars;
        updateWpm();
    }

    function updateWpm() {
        const words = countWords(state.finalTranscript);
        if (state.elapsedSeconds > 3 && words > 0) {
            const minutes = state.elapsedSeconds / 60;
            const wpm = Math.round(words / minutes);
            dom.wpmDisplay.textContent = wpm;
        } else {
            dom.wpmDisplay.textContent = '0';
        }
    }

    function scrollToBottom() {
        dom.transcriptArea.scrollTop = dom.transcriptArea.scrollHeight;
    }

    // ——————————————————————————————————————————————————
    // 10. Smart NLP Formatting Engine
    // ——————————————————————————————————————————————————
    dom.btnRemoveFillers.addEventListener('click', () => {
        if (!state.finalTranscript) return;
        const fillerRegex = /\b(um|uh|uhm|erm|err|like\,|you know\,?|basically\,?|literally\,?)\b/gi;
        state.finalTranscript = state.finalTranscript.replace(fillerRegex, '').replace(/\s{2,}/g, ' ').trim();
        state.segments = [{ text: state.finalTranscript, timestamp: '' }];
        renderTranscript();
        updateStats();
        showToast('🧹', 'Removed filler words');
    });

    dom.btnAutoPunctuate.addEventListener('click', () => {
        if (!state.finalTranscript) return;
        let text = state.finalTranscript.trim();
        // Capitalize first character and letters following ., ?, !
        text = text.replace(/(^\s*\w|[.?!]\s*\w)/g, c => c.toUpperCase());
        if (!/[.?!]$/.test(text)) text += '.';
        state.finalTranscript = text;
        state.segments = [{ text: text, timestamp: '' }];
        renderTranscript();
        updateStats();
        showToast('✨', 'Auto-capitalized and formatted');
    });

    dom.btnUppercase.addEventListener('click', () => {
        if (!state.finalTranscript) return;
        state.finalTranscript = state.finalTranscript.toUpperCase();
        state.segments = [{ text: state.finalTranscript, timestamp: '' }];
        renderTranscript();
        showToast('🔤', 'Converted to UPPERCASE');
    });

    dom.btnLowercase.addEventListener('click', () => {
        if (!state.finalTranscript) return;
        state.finalTranscript = state.finalTranscript.toLowerCase();
        state.segments = [{ text: state.finalTranscript, timestamp: '' }];
        renderTranscript();
        showToast('🔡', 'Converted to lowercase');
    });

    dom.btnTitlecase.addEventListener('click', () => {
        if (!state.finalTranscript) return;
        state.finalTranscript = state.finalTranscript.replace(/\b\w/g, l => l.toUpperCase());
        state.segments = [{ text: state.finalTranscript, timestamp: '' }];
        renderTranscript();
        showToast('🏷️', 'Converted to Title Case');
    });

    // ——————————————————————————————————————————————————
    // 11. Text-to-Speech (TTS) Read Aloud Engine
    // ——————————————————————————————————————————————————
    dom.btnTtsSpeak.addEventListener('click', () => {
        const text = state.finalTranscript.trim();
        if (!text) {
            showToast('⚠️', 'No text to read aloud');
            return;
        }

        if (!('speechSynthesis' in window)) {
            showToast('❌', 'Text-to-speech not supported in browser');
            return;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            dom.ttsBtnText.textContent = 'Read Aloud';
            state.isSpeaking = false;
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = dom.languageSelect.value;
        utterance.rate = 1.0;

        utterance.onstart = () => {
            state.isSpeaking = true;
            dom.ttsBtnText.textContent = '⏹️ Stop Reading';
            showToast('🔊', 'Reading transcript aloud...');
        };

        utterance.onend = () => {
            state.isSpeaking = false;
            dom.ttsBtnText.textContent = 'Read Aloud';
        };

        utterance.onerror = () => {
            state.isSpeaking = false;
            dom.ttsBtnText.textContent = 'Read Aloud';
        };

        window.speechSynthesis.speak(utterance);
    });

    // ——————————————————————————————————————————————————
    // 12. Multi-Format Export Engine (TXT, SRT, JSON, MD)
    // ——————————————————————————————————————————————————
    dom.btnExportMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = dom.exportDropdown.style.display === 'flex';
        dom.exportDropdown.style.display = isShown ? 'none' : 'flex';
    });

    document.addEventListener('click', () => {
        dom.exportDropdown.style.display = 'none';
    });

    dom.exportTxt.addEventListener('click', () => downloadFile(createTxtContent(), 'txt', 'text/plain'));
    dom.exportSrt.addEventListener('click', () => downloadFile(createSrtContent(), 'srt', 'text/plain'));
    dom.exportJson.addEventListener('click', () => downloadFile(createJsonContent(), 'json', 'application/json'));
    dom.exportMd.addEventListener('click', () => downloadFile(createMdContent(), 'md', 'text/markdown'));

    function createTxtContent() {
        const header = `VoxScribe Pro — ASR Transcript\nDate: ${new Date().toLocaleString()}\nLanguage: ${dom.languageSelect.value}\nWords: ${countWords(state.finalTranscript)}\n${'—'.repeat(45)}\n\n`;
        return header + state.finalTranscript;
    }

    function createSrtContent() {
        if (state.segments.length === 0) {
            return `1\n00:00:00,000 --> 00:00:05,000\n${state.finalTranscript}\n`;
        }
        let srt = '';
        state.segments.forEach((seg, i) => {
            const startSec = seg.timeSec || i * 3;
            const endSec = startSec + 3;
            srt += `${i + 1}\n${formatSrtTime(startSec)} --> ${formatSrtTime(endSec)}\n${seg.text.trim()}\n\n`;
        });
        return srt;
    }

    function createJsonContent() {
        return JSON.stringify({
            generator: 'VoxScribe Pro ASR Tool',
            timestamp: new Date().toISOString(),
            language: dom.languageSelect.value,
            durationSeconds: state.elapsedSeconds,
            wordCount: countWords(state.finalTranscript),
            charCount: state.finalTranscript.length,
            averageConfidence: state.currentConfidence,
            transcript: state.finalTranscript,
            segments: state.segments
        }, null, 2);
    }

    function createMdContent() {
        return `# 🎙️ VoxScribe ASR Transcript Report\n\n- **Date:** ${new Date().toLocaleString()}\n- **Language:** \`${dom.languageSelect.value}\`\n- **Word Count:** ${countWords(state.finalTranscript)}\n- **Duration:** ${formatDuration(state.elapsedSeconds)}\n\n---\n\n## Transcript\n\n${state.finalTranscript}\n`;
    }

    function downloadFile(content, extension, mime) {
        if (!state.finalTranscript.trim()) {
            showToast('⚠️', 'Transcript is empty');
            return;
        }
        const date = new Date().toISOString().slice(0, 10);
        const filename = `VoxScribe_${date}.${extension}`;
        const blob = new Blob([content], { type: `${mime};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅', `Exported as ${filename}`);
    }

    // Audio download
    dom.btnDownloadAudio.addEventListener('click', () => {
        if (!state.recordedBlob) return;
        const a = document.createElement('a');
        a.href = state.recordedAudioUrl;
        a.download = `VoxScribe_Audio_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('🎵', 'Audio file downloaded');
    });

    dom.btnDismissAudio.addEventListener('click', () => {
        dom.audioPlaybackBanner.style.display = 'none';
    });

    // ——————————————————————————————————————————————————
    // 13. ASR Scientific Benchmark & WER / CER Algorithm
    // ——————————————————————————————————————————————————
    dom.btnWerBenchmark.addEventListener('click', () => {
        dom.werModal.style.display = 'flex';
    });

    dom.btnCloseWer.addEventListener('click', () => {
        dom.werModal.style.display = 'none';
    });

    dom.btnCopyCurrentToHyp.addEventListener('click', () => {
        dom.werHypText.value = state.finalTranscript.trim();
        showToast('📋', 'Copied current transcript to Hypothesis');
    });

    dom.btnCalculateWer.addEventListener('click', () => {
        const ref = dom.werRefText.value.trim();
        const hyp = dom.werHypText.value.trim();

        if (!ref || !hyp) {
            showToast('⚠️', 'Please provide both Reference and Hypothesis');
            return;
        }

        const metrics = calculateWerAndAlignment(ref, hyp);
        const cer = calculateCer(ref, hyp);

        dom.resWer.textContent = (metrics.wer * 100).toFixed(1) + '%';
        dom.resAccuracy.textContent = Math.max(0, 100 - (metrics.wer * 100)).toFixed(1) + '%';
        dom.resCer.textContent = (cer * 100).toFixed(1) + '%';
        dom.resDetails.textContent = `S:${metrics.sub} | D:${metrics.del} | I:${metrics.ins}`;

        // Render Alignment Diff
        let diffHtml = '';
        metrics.alignment.forEach(item => {
            if (item.type === 'C') {
                diffHtml += `<span class="diff-correct">${escapeHtml(item.word)}</span> `;
            } else if (item.type === 'S') {
                diffHtml += `<span class="diff-sub">[S: ${escapeHtml(item.ref)} ➔ ${escapeHtml(item.hyp)}]</span> `;
            } else if (item.type === 'D') {
                diffHtml += `<span class="diff-del">[D: ${escapeHtml(item.word)}]</span> `;
            } else if (item.type === 'I') {
                diffHtml += `<span class="diff-ins">[I: ${escapeHtml(item.word)}]</span> `;
            }
        });

        dom.alignmentDiff.innerHTML = diffHtml;
        dom.werResultsCard.style.display = 'block';
    });

    // Levenshtein Alignment for WER
    function calculateWerAndAlignment(refStr, hypStr) {
        const r = refStr.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim().split(/\s+/).filter(Boolean);
        const h = hypStr.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim().split(/\s+/).filter(Boolean);

        const n = r.length;
        const m = h.length;

        const d = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
        const ops = Array.from({ length: n + 1 }, () => Array(m + 1).fill(''));

        for (let i = 0; i <= n; i++) { d[i][0] = i; ops[i][0] = 'D'; }
        for (let j = 0; j <= m; j++) { d[0][j] = j; ops[0][j] = 'I'; }
        ops[0][0] = 'C';

        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (r[i - 1] === h[j - 1]) {
                    d[i][j] = d[i - 1][j - 1];
                    ops[i][j] = 'C';
                } else {
                    const subCost = d[i - 1][j - 1] + 1;
                    const delCost = d[i - 1][j] + 1;
                    const insCost = d[i][j - 1] + 1;

                    const min = Math.min(subCost, delCost, insCost);
                    d[i][j] = min;
                    if (min === subCost) ops[i][j] = 'S';
                    else if (min === delCost) ops[i][j] = 'D';
                    else ops[i][j] = 'I';
                }
            }
        }

        // Backtrace alignment
        let i = n, j = m;
        let sub = 0, del = 0, ins = 0;
        const alignment = [];

        while (i > 0 || j > 0) {
            const op = ops[i][j];
            if (op === 'C') {
                alignment.unshift({ type: 'C', word: r[i - 1] });
                i--; j--;
            } else if (op === 'S') {
                sub++;
                alignment.unshift({ type: 'S', ref: r[i - 1], hyp: h[j - 1] });
                i--; j--;
            } else if (op === 'D') {
                del++;
                alignment.unshift({ type: 'D', word: r[i - 1] });
                i--;
            } else if (op === 'I') {
                ins++;
                alignment.unshift({ type: 'I', word: h[j - 1] });
                j--;
            }
        }

        const wer = n > 0 ? (sub + del + ins) / n : 0;
        return { wer, sub, del, ins, alignment };
    }

    function calculateCer(ref, hyp) {
        const r = ref.toLowerCase().replace(/\s+/g, '');
        const h = hyp.toLowerCase().replace(/\s+/g, '');
        const n = r.length;
        const m = h.length;
        if (n === 0) return 0;

        const d = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
        for (let i = 0; i <= n; i++) d[i][0] = i;
        for (let j = 0; j <= m; j++) d[0][j] = j;

        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                const cost = r[i - 1] === h[j - 1] ? 0 : 1;
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            }
        }
        return d[n][m] / n;
    }

    // ——————————————————————————————————————————————————
    // 14. Event Listeners & Modals
    // ——————————————————————————————————————————————————
    dom.micButton.addEventListener('click', toggleListening);

    dom.btnCopy.addEventListener('click', () => {
        const text = state.finalTranscript.trim();
        if (!text) { showToast('⚠️', 'Nothing to copy'); return; }
        navigator.clipboard.writeText(text).then(() => showToast('✅', 'Copied to clipboard'));
    });

    dom.btnClear.addEventListener('click', clearTranscript);
    dom.btnClearHistory.addEventListener('click', () => {
        state.history = [];
        saveHistory();
        renderHistory();
        showToast('🗑️', 'History cleared');
    });

    // Theme Selector
    dom.themeSelect.addEventListener('change', () => {
        const val = dom.themeSelect.value;
        dom.html.setAttribute('data-theme', val);
        saveSettings();
    });

    // Search Box
    dom.searchInput.addEventListener('input', renderTranscript);

    // Help Voice Commands Modal
    dom.btnHelpCommands.addEventListener('click', () => {
        dom.commandsModal.style.display = 'flex';
    });
    dom.btnCloseCommands.addEventListener('click', () => {
        dom.commandsModal.style.display = 'none';
    });

    // Settings Modal
    dom.btnSettings.addEventListener('click', () => {
        dom.settingsModal.style.display = 'flex';
    });
    dom.btnCloseSettings.addEventListener('click', () => {
        dom.settingsModal.style.display = 'none';
        saveSettings();
    });

    [dom.settingsModal, dom.werModal, dom.commandsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });

    // Font size live preview
    dom.settingFontSize.addEventListener('input', () => {
        const val = dom.settingFontSize.value;
        dom.fontSizeValue.textContent = val + 'px';
        dom.html.style.setProperty('--transcript-font-size', val + 'px');
        saveSettings();
    });

    [dom.settingContinuous, dom.settingInterim, dom.settingCommands, dom.settingRecordAudio, dom.settingAutosave, dom.settingTimestamps].forEach(el => {
        el.addEventListener('change', saveSettings);
    });

    // Language switch
    dom.languageSelect.addEventListener('change', () => {
        if (state.isListening) {
            stopListening();
            setTimeout(() => startListening(), 250);
        }
    });

    // Keyboard Space shortcut
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
        if (e.code === 'Space') {
            e.preventDefault();
            toggleListening();
        }
    });

    // Clear transcript helper
    function clearTranscript() {
        state.finalTranscript = '';
        state.segments = [];
        dom.transcriptContent.innerHTML = '';
        dom.interimText.textContent = '';
        dom.transcriptPlaceholder.style.display = 'flex';
        updateStats();
        showToast('🗑️', 'Transcript cleared');
    }

    // Toast Helper
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
        }, 2600);
    }

    // Utilities
    function countWords(text) {
        const trimmed = text.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }

    function formatDuration(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function formatSrtTime(totalSec) {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = Math.floor(totalSec % 60);
        const ms = Math.floor((totalSec % 1) * 1000);
        return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
    }

    function pad(num, size) {
        return num.toString().padStart(size, '0');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ——————————————————————————————————————————————————
    // 15. Initialise
    // ——————————————————————————————————————————————————
    loadSettings();
    loadHistory();
    updateUI();

    console.log('%c🎙️ VoxScribe Pro ASR Suite Active', 'background:#6366f1;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px;');
})();
