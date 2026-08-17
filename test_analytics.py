from app.services.analytics_service import PostCallAnalyticsEngine

sample_transcript = [
    {"sender": "user", "text": "Hi, I would like to book an appointment for teeth whitening this Saturday at 2 PM."},
    {"sender": "agent", "text": "I'd be happy to schedule that for you! Our in-office teeth whitening is $250. May I have your name to confirm?"},
    {"sender": "user", "text": "My name is Amrit Gupta. $250 sounds great, please confirm it."},
    {"sender": "agent", "text": "Great! Amrit Gupta, your appointment is confirmed for Saturday at 2:00 PM."}
]

def test_analytics():
    print("--- Testing Post-Call Analytics Engine ---")
    engine = PostCallAnalyticsEngine()
    result = engine.analyze_transcript(sample_transcript)
    
    print("\n[Extracted Intelligence]:")
    print(f"• Sentiment Score: {result.sentiment_score} ({result.sentiment_label})")
    print(f"• Intent Category: {result.intent_category}")
    print(f"• Lead Conversion Score: {result.lead_score}%")
    print(f"• Human Follow-up Required: {result.requires_human_followup}")
    print(f"• Executive Summary: {result.call_summary}")

if __name__ == "__main__":
    test_analytics()