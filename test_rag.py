import os
from app.rag.knowledge_base import KnowledgeBaseManager

# Sample clinic document
SAMPLE_CLINIC_POLICY = """
APEX DENTAL CARE - CLINIC GUIDELINES & PRICING (2026)

Operating Hours:
Mon-Fri: 8:00 AM - 7:00 PM
Saturday: 9:00 AM - 3:00 PM
Sunday: Closed for routine appointments (Emergency on-call available).

Pricing & Services:
- Regular Dental Checkup & Cleaning: $80
- Teeth Whitening (In-Office): $250
- Root Canal Treatment: $600 to $900 depending on tooth complexity.
- Dental Implant Consultation: Free for first-time patients.

Cancellation & Rescheduling Policy:
Patients must provide at least 24 hours advance notice for cancellations. 
Cancellations made less than 24 hours prior to appointment will incur a $30 late fee.

Insurance & Payment:
We accept Delta Dental, MetLife, Cigna, and Aetna. Payment is due at the time of service.
"""

def test_rag_pipeline():
    tenant_id = "049e114f-e40a-4e2a-a3e8-07caa56a5ddd"  # Sample tenant ID from our DB step
    print(f"Creating FAISS vector index for tenant '{tenant_id}'...")
    
    rag_manager = KnowledgeBaseManager(tenant_id)
    rag_manager.create_index_from_text(SAMPLE_CLINIC_POLICY)
    print("Vector index created and saved to disk successfully!")

    print("\nTesting semantic retrieval...")
    test_queries = [
        "How much does teeth whitening cost?",
        "What happens if I cancel my appointment late?",
        "Do you accept Cigna insurance?"
    ]

    for q in test_queries:
        print(f"\n[Caller Question]: {q}")
        retrieved_context = rag_manager.query_similar_context(q)
        print(f"[Retrieved Knowledge Chunk]:\n{retrieved_context}")

if __name__ == "__main__":
    test_rag_pipeline()