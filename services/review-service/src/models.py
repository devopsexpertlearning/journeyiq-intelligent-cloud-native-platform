from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Review(Base):
    __tablename__ = "reviews_v2"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    resource_type = Column(String(20), nullable=False) # FLIGHT, HOTEL
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    rating = Column(Integer, nullable=False) # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.datetime.utcnow)

    # Index for fast lookup
    __table_args__ = (
        Index('idx_reviews_resource', 'resource_type', 'resource_id'),
    )
