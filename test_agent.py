from app.services.agent_service import VoiceAgentService

def test_voice_agent():
    tenant_id = "049e114f-e40a-4e2a-a3e8-07caa56a5ddd"
    agent = VoiceAgentService(tenant_id=tenant_id)

    print("--- Testing Voice Agent RAG & Response Formatting (Powered by Groq) ---")

    queries = [
        "Hi, what are your opening hours on Saturday?",
        "How much will I be charged for in-office teeth whitening?",
        "Can I cancel my appointment 2 hours before without paying anything?"
    ]

    for query in queries:
        print(f"\nCaller: {query}")
        response = agent.generate_response(query)
        print(f"Agent Response: {response}")

if __name__ == "__main__":
    test_voice_agent()