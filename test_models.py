from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

print("--- Listing Available Models for your API Key ---")
try:
    for model in client.models.list():
        print(f"-> {model.name}")
except Exception as e:
    print(f"Error listing models: {e}")