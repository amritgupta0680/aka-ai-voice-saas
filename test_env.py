import asyncio
import edge_tts
from app.core.config import settings

async def test_setup():
    print("Checking Gemini Key setup...", "OK" if settings.GEMINI_API_KEY else "MISSING KEY")
    print("Testing Edge-TTS audio generation...")
    communicate = edge_tts.Communicate("Hello! Voice engine setup is complete.", settings.DEFAULT_VOICE)
    
    audio_bytes = 0
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes += len(chunk["data"])
            
    print(f"Edge-TTS generated {audio_bytes} bytes of MP3 audio successfully!")

if __name__ == "__main__":
    asyncio.run(test_setup())