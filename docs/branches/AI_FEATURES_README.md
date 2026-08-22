# 🎙️ StockBridge — AI Features Branch Documentation

> **Branch:** `ai-features`  
> **Focus:** Multilingual Speech-to-Listing Engine, Gemini LLM Inventory Extraction, and Regional Indian Voiceover Audio Synthesizer

---

## 📖 Overview

The `ai-features` branch extends StockBridge with **Bharat-first Voice AI capabilities**. It eliminates digital friction for local merchants, shopkeepers, and warehouse managers by allowing them to post surplus inventory simply by speaking in their native language, accompanied by instant voice verification.

---

## 🌟 Key Features in `ai-features`

### 1. Multilingual Speech-to-Listing Engine
- **Voice-First Input**: Merchants tap the microphone and speak naturally in their regional language (*Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, or English*).
- **Audio Waveform Visualizer**: Live frequency visualizer tracking microphone decibel levels in real time using the Web Audio API.
- **Smart Script Auto-Detection**: Automatically identifies the input language and native script (Devanagari, Tamil, Telugu, Bengali, Gujarati, Gurmukhi, etc.) directly from spoken/typed transcripts.

### 2. Gemini 3.6 Flash Structured Extraction & Resilience
- **LLM Pipeline**: Converts unformatted colloquial voice transcripts into structured listing JSON schemas conforming to StockBridge database rules.
- **Dynamic Field Mapping**:
  - Translates regional colloquial units (*"bori"*, *"katte"*, *"peti"*, *"darjan"*, *"pauchi"*) into standard units (`bags`, `boxes`, `pieces`, `packets`, `litres`, `kg`).
  - Automatically calculates unit price and total lot valuation from colloquial totals (e.g. *"5000 rupaye me 50 packet"* $\rightarrow$ ₹100/unit).
  - Determines expiration windows with minimum 10-day safety guards.
  - Automatically classifies **Urgency Level** (`high`, `medium`, `low`) recognizing explicit priority statements and distress liquidation phrases while smartly filtering negations (*"koi jaldi nahi"*).
- **Dynamic Match Confidence**: Evaluates field extraction completeness, dynamically scoring listings from **45% up to 98% Match**.
- **Resilient Multi-Tier Fallback**: High-performance local rule-based regex extractors operate seamlessly on both client and server if network connectivity or LLM API quotas are reached.

### 3. AI Native Voiceover Summary Bar
- **Regional Audio Readout**: Synthesizes a warm, concise spoken summary of the extracted listing in the merchant's selected native language before publishing.
- **10 Regional Indian Languages**:
  1. **हिन्दी / Hinglish** (`hi-IN`)
  2. **English (India)** (`en-IN`)
  3. **தமிழ்** - Tamil (`ta-IN`)
  4. **తెలుగు** - Telugu (`te-IN`)
  5. **मराठी** - Marathi (`mr-IN`)
  6. **বাংলা** - Bengali (`bn-IN`)
  7. **ગુજરાતી** - Gujarati (`gu-IN`)
  8. **ಕನ್ನಡ** - Kannada (`kn-IN`)
  9. **മലയാളം** - Malayalam (`ml-IN`)
  10. **ਪੰਜਾਬੀ** - Punjabi (`pa-IN`)
- **Player Controls**: Play, Pause, Resume, Stop, and Speech Speed adjustment (`1.0x` / `1.25x`).
- **Live Audio Equalizer**: Visual animated equalizer bars pulsing during spoken readout.
- **View Spoken Script Accordion**: Expandable view allowing merchants to read the verbatim regional transcript.
- **Clean Voice Narration**: Speaks only essential commercial facts (Product, Quantity, Unit, Price, Total Value, Expiry Date, Urgency) while keeping internal notes clean.

---

## 🛠️ Tech Architecture

```
[Merchant Voice (10 Indian Languages)]
                 │ Web Speech API / Mic Stream
                 ▼
      [Speech-to-Text Transcript]
                 │ POST /api/voice/parse
                 ▼
  ┌────────────────────────────────────────────────────────┐
  │         Google Gemini 3.6 Flash / Fallback Engine      │
  │  • Entity Extraction • Unit Normalization • Urgency    │
  │  • Expiry Dating • Dynamic Confidence Scoring          │
  └──────────────────────────┬─────────────────────────────┘
                             │ Structured Listing JSON
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │             AI Voiceover Audio Generator               │
  │  • POST /api/voice/voiceover (10 Native Scripts)       │
  │  • Client Web Speech Synthesis + Dynamic Voice Matcher │
  │  • Audio Visualizer Equalizer + Rate Controller        │
  └────────────────────────────────────────────────────────┘
```
