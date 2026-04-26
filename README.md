# AICO — AI Conversation Optimizer

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

This outputs the built extension to the `dist/` folder.

### 4. Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project

The AICO icon will appear in your Chrome toolbar.

---

## Setup

### Add your Gemini API key

1. Click the AICO icon in your toolbar
2. Click the **Settings** (gear) icon to open the Options page
3. Paste your Gemini API key and click **Save**

You can get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Usage

1. Click the AICO icon to open the popup
2. Select the AI model you're targeting from the dropdown
3. Paste your prompt into the text area — a live efficiency score appears instantly
4. Click **Optimize** to generate an improved version
5. Review the rewritten prompt and the savings breakdown (tokens, cost, CO₂, water)
6. Click **Copy** to copy the optimized prompt
7. Open the **Dashboard** to view your cumulative impact over time

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
