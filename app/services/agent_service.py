import json
from typing import Dict, Any, List
from groq import Groq
from app.core.config import settings
from app.rag.knowledge_base import KnowledgeBaseManager
from app.services.tools import create_appointment_in_db

ACTIVE_GROQ_MODEL = "openai/gpt-oss-20b"

TENANT_CONFIGS = {
    "049e114f-e40a-4e2a-a3e8-07caa56a5ddd": {
        "name": "Dr. Ava Receptionist",
        "domain": "dental clinic",
        "booking_label": "Dental Service / Procedure"
    },
    "demo-restaurant-101": {
        "name": "Chef Marco Host",
        "domain": "pizza restaurant",
        "booking_label": "Table Reservation / Party Size"
    },
    "law-firm-202": {
        "name": "Counsel Assistant",
        "domain": "law firm",
        "booking_label": "Legal Consultation Type"
    }
}


class VoiceAgentService:
    """Core voice agent handling dynamic multi-tenant prompt engineering, RAG, and tool execution."""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        config = TENANT_CONFIGS.get(tenant_id, {
            "name": "AI Operational Assistant",
            "domain": "business",
            "booking_label": "Appointment / Service Type"
        })
        self.agent_name = config["name"]
        self.domain = config["domain"]
        self.booking_label = config["booking_label"]
        self.rag_manager = KnowledgeBaseManager(tenant_id)
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    async def generate_response(self, user_query: str, conversation_history: List[Dict[str, str]] = None) -> str:
        context_passage = self.rag_manager.query_similar_context(user_query, top_k=2)

        system_instruction = f"""
You are {self.agent_name}, a friendly, empathetic, and professional phone assistant for a {self.domain}.

MANDATORY CONVERSATION RULES:
1. Speak concisely in 1 to 2 short sentences suitable for text-to-speech.
2. DO NOT use markdown, asterisks, bullet points, or special characters.
3. Base your answers strictly on COMPANY KNOWLEDGE.
4. IDENTITY & BOOKING RULE: Before calling `book_appointment`, you MUST ask the caller for their Full Name and target Time Slot if they have not provided them. NEVER book under a generic name like 'user' or 'Customer'.
5. Only execute `book_appointment` once you have: (1) Caller Name, (2) Service/Party Size, and (3) Date & Time.

COMPANY KNOWLEDGE:
{context_passage if context_passage else 'No specific policy document found for this query.'}
"""

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "book_appointment",
                    "description": f"Books a reservation or appointment for this {self.domain} when customer name, service/details, and date/time are provided.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_name": {"type": "string", "description": "Full name of the customer or guest"},
                            "service": {"type": "string", "description": f"Requested details (e.g., {self.booking_label})"},
                            "date_time": {"type": "string", "description": "Date and time for the reservation"}
                        },
                        "required": ["patient_name", "service", "date_time"]
                    }
                }
            }
        ]

        messages = [{"role": "system", "content": system_instruction}]

        if conversation_history:
            for turn in conversation_history[-4:]:
                role = "user" if turn.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": turn.get("text", "")})

        messages.append({"role": "user", "content": user_query})

        try:
            response = self.client.chat.completions.create(
                model=ACTIVE_GROQ_MODEL,
                messages=messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.3,
                max_tokens=180
            )

            response_message = response.choices[0].message

            if response_message.tool_calls:
                for tool_call in response_message.tool_calls:
                    if tool_call.function.name == "book_appointment":
                        args = json.loads(tool_call.function.arguments)
                        
                        tool_result = await create_appointment_in_db(
                            tenant_id=self.tenant_id,
                            patient_name=args.get("patient_name"),
                            service=args.get("service"),
                            date_time=args.get("date_time")
                        )

                        messages.append(response_message)
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": tool_result
                        })

                        second_response = self.client.chat.completions.create(
                            model=ACTIVE_GROQ_MODEL,
                            messages=messages,
                            temperature=0.3,
                            max_tokens=180
                        )
                        return second_response.choices[0].message.content.strip()

            return response_message.content.strip()

        except Exception as e:
            print(f"[Groq Agent Service Error]: {e}")
            return "I apologize, I experienced a brief connection glitch. Could you please repeat that?"