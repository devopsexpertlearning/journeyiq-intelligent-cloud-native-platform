from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import logging
from src.database import get_db
from src.models import Notification

router = APIRouter(tags=["notifications"])
logger = logging.getLogger("notification-service")

# Request Models
class EmailRequest(BaseModel):
    recipient: str
    subject: str
    content: str  # Can be HTML or Text
    action_url: Optional[str] = None # Link for button
    user_id: Optional[str] = None

class SmsRequest(BaseModel):
    phone_number: str
    message: str
    user_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    type: str
    recipient: str
    status: str
    sent_at: datetime

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from jinja2 import Environment, FileSystemLoader

# Template Setup
template_env = Environment(loader=FileSystemLoader("src/templates"))

# Real SMTP Provider
async def send_mock_email(recipient: str, subject: str, content: str, action_url: Optional[str] = None):
    """Send email via Postfix SMTP with HTML Template."""
    smtp_host = os.getenv("SMTP_HOST", "postfix")
    smtp_port = int(os.getenv("SMTP_PORT", "25"))
    sender = os.getenv("SMTP_EMAIL", "notifications@journeyiq.com")
    
    logger.info(f"Attempting SMTP connection to {smtp_host}:{smtp_port} for {recipient}")
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = sender
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Render HTML
        template = template_env.get_template("email.html")
        html_content = template.render(content=content, action_url=action_url, subject=subject)
        
        # Attach parts
        part1 = MIMEText(content, 'plain') # Fallback
        part2 = MIMEText(html_content, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to Postfix
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.send_message(msg)
            
        logger.info(f"📧 [SMTP SUCCESS] Sent HTML email to {recipient} via Postfix")
        return True
    except Exception as e:
        logger.error(f"❌ [SMTP ERROR] Failed to send: {str(e)}")
        return False

async def send_mock_sms(phone_number: str, message: str):
    """Simulate sending SMS."""
    logger.info(f"📱 [MOCK SMS] To: {phone_number} | Message: {message}")
    return True

@router.post("/email", response_model=NotificationResponse, status_code=201)
async def send_email(
    request: EmailRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Send an email notification."""
    notification_id = str(uuid4())
    
    # Store record
    new_notification = Notification(
        id=notification_id,
        user_id=request.user_id,
        type="EMAIL",
        recipient=request.recipient,
        subject=request.subject,
        content=request.content,
        status="QUEUED"
    )
    db.add(new_notification)
    await db.commit()
    
    # Process in background (Mock)
    background_tasks.add_task(send_mock_email, request.recipient, request.subject, request.content, request.action_url)
    
    # Update status to SENT immediately for mock
    new_notification.status = "SENT"
    new_notification.sent_at = datetime.utcnow()
    await db.commit()
    
    return NotificationResponse(
        id=notification_id,
        type="EMAIL",
        recipient=request.recipient,
        status="SENT",
        sent_at=new_notification.sent_at
    )

@router.post("/sms", response_model=NotificationResponse, status_code=201)
async def send_sms(
    request: SmsRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Send an SMS notification."""
    notification_id = str(uuid4())
    
    # Store record
    new_notification = Notification(
        id=notification_id,
        user_id=request.user_id,
        type="SMS",
        recipient=request.phone_number,
        content=request.message,
        status="QUEUED"
    )
    db.add(new_notification)
    await db.commit()
    
    # Process in background
    background_tasks.add_task(send_mock_sms, request.phone_number, request.message)
    
    # Update status
    new_notification.status = "SENT"
    new_notification.sent_at = datetime.utcnow()
    await db.commit()
    
    return NotificationResponse(
        id=notification_id,
        type="SMS",
        recipient=request.phone_number,
        status="SENT",
        sent_at=new_notification.sent_at
    )

@router.get("/history/{user_id}")
async def get_history(
    user_id: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get notification history for a user."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(desc(Notification.sent_at))
        .limit(limit)
    )
    notifications = result.scalars().all()
    
    return {
        "user_id": user_id,
        "notifications": [
            {
                "id": str(n.id),
                "type": n.type,
                "recipient": n.recipient,
                "subject": n.subject,
                "content": n.content[:50] + "..." if len(n.content) > 50 else n.content,
                "status": n.status,
                "sent_at": n.sent_at
            }
            for n in notifications
        ]
    }
