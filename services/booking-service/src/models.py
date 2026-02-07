from sqlalchemy import Column, String, TIMESTAMP, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    resource_type = Column(String(20), nullable=False)  # FLIGHT, HOTEL
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(20), nullable=False)  # PENDING, CONFIRMED, CANCELLED
    total_amount = Column(DECIMAL(10, 2), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True))
    passengers = relationship("Passenger", back_populates="booking", cascade="all, delete-orphan")

class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(UUID(as_uuid=True), primary_key=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    title = Column(String(10))
    date_of_birth = Column(TIMESTAMP(timezone=True))
    passport_number = Column(String(50))
    email = Column(String(255))
    phone = Column(String(50))
    booking = relationship("Booking", back_populates="passengers")

class Flight(Base):
    __tablename__ = "flights"

    id = Column(UUID(as_uuid=True), primary_key=True)
    flight_number = Column(String(20), nullable=False)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    departure_time = Column(TIMESTAMP(timezone=True), nullable=False)
    arrival_time = Column(TIMESTAMP(timezone=True), nullable=False)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(20), default='SCHEDULED')
