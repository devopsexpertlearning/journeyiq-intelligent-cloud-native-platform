    
import requests
import json
import time

SERVICES = [
    {"name": "API Gateway", "url": "http://localhost:8000", "path": "/health"},
    {"name": "Auth Service", "url": "http://localhost:8001", "path": "/health"},
    {"name": "User Service", "url": "http://localhost:8002", "path": "/health"},
    {"name": "Search Service", "url": "http://localhost:8003", "path": "/health"},
    {"name": "Pricing Service", "url": "http://localhost:8004", "path": "/health"},
    {"name": "Inventory Service", "url": "http://localhost:8005", "path": "/health"},
    {"name": "Booking Service", "url": "http://localhost:8006", "path": "/health"},
    {"name": "Payment Service", "url": "http://localhost:8007", "path": "/health"},
    {"name": "Ticketing Service", "url": "http://localhost:8008", "path": "/health"},
    {"name": "Notification Service", "url": "http://localhost:8009", "path": "/health"},
    {"name": "Review Service", "url": "http://localhost:8010", "path": "/health"},
    {"name": "Analytics Service", "url": "http://localhost:8011", "path": "/health"},
    {"name": "AI Agent Service", "url": "http://localhost:8012", "path": "/health"},
    {"name": "RAG Ingestion Service", "url": "http://localhost:8013", "path": "/health"},
    {"name": "Vector Store Service", "url": "http://localhost:8014", "path": "/health"},
]

def check_services():
    print(f"{'Service':<25} | {'Status':<10} | {'Response Time':<10} | {'Message'}")
    print("-" * 65)
    
    all_healthy = True
    
    for service in SERVICES:
        start_time = time.time()
        try:
            response = requests.get(f"{service['url']}{service['path']}", timeout=5)
            elapsed = (time.time() - start_time) * 1000
            
            status = "UP" if response.status_code == 200 else f"DOWN ({response.status_code})"
            msg = response.json() if response.headers.get('content-type') == 'application/json' else response.text[:30]
            
            print(f"{service['name']:<25} | {status:<10} | {elapsed:.0f}ms       | {msg}")
            
            if response.status_code != 200:
                all_healthy = False
                
        except Exception as e:
            print(f"{service['name']:<25} | ERROR      | -          | {str(e)[:30]}")
            all_healthy = False

    print("-" * 65)
    return all_healthy

def check_functionality():
    print("\n[ Functional Checks ]")
    print(f"{'Test Case':<30} | {'Status':<10} | {'Details'}")
    print("-" * 65)

    # 1. Search Verification
    try:
        print(f"{'Search Flights (JFK->LHR)':<30} | ", end="", flush=True)
        resp = requests.get("http://localhost:8003/search/flights", params={"origin": "JFK", "destination": "LHR"}, timeout=5)
        if resp.status_code == 200:
            flights = resp.json().get("flights", [])
            count = len(flights)
            print(f"{'PASS':<10} | Found {count} flights")
        else:
            print(f"{'FAIL':<10} | Status {resp.status_code}")
    except Exception as e:
        print(f"{'ERROR':<10} | {str(e)[:20]}")

    # 2. AI Agent Verification
    try:
        print(f"{'AI Agent Chat (Policy)':<30} | ", end="", flush=True)
        # Verify Agent is Up - Simple Ping/Health first (already done) or dry run
        # Using a simple query if the agent supports it without Auth or with default mock user
        payload = {
            "message": "Hello, are you online?",
            "user_id": "test-user-1"
        }
        # Note: AI Agent usually requires API Key. If mapped correctly, it passes.
        resp = requests.post("http://localhost:8012/agent/chat", json=payload, timeout=10)
        
        if resp.status_code == 200:
            ans = resp.json().get("response", "")
            print(f"{'PASS':<10} | Response: {ans[:40]}...")
        else:
             print(f"{'FAIL':<10} | Status {resp.status_code} - {resp.text[:30]}")
    except Exception as e:
         print(f"{'ERROR':<10} | {str(e)[:20]}")

    print("-" * 65)

if __name__ == "__main__":
    print("Verifying Service Health...\n")
    if check_services():
        print("\n✅ All services are healthy reachable from Host.")
        check_functionality()
    else:
        print("\n❌ Some services failed health check.")
