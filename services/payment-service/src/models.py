from sqlalchemy import Column, String, TIMESTAMP, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True)
    booking_id = Column(UUID(as_uuid=True), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    status = Column(String(20), nullable=False)  # SUCCEEDED, FAILED, REFUNDED

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    resource_type = Column(String(20), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True))
