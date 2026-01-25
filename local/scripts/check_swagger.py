#!/usr/bin/env python3
"""
Verify Swagger/OpenAPI documentation for all JourneyIQ services
"""
import requests
import sys

SERVICES = [
    {"name": "API Gateway", "port": 8000},
    {"name": "Auth Service", "port": 8001},
    {"name": "User Service", "port": 8002},
    {"name": "Search Service", "port": 8003},
    {"name": "Pricing Service", "port": 8004},
    {"name": "Inventory Service", "port": 8005},
    {"name": "Booking Service", "port": 8006},
    {"name": "Payment Service", "port": 8007},
    {"name": "Ticketing Service", "port": 8008},
    {"name": "Notification Service", "port": 8009},
    {"name": "Review Service", "port": 8010},
    {"name": "Analytics Service", "port": 8011},
    {"name": "AI Agent Service", "port": 8012},
    {"name": "RAG Ingestion Service", "port": 8013},
    {"name": "Vector Store Service", "port": 8014},
]

def check_swagger():
    print(f"{'Service':<25} | {'Swagger /docs':<15} | {'OpenAPI /openapi.json':<20} | {'Details'}")
    print("-" * 90)
    
    all_ok = True
    
    for service in SERVICES:
        port = service['port']
        name = service['name']
        
        # Check /docs endpoint
        docs_status = "❌ NOT FOUND"
        openapi_status = "❌ NOT FOUND"
        details = ""
        
        try:
            docs_resp = requests.get(f"http://localhost:{port}/docs", timeout=3)
            if docs_resp.status_code == 200:
                docs_status = "✅ AVAILABLE"
            else:
                docs_status = f"❌ {docs_resp.status_code}"
                all_ok = False
        except Exception as e:
            docs_status = f"❌ ERROR"
            details = str(e)[:30]
            all_ok = False
        
        # Check /openapi.json endpoint
        try:
            openapi_resp = requests.get(f"http://localhost:{port}/openapi.json", timeout=3)
            if openapi_resp.status_code == 200:
                openapi_status = "✅ AVAILABLE"
                # Get title from OpenAPI spec
                spec = openapi_resp.json()
                details = spec.get('info', {}).get('title', 'No title')[:30]
            else:
                openapi_status = f"❌ {openapi_resp.status_code}"
                all_ok = False
        except Exception as e:
            openapi_status = f"❌ ERROR"
            all_ok = False
        
        print(f"{name:<25} | {docs_status:<15} | {openapi_status:<20} | {details}")
    
    print("-" * 90)
    return all_ok

if __name__ == "__main__":
    print("\n🔍 Checking Swagger Documentation for All Services\n")
    if check_swagger():
        print("\n✅ All services have Swagger documentation available!")
        sys.exit(0)
    else:
        print("\n⚠️  Some services are missing Swagger documentation")
        sys.exit(1)
