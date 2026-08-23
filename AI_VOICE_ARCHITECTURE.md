# AI Voice Listing Feature: Tech Architecture (In Simple Terms)

This document explains the technology and APIs used to build the "AI Voice Listing" feature in StockBridge, broken down into simple, easy-to-understand concepts.

## The Big Picture
The AI Voice Listing feature allows a user (like a shopkeeper or distributor) to speak into their device in their native language (such as Hindi, Bengali, Marathi, or English) to create a product listing. The app listens, understands the speech, extracts the important details (product name, price, quantity, expiry date), and then reads those details back to the user to confirm.

---

## 1. Frontend (The User's Screen)
This is what the user interacts with in their browser (built using **React** and **TypeScript**).

* **Microphone Access & Audio Visualizer**
  * **Tech Used:** `Web Audio API` & `MediaDevices API`
  * **What it does:** This asks for permission to use the user's microphone. It also powers the moving audio waves (the visualizer) on the screen so the user knows the app is actively listening to their voice.

* **Speech-to-Text (Listening to the user)**
  * **Tech Used:** `Web Speech API` (specifically `SpeechRecognition`)
  * **What it does:** This capability is built directly into modern browsers (like Chrome or Edge). It takes the live audio of the user speaking and converts it into readable text (a transcript) in real-time. It supports multiple regional Indian languages.

* **Text-to-Speech (Talking back to the user)**
  * **Tech Used:** `Web Speech API` (specifically `SpeechSynthesis`)
  * **What it does:** Once the product details are extracted, the app reads a summary back to the user (a "voiceover"). It automatically searches the user's device for a natural-sounding voice that matches their chosen language (e.g., a native Hindi voice for Hindi text).

---

## 2. Backend (The Server Brain)
This is the hidden server that processes the text and understands the business context (built with **Node.js** and **Express**).

* **The AI Brain (Understanding the text)**
  * **Tech Used:** `Google Generative AI API` (Gemini 3.6 Flash model via `@google/generative-ai` SDK)
  * **What it does:** 
    * **Data Extraction:** It reads the raw, messy transcript (e.g., "Mere paas 50 packet tel hai 100 rupaye me") and acts like a smart human assistant. It pulls out clean, structured data like `title`, `pricePerUnit`, `quantity`, and `category`. Crucially, it is programmed to understand Indian conversational words and measurements (like "bori", "katta", "peti", "darjan").
    * **Voiceover Scripting:** It also creates a polite, natural-sounding summary script in the user's native language (e.g., "Namaste! Here are your listing details...") for the browser to read out loud.

* **The Backup Plan (Local Fallback Parser)**
  * **Tech Used:** Custom Regular Expressions (Regex) and Keyword Heuristics
  * **What it does:** If the Google AI API is ever down, offline, or missing an API key, the server has a built-in backup. It looks for specific keywords (like "kg", "rupees", or number words like "sau", "pachaas") to manually guess the product details without needing advanced AI. This ensures the voice feature never completely breaks for the user.

---

## 3. How It All Connects (The Step-by-Step Flow)

1. **User Speaks:** The frontend uses the browser's `Web Speech API` to convert the voice into raw text.
2. **Text Sent to Server:** The frontend sends this raw text to the backend API (`POST /api/voice/parse`).
3. **AI Magic:** The backend asks the **Google Gemini AI** to organize the messy text into clean product data (or uses the backup parser if the AI is unavailable).
4. **Data Returned:** The structured data is sent back to the frontend to fill out the listing form automatically.
5. **Voiceover Creation:** The frontend asks the backend (`POST /api/voice/voiceover`) to write a polite summary script in the local language based on the extracted data.
6. **Confirmation:** The frontend uses the browser's `SpeechSynthesis` to read that summary script out loud to the user so they can confirm it is correct.
