from sqlalchemy import Column, String, TIMESTAMP, Integer, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True)
    event_type = Column(String(50), nullable=False, index=True) # flight_search, booking_created, etc
    user_id = Column(UUID(as_uuid=True), nullable=True)
    event_metadata = Column(JSONB, nullable=True) # Custom data like "revenue": 100
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.datetime.utcnow, index=True)

class DailyRevenue(Base):
    """Aggregated daily revenue table"""
    __tablename__ = "analytics_daily_revenue"
    
    date = Column(TIMESTAMP(timezone=True), primary_key=True)
    total_revenue = Column(DECIMAL(10, 2), default=0)
    booking_count = Column(Integer, default=0)
