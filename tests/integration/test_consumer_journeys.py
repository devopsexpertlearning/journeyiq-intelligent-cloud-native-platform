import requests
import uuid
import pytest

BASE_URL = "http://localhost:8000" # Gateway or Service direct URL (Assuming direct for now or Gateway routing)
# For this script we will use service URLs directly since we haven't set up Gateway routing locally
AUTH_URL = "http://localhost:8001"
USER_URL = "http://localhost:8002"
BOOKING_URL = "http://localhost:8004"
SEARCH_URL = "http://localhost:8003" 
PAYMENT_URL = "http://localhost:8006"
NOTIF_URL = "http://localhost:8007"
INVENTORY_URL = "http://localhost:8005"

user_data = {
    "email": f"test_{uuid.uuid4()}@example.com",
    "password": "password123",
    "full_name": "Test User"
}
access_token = ""
user_id = ""

def test_01_register_login():
    # Journey 1
    global access_token, user_id
    # Register
    resp = requests.post(f"{AUTH_URL}/auth/register", json=user_data)
    assert resp.status_code == 201
    
    # Login
    resp = requests.post(f"{AUTH_URL}/auth/login", json={"email": user_data["email"], "password": user_data["password"]})
    assert resp.status_code == 200
    data = resp.json()
    access_token = data["access_token"]
    # Decode token to get user_id (Mocking decode)
    # In real test we decode JWT. Here we assume we can get user_id from register if needed, 
    # but let's assume login returns it or we don't need it yet.

def test_02_create_api_key():
    # Journey 11
    resp = requests.post(f"{AUTH_URL}/auth/api-keys", json={"name": "test-key"})
    assert resp.status_code == 200
    assert "sk-live-" in resp.json()["api_key"]

def test_03_create_service_account():
    # Journey 12
    resp = requests.post(f"{AUTH_URL}/auth/service-accounts", json={"name": "ci-bot", "role": "admin"})
    assert resp.status_code == 200
    assert "sa_" in resp.json()["client_id"]

def test_04_verify_age():
    # Journey 74
    resp = requests.post(f"{AUTH_URL}/auth/verify-age", json={"dob": "2000-01-01"})
    assert resp.status_code == 200
    assert resp.json()["verified"] is True

def test_05_register_webhook():
    # Journey 15
    resp = requests.post(f"{NOTIF_URL}/webhooks", json={
        "url": "https://example.com/callback",
        "events": ["booking.created"]
    })
    assert resp.status_code == 201
    assert "whsec_" in resp.json()["secret"]

def test_06_bulk_search():
    # Journey 23
    payload = {
        "queries": [
            {"origin": "JFK", "destination": "LHR"},
            {"origin": "SFO", "destination": "NRT"}
        ]
    }
    resp = requests.post(f"{SEARCH_URL}/search/flights/bulk", json=payload)
    assert resp.status_code == 200
    assert len(resp.json()["results"]) == 2

def test_07_multicity_search():
    # Journey 33
    payload = {
        "legs": [
            {"origin": "JFK", "destination": "LHR"},
            {"origin": "LHR", "destination": "CDG"}
        ]
    }
    resp = requests.post(f"{SEARCH_URL}/search/flights/multicity", json=payload)
    assert resp.status_code == 200
    assert "itinerary" in resp.json()

def test_08_inventory_ingest():
    # Journey 24
    payload = {
        "flights": [{"id": "f1"}],
        "hotels": []
    }
    resp = requests.post(f"{INVENTORY_URL}/inventory/ingest", json=payload)
    assert resp.status_code == 202
    assert "job_id" in resp.json()

def test_09_localization_header():
    # Journey 40
    headers = {"Accept-Language": "es-ES"}
    resp = requests.get(f"{INVENTORY_URL}/flights/f123", headers=headers)
    assert resp.status_code == 200
    # Note: Description check depends on mock data
    assert "Vuelo directo" in resp.json()["description"]

def test_10_apply_promotion():
    # Journey 28
    resp = requests.post(f"{PAYMENT_URL}/billing/promotions", json={"code": "SUMMER2024"})
    assert resp.status_code == 200
    assert resp.json()["credit_applied"] == 50.0

def test_11_get_invoice_pdf():
    # Journey 27
    resp = requests.get(f"{PAYMENT_URL}/invoices/inv-123/pdf")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"

def test_12_cancel_booking():
    # Journey 22
    resp = requests.delete(f"{BOOKING_URL}/bookings/b-123")
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"

def test_13_export_bookings():
    # Journey 17
    resp = requests.get(f"{BOOKING_URL}/export")
    assert resp.status_code == 200
    assert "csv" in resp.headers["content-type"]

def test_14_user_deactivation():
    # Journey 19 (Assuming we have a user_id from somewhere or mock it)
    uid = "u-123"
    resp = requests.post(f"{USER_URL}/{uid}/deactivate")
    assert resp.status_code == 200 
