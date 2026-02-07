from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
from uuid import uuid4
import logging
from src.database import get_db
from src.models import AnalyticsEvent

router = APIRouter(tags=["analytics"])
logger = logging.getLogger("analytics-service")

# Request/Response Models
class EventIngest(BaseModel):
    event_type: str
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = {}

class DashboardStats(BaseModel):
    total_users: int
    total_revenue: float
    total_bookings: int
    active_now: int

class RevenueReport(BaseModel):
    period: str # "last_7_days"
    revenue_data: List[Dict[str, Any]] # date, amount

@router.post("/events", status_code=201)
async def track_event(
    event: EventIngest,
    db: AsyncSession = Depends(get_db)
):
    """Track a system event."""
    new_event = AnalyticsEvent(
        id=uuid4(),
        event_type=event.event_type,
        user_id=event.user_id,
        event_metadata=event.metadata
    )
    db.add(new_event)
    await db.commit()
    return {"status": "recorded", "event_id": str(new_event.id)}

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    """Get high-level dashboard metrics (simulated/aggregated)."""
    
    # In a real system, these would be complex optimized queries or materialized views
    
    # 1. Total Revenue (from booking_created events with revenue metadata)
    # Using raw SQL for JSONB extraction for valid calculation
    revenue_query = text("""
        SELECT SUM(CAST(event_metadata->>'revenue' AS DECIMAL)) 
        FROM analytics_events 
        WHERE event_type = 'booking_created'
    """)
    revenue_result = await db.execute(revenue_query)
    total_revenue = revenue_result.scalar() or 0.0
    
    # 2. Total Bookings
    bookings_query = select(func.count(AnalyticsEvent.id)).where(AnalyticsEvent.event_type == 'booking_created')
    bookings_result = await db.execute(bookings_query)
    total_bookings = bookings_result.scalar() or 0
    
    # 3. Active Users (unique users in last 24h)
    yesterday = datetime.utcnow() - timedelta(hours=24)
    active_query = select(func.count(func.distinct(AnalyticsEvent.user_id))).where(AnalyticsEvent.created_at >= yesterday)
    active_result = await db.execute(active_query)
    active_users = active_result.scalar() or 0
    
    return DashboardStats(
        total_users=active_users, # Using active users as proxy
        total_revenue=float(total_revenue),
        total_bookings=total_bookings,
        active_now=active_users # Simulating active now
    )

@router.get("/reports/revenue", response_model=RevenueReport)
async def get_revenue_report(
    days: int = 7,
    db: AsyncSession = Depends(get_db)
):
    """Get daily revenue breakdown."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Query revenue aggregated by day
    # Note: Requires improved SQL skills for complex date truncation in SQLAlchemy + Postgres
    # Using simplified approach for now: Fetch recent booking events and aggregate in Python
    # For production: Use date_trunc in SQL
    
    result = await db.execute(
        select(AnalyticsEvent)
        .where(
            AnalyticsEvent.event_type == 'booking_created',
            AnalyticsEvent.created_at >= start_date
        )
    )
    events = result.scalars().all()
    
    # Aggregate in memory (acceptable for small scale)
    daily_revenue = {}
    for event in events:
        date_str = event.created_at.strftime('%Y-%m-%d')
        amount = float(event.event_metadata.get('revenue', 0))
        daily_revenue[date_str] = daily_revenue.get(date_str, 0) + amount
        
    revenue_data = [
        {"date": date, "amount": amount}
        for date, amount in sorted(daily_revenue.items())
    ]
    
    return RevenueReport(
        period=f"last_{days}_days",
        revenue_data=revenue_data
    )
