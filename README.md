# FIR Sahulat AI

An AI-powered web application that helps Pakistani citizens draft a First Information Report (FIR) step by step, in Urdu or English, using plain conversational language. Built with React, TypeScript, and Google Gemini.

Live App: https://ai.studio/apps/f44dedf1-d21e-425b-8dc5-a6b320295185


## Problem

Filing an FIR is legally complex and intimidating for most citizens. Low legal literacy, language barriers, and unfamiliarity with applicable law sections leave countless incidents unreported. FIR Sahulat AI removes these barriers by acting as an AI legal guide accessible from any browser.


## What It Does

Users describe their situation in plain Urdu or English. The Gemini-powered AI asks follow-up questions, identifies relevant legal provisions, and produces a properly structured FIR draft the user can take to a police station. No legal knowledge is required.


## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| AI Model | Google Gemini API |
| Translations | Custom Urdu and English i18n module |
| Hosting | Google AI Studio |


## Project Structure

```
FIR-Sahulat-AI/
├── App.tsx              # Root application component
├── index.tsx            # React entry point
├── types.ts             # TypeScript interfaces and types
├── translations.ts      # Urdu and English string definitions
├── services/            # Gemini API communication modules
├── index.html           # HTML shell
├── vite.config.ts       # Vite build configuration
└── package.json         # Dependencies and scripts
```


## Running Locally

Prerequisites: Node.js v18 or higher

1. Clone the repository

```
git clone https://github.com/Fiazbhk/FIR-Sahulat-AI.git
cd FIR-Sahulat-AI
```

2. Install dependencies

```
npm install
```

3. Create a .env.local file in the project root and add your Gemini API key

```
GEMINI_API_KEY=your_gemini_api_key_here
```

You can get a free API key from https://aistudio.google.com/app/apikey

4. Start the development server

```
npm run dev
```

The app will run at http://localhost:5173 by default.

5. To build for production

```
npm run build
```


## Key Features

- Conversational AI guide for FIR drafting powered by Google Gemini
- Full bilingual support in Urdu and English
- Automatic identification of relevant legal sections based on incident type
- Clean, browser-based interface with no installation required for end users
- Structured FIR output ready for submission at a police station


## Social Impact

Pakistan's legal literacy rate is critically low. FIR Sahulat AI puts AI-powered legal guidance directly in the hands of citizens who cannot afford a lawyer, with a practical, immediately usable output. It is a demonstration of generative AI applied to a real civic problem.


## Team

This project was built by a team of four for the hackathon.

| Name | Role |
|---|---|
| Muhammad Fiaz | Team Lead and AI Engineer |
| Taskeen Zahra | Content and Demo |
| Muhammad Saad Umar | Research and Legal Domain |
| Abdul Rehman | UI Review and QA |
