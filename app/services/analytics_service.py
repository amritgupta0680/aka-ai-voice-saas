import json
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from groq import Groq
from app.core.config import settings


class CallAnalyticsResult(BaseModel):
    """Pydantic schema for structured post-call intelligence."""
    sentiment_score: float = Field(description="Float between -1.0 (very negative) and +1.0 (very positive)")
    sentiment_label: str = Field(description="One of: 'Positive', 'Neutral', 'Negative', 'Frustrated'")
    intent_category: str = Field(description="Primary intent e.g., 'Appointment Booking', 'Pricing Inquiry', 'Policy Question'")
    lead_score: int = Field(description="Lead conversion probability integer between 0 and 100")
    call_summary: str = Field(description="A concise 2-sentence summary of the conversation")
    requires_human_followup: bool = Field(description="True if customer was frustrated or requested human assistance")


class PostCallAnalyticsEngine:
    """Extracts structured intelligence, sentiment, and lead scores from call transcripts."""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def analyze_transcript(self, conversation_history: List[Dict[str, str]]) -> CallAnalyticsResult:
        """Runs JSON-structured extraction over the dialogue history using Llama-3.3-70b."""
        if not conversation_history:
            return CallAnalyticsResult(
                sentiment_score=0.0,
                sentiment_label="Neutral",
                intent_category="Unknown",
                lead_score=0,
                call_summary="No dialogue recorded for this session.",
                requires_human_followup=False
            )

        # Format transcript into plain text block
        formatted_dialogue = "\n".join([
            f"{turn.get('sender', 'unknown').upper()}: {turn.get('text', '')}"
            for turn in conversation_history
        ])

        system_prompt = """
You are an expert Call Center Quality Assurance & Lead Intelligence Analyst.
Analyze the provided transcript and respond ONLY with a valid JSON object strictly matching this schema:

{
  "sentiment_score": float (-1.0 to 1.0),
  "sentiment_label": string ("Positive" | "Neutral" | "Negative" | "Frustrated"),
  "intent_category": string ("Appointment Booking" | "Pricing Inquiry" | "Cancellation" | "General Inquiry"),
  "lead_score": integer (0 to 100),
  "call_summary": string (Concise 2-sentence summary),
  "requires_human_followup": boolean
}

Do not include any intro, markdown formatting, or backticks in your output. Return raw JSON only.
"""

        try:
            response = self.client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this call transcript:\n\n{formatted_dialogue}"}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            raw_json = response.choices[0].message.content.strip()
            data = json.loads(raw_json)
            return CallAnalyticsResult(**data)

        except Exception as e:
            print(f"[Analytics Engine Error]: {e}")
            return CallAnalyticsResult(
                sentiment_score=0.0,
                sentiment_label="Neutral",
                intent_category="General Inquiry",
                lead_score=50,
                call_summary="Automated analysis failed; raw transcript preserved.",
                requires_human_followup=False
            )