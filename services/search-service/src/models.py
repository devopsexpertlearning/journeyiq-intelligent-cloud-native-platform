from sqlalchemy import Column, String, TIMESTAMP, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Flight(Base):
    __tablename__ = "flights"

    id = Column(UUID(as_uuid=True), primary_key=True)
    flight_number = Column(String(20), nullable=False)
    origin = Column(String(3), nullable=False)
    destination = Column(String(3), nullable=False)
    departure_time = Column(TIMESTAMP(timezone=True), nullable=False)
    arrival_time = Column(TIMESTAMP(timezone=True), nullable=False)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(20), default='SCHEDULED')

class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    rating = Column(DECIMAL(2, 1))
    amenities = Column(JSONB)
