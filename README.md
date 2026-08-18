# AKA AI Voice SaaS

**A multi-tenant, autonomous AI voice operations platform** — real-time voice conversations, intelligent appointment booking, and a live CRM dashboard, built for businesses like restaurants, dental clinics, and law firms.

🔗 **Live Demo:** [aka-ai-voice-saas.vercel.app](https://aka-ai-voice-saas.vercel.app)

---

## Overview

This platform lets any business deploy an AI phone/voice agent that:
- Answers customer questions using a **custom knowledge base** unique to that business
- Books, manages, and tracks appointments or reservations
- Logs every conversation with sentiment analysis and lead scoring
- Operates in complete isolation from other businesses on the same platform (multi-tenancy)

It was built as an end-to-end demonstration of a production-style SaaS architecture: real-time voice AI, retrieval-augmented generation (RAG), a live operations dashboard, and cloud deployment — all from scratch.

---

## Features

### 🎙️ Real-Time Voice Agent
- Browser-based voice conversations using WebSockets
- Speech-to-text via the Web Speech API
- LLM-powered conversational responses (Groq)
- Text-to-speech playback (Edge TTS / ElevenLabs)
- Live visual indicators for "You are speaking," "Agent is speaking," and "Agent is listening"
- Transcript resets cleanly for every new call session

### 🧠 Custom Knowledge Base (RAG)
- Upload a PDF/TXT policy document, or paste text directly
- Documents are chunked and embedded into a **FAISS vector store**, scoped per tenant
- The AI agent answers questions strictly using that business's own knowledge — no cross-tenant leakage
- Clear/reset knowledge base at any time

### 📅 Live Operations & CRM Dashboard
- Real-time table of booked appointments/reservations
- Update or cancel appointment status inline
- Trigger automated outbound reminder calls
- Full call log history with AI-generated summaries, lead scores, and sentiment
- Click into any call to view the full transcript

### 🏢 Multi-Tenant Architecture
- Each business (tenant) gets an isolated:
  - Agent persona and greeting
  - FAISS knowledge base
  - Appointment/CRM data
  - Call logs
- A tenant selection landing screen lets users choose a business workspace before entering

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — async Python web framework
- WebSockets — real-time bidirectional voice/text streaming
- [SQLAlchemy](https://www.sqlalchemy.org/) (async) + [PostgreSQL](https://www.postgresql.org/) — persistent storage
- [FAISS](https://github.com/facebookresearch/faiss) — vector similarity search for RAG
- [LangChain](https://www.langchain.com/) — document chunking and embedding pipeline
- [Groq](https://groq.com/) — LLM inference
- [Edge TTS](https://github.com/rany2/edge-tts) / [ElevenLabs](https://elevenlabs.io/) — text-to-speech

**Frontend**
- [React](https://react.dev/) (Create React App)
- [Lucide React](https://lucide.dev/) — icon set
- Native Web Speech API — browser-based speech recognition
- WebSocket client for live call streaming

**Infrastructure**
- [Docker](https://www.docker.com/) — containerized backend
- [Render](https://render.com/) — backend hosting
- [Vercel](https://vercel.com/) — frontend hosting
- [Neon](https://neon.tech/) — serverless PostgreSQL

---

## Architecture

```
┌─────────────────┐        WebSocket / REST         ┌──────────────────┐
│   React Frontend│ ◄─────────────────────────────► │  FastAPI Backend │
│   (Vercel)      │                                 │  (Render, Docker)│
└─────────────────┘                                 └────────┬─────────┘
                                                                │
                                    ┌───────────────────────────┼────────────────────────────┐
                                    │                           │                            │
                              ┌─────▼─────┐              ┌───────▼───────┐            ┌───────▼───────┐
                              │  Neon     │              │  FAISS Vector │            │  Groq / TTS   │
                              │ PostgreSQL│              │  Store (RAG)  │            │  Engines      │
                              └───────────┘              └───────────────┘            └───────────────┘
```

Each tenant's data — appointments, call logs, and vector knowledge index — is scoped by `tenant_id` at every layer, ensuring strict isolation between businesses.

---

## Getting Started (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com/)
- A PostgreSQL database (local or [Neon](https://neon.tech/) free tier)

### 1. Clone the repository
```bash
git clone https://github.com/amritgupta0680/aka-ai-voice-saas.git
cd aka-ai-voice-saas
```

### 2. Backend setup
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt --break-system-packages
```

Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://user:password@host/dbname
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key   # optional
```

Run the backend:
```bash
python main.py
```
The API will be available at `http://localhost:8000`.

### 3. Frontend setup
```bash
cd softphone-dashboard
npm install
npm start
```
The app will be available at `http://localhost:3000`.

---

## Deployment

This project is deployed using a fully cloud-native, containerized setup:

| Layer         | Service | Notes                                      |
|---------------|---------|---------------------------------------------|
| Backend API   | Render  | Deployed via Docker, auto-deploys on push   |
| Database      | Neon    | Serverless PostgreSQL, persistent free tier |
| Frontend      | Vercel  | Auto-deploys on push, CDN-hosted            |

To deploy your own instance:
1. Fork/clone this repo
2. Create a free PostgreSQL database on [Neon](https://neon.tech/)
3. Deploy the backend to [Render](https://render.com/) as a **Docker web service**, with `DATABASE_URL` and `GROQ_API_KEY` set as environment variables
4. Deploy `softphone-dashboard/` to [Vercel](https://vercel.com/), with `REACT_APP_API_URL` and `REACT_APP_WS_URL` pointing to your Render backend

---

## Project Structure

```
aka-ai-voice-saas/
├── app/
│   ├── api/              # REST & WebSocket route handlers
│   ├── core/             # Database config, settings
│   ├── models/           # SQLAlchemy schema
│   └── rag/               # Knowledge base / FAISS logic
├── softphone-dashboard/
│   └── src/
│       ├── components/    # React components (softphone, dashboard, settings)
│       ├── hooks/         # useVoiceCall (WebSocket + speech logic)
│       └── config/         # API base URL config
├── main.py                # FastAPI app entry point
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## Roadmap

- [ ] **Twilio integration** — replace browser-based voice with real inbound/outbound phone calls
- [ ] Tenant self-signup and onboarding flow
- [ ] Usage-based billing per tenant
- [ ] Multi-language voice support
- [ ] Analytics export (CSV/PDF reports)

---

## License

All rights reserved. This code is shared for portfolio and demonstration purposes only. Reproduction, distribution, or commercial use without explicit written permission is prohibited.

---

## Author

Built by [Amrit Gupta](https://github.com/amritgupta0680)