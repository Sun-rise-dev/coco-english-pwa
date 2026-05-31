# 🦀 Coco — AI English Learning PWA

Your pixel crab friend for learning spoken English.

## Features
- **💬 Chat** — Talk to Coco in Chinese, she replies in British English with translations
- **🔊 Voice Input** — Speech recognition for hands-free practice  
- **📖 Translation** — Translate Chinese to spoken English
- **📚 Vocabulary** — Spaced repetition (SM-2) review
- **🎨 Pixel Art** — 8 emotions, blink animation
- **🌙 Dark Mode** — Full support
- **📱 PWA** — Installable on iOS/Android

## Quick Start
```bash
git clone https://github.com/Sun-rise-dev/coco-english-pwa.git
cd coco-english-pwa
npm install && cd client && npm install && cd ../server && npm install && cd ..
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
npm run dev
```

Open http://localhost:5173

## Tech
React 18 · Tailwind CSS · Framer Motion · Zustand · Express · Claude API · IndexedDB (Dexie) · PWA

## License
MIT
