# Autonotwin

A virtual avatar assistant with 3D avatar, lip-sync, facial expressions, and chat interface.

## Project Structure

```
├── src/                    # React frontend (Vite + Tailwind)
│   ├── components/         # Avatar, Scene, ChatPanel
│   ├── constants/          # Facial expressions, morph targets, visemes
│   └── hooks/              # useChat (state management + backend integration)
├── backend/                # Express backend (port 3000)
│   ├── modules/            # OpenAI, Local RAG, ElevenLabs, Lip-sync, Voice cloner
│   └── utils/              # File helpers, audio conversion
└── public/models/          # (not in repo) GLB models
    ├── Avatar/             # Avatar .glb files
    ├── Animations/         # Idle, Talking, Angry, Sad, Surprised, etc.
    └── Scene/              # Studio environment .glb
```

## Setup

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
cp .env.example .env      # Add your API keys
npm install
node server.js
```

### Required Assets (not included in repo)
Place these in `public/models/`:
- `Avatar/` — Your avatar `.glb` file
- `Animations/` — Animation `.glb` files (Idle.glb, Talking.glb, Angry.glb, Sad.glb, Surprised.glb, Disappointed.glb, Thoughtfullheadshake.glb)
- `Scene/` — Studio environment `studio.glb`

### Backend Requirements
- Place `rhubarb` lip-sync binary in `backend/bin/`
- Install `ffmpeg` on your system
- Configure `.env` with API keys for OpenAI / ElevenLabs / Local RAG / Voice Cloner

## Features
- 3D avatar with lip-sync and facial expressions
- Chat interface with text and voice input
- Multiple animation support (Idle, Talking, Angry, Sad, Surprised, etc.)
- Change avatar from UI (upload .glb)
- Local RAG integration (Prof-Brain)
- Local voice cloner support
