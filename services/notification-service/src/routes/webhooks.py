from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uuid
import asyncio
from src.logging import logger

router = APIRouter()

class WebhookCreate(BaseModel):
    url: HttpUrl
    events: List[str]
    description: Optional[str] = None

class DeviceRegister(BaseModel):
    token: str
    platform: str = "fcm"

# In-memory store for demo
webhooks = {}

@router.post("/webhooks", status_code=201)
async def register_webhook(webhook: WebhookCreate):
    # Journey 15
    webhook_id = f"wh_{uuid.uuid4()}"
    secret = f"whsec_{uuid.uuid4().hex}"
    webhooks[webhook_id] = {
        "url": str(webhook.url),
        "events": webhook.events,
        "secret": secret
    }
    return {"id": webhook_id, "secret": secret, "status": "active"}

@router.post("/webhooks/test", status_code=200)
async def test_webhook(target_url: HttpUrl, background_tasks: BackgroundTasks):
    # Journey 81
    # Simulate delivery in background
    background_tasks.add_task(dummy_delivery, str(target_url))
    return {"status": "queued", "delivery_id": str(uuid.uuid4())}

async def dummy_delivery(url: str):
    logger.info(f"Delivering test webhook to {url}")
    await asyncio.sleep(1) # simulate network

@router.post("/notifications/devices", status_code=201)
async def register_device(device: DeviceRegister):
    # Journey 83
    return {"message": "Device registered", "device_id": str(uuid.uuid4())}

@router.post("/support/tickets", status_code=201)
async def create_support_ticket(subject: str, priority: str):
    # Journey 107
    return {"ticket_id": f"#{uuid.uuid4().hex[:6]}", "status": "open"}

@router.get("/support/faqs")
async def get_faqs(q: str = None):
    # Journey 108
    return [{"question": "How to cancel?", "answer": "Go to My Bookings..."}]

@router.post("/notifications/alerts/price")
async def subscribe_price_alert(flight_id: str, target_price: float):
    # Journey 109
    return {"alert_id": str(uuid.uuid4()), "status": "active"}

