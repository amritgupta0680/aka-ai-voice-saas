import json
import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import edge_tts

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.services.agent_service import VoiceAgentService
from app.services.analytics_service import PostCallAnalyticsEngine, CallAnalyticsResult
from app.models.schema import CallLog

router = APIRouter()

analytics_engine = PostCallAnalyticsEngine()
SENTENCE_REGEX = re.compile(r'(?<=[.!?\n])\s+')


class VoiceSessionManager:
    """Manages low-latency audio streaming per WebSocket caller with speech-turn safety."""

    def __init__(self, websocket: WebSocket, tenant_id: str):
        self.websocket = websocket
        self.tenant_id = tenant_id
        self.agent_service = VoiceAgentService(tenant_id)
        self.voice = settings.DEFAULT_VOICE
        self.conversation_transcript = []
        self.is_processing = False

    async def stream_tts_audio(self, text: str):
        """Converts text to MP3 audio chunks via Edge-TTS and streams binary frames."""
        try:
            communicate = edge_tts.Communicate(text, self.voice)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    await self.websocket.send_bytes(chunk["data"])
        except Exception as e:
            print(f"[TTS Stream Error]: {e}")

    async def process_user_speech(self, user_text: str):
        """Processes user input, runs RAG + LLM, and streams back text and audio."""
        if self.is_processing:
            print("[WebSocket Warning]: Ignoring duplicate input while agent is busy.")
            return

        self.is_processing = True

        try:
            self.conversation_transcript.append({"sender": "user", "text": user_text})

            await self.websocket.send_text(json.dumps({
                "type": "agent_start",
                "message": "Mute mic during speech"
            }))

            # Await async generate_response call
            agent_response_text = await self.agent_service.generate_response(
                user_text, 
                conversation_history=self.conversation_transcript
            )

            await self.websocket.send_text(json.dumps({
                "type": "text_delta",
                "content": agent_response_text
            }))

            sentences = SENTENCE_REGEX.split(agent_response_text)
            for sentence in sentences:
                if sentence.strip():
                    await self.stream_tts_audio(sentence.strip())

            self.conversation_transcript.append({"sender": "agent", "text": agent_response_text})

            await self.websocket.send_text(json.dumps({
                "type": "agent_end",
                "message": "Unmute mic after audio finishes playing"
            }))

        finally:
            self.is_processing = False

    async def save_call_session_log(self):
        """Saves session transcript and executes post-call analytics asynchronously."""
        if not self.conversation_transcript or len(self.conversation_transcript) < 2:
            return

        print(f"[Analytics Pipeline]: Running sentiment & intent extraction for tenant {self.tenant_id}...")
        
        analytics: CallAnalyticsResult = analytics_engine.analyze_transcript(self.conversation_transcript)

        async with AsyncSessionLocal() as session:
            try:
                log = CallLog(
                    tenant_id=self.tenant_id,
                    caller_id="Web Demo Client",
                    duration_seconds=len(self.conversation_transcript) * 8,
                    transcript=self.conversation_transcript,
                    sentiment_score=analytics.sentiment_score,
                    intent_category=analytics.intent_category,
                    lead_score=analytics.lead_score,
                    summary=f"[{analytics.sentiment_label}] {analytics.call_summary}"
                )
                session.add(log)
                await session.commit()
                print(f"[DB Log]: Saved call log! Sentiment: {analytics.sentiment_label} | Intent: {analytics.intent_category} | Lead Score: {analytics.lead_score}%")
            except Exception as e:
                print(f"[DB Log Error]: Failed to save enriched call log: {e}")


@router.websocket("/ws/call")
async def websocket_call_endpoint(websocket: WebSocket, tenant_id: str = "049e114f-e40a-4e2a-a3e8-07caa56a5ddd"):
    await websocket.accept()
    print(f"[WebSocket]: Client connected for tenant '{tenant_id}'")

    session_manager = VoiceSessionManager(websocket, tenant_id)

    try:
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)

            if data.get("type") == "user_speech":
                user_transcript = data.get("transcript", "")
                if user_transcript.strip():
                    await session_manager.process_user_speech(user_transcript)

            elif data.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        print("[WebSocket]: Client disconnected.")
        await session_manager.save_call_session_log()
    except Exception as e:
        print(f"[WebSocket Error]: {e}")
        await session_manager.save_call_session_log()