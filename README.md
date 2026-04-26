# AICO — AI Conversation Optimizer

![Alt text](public/icons/mainicon.png)


A Chrome extension that analyzes and optimizes your AI prompts for clarity, efficiency, and reduced environmental impact. Get better results from AI while spending less — in tokens, cost, CO₂, and water.

## Features

- **Prompt scoring** — detects filler words, vagueness, repetition, structural gaps, and contradictions
- **One-click optimization** — rewrites your prompt using Google Gemini
- **Per-model metrics** — see real cost, energy, water, and CO₂ estimates for GPT-4o, Claude, Gemini, Llama, DeepSeek, and more
- **Session dashboard** — tracks your cumulative savings over time
- **Right-click to optimize** — select text on any page and optimize from the context menu

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- Google Chrome (or any Chromium-based browser)
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/jespernguyen/AICO.git
cd AICO
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

```bash
npm run build
```

This outputs the built extension to the `dist/` folder (found in the AICO file directory).

### 4. Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. Find the extensions icon (puzzle icon)
6. Navigate to AICO, then press the pin button.

The AICO icon will appear in your Chrome toolbar.

---

## Setup

### Get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Select **Create API key in new project** (or choose an existing Google Cloud project)
5. Copy the generated API key — save it somewhere safe, you won't be shown it again

### Add your Gemini API key to AICO

1. Click the AICO icon in your Chrome toolbar
2. Right click on the icon to open the Options page
3. Paste your API key into the input field
4. Click **Save**

The key is stored in Chrome's sync storage and will persist across sessions.

---

## Usage

1. Click the AICO icon to open the popup
2. Select the AI model you're targeting from the dropdown
3. Paste your prompt into the text area — a live efficiency score appears instantly
4. Use Quick Trim for a fast preliminary optimization, before any API call.
5. Click **Optimize** to generate an improved version
6. Review the rewritten prompt and the savings breakdown (tokens, cost, CO₂, water)
7. Click **Copy** to copy the optimized prompt
8. Open the **Dashboard** to view your cumulative impact over time

---

## Development

To run in development mode with hot reload:

```bash
npm run dev
```

Then load the `dist/` folder in Chrome as described above. Changes will rebuild automatically.

---

## Tech Stack

- React 18 + TypeScript
- Vite + CRXJS (Chrome extension bundler)
- TailwindCSS
- compromise (NLP)
- js-tiktoken (token counting)
- Recharts (data visualization)
- Google Gemini API

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss any significant changes.

---

## License

MIT
