import requests

API_URL = "http://localhost:8000/api/tenants/demo-restaurant-101/knowledge/text"

# Sample knowledge base for a NEW tenant (a pizza restaurant)
restaurant_policy = """
PIZZA PALACE - RESTAURANT POLICY & HOURS (2026)

Operating Hours:
Monday to Sunday: 11:00 AM - 11:00 PM

Pricing & Menu Highlights:
- Margherita Pizza: $14
- Pepperoni Feast: $18
- Garlic Knots: $6

Delivery Policy:
Free delivery on orders over $30. For orders under $30, a flat $4 delivery fee applies.
"""

def test_knowledge_indexing():
    print("--- Testing Dynamic Knowledge Indexing for New Tenant ---")
    response = requests.post(API_URL, json={"content": restaurant_policy})
    print("Response Status Code:", response.status_code)
    print("Response Body:", response.json())

if __name__ == "__main__":
    test_knowledge_indexing()