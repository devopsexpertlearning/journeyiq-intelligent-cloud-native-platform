from sqlalchemy import Column, String, TIMESTAMP, text, DECIMAL, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Flight(Base):
    __tablename__ = "flights"
    id = Column(UUID(as_uuid=True), primary_key=True)
    flight_number = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(TIMESTAMP(timezone=True), nullable=False)
    arrival_time = Column(TIMESTAMP(timezone=True), nullable=False)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String, server_default='SCHEDULED')

class Hotel(Base):
    __tablename__ = "hotels"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    rating = Column(DECIMAL(2, 1))
    amenities = Column(JSONB)

class Seat(Base):
    __tablename__ = "seats"
    id = Column(UUID(as_uuid=True), primary_key=True)
    flight_id = Column(UUID(as_uuid=True), ForeignKey("flights.id"))
    seat_number = Column(String, nullable=False)
    class_ = Column("class", String, nullable=False)
    is_available = Column(Boolean, server_default='true')

class Room(Base):
    __tablename__ = "rooms"
    id = Column(UUID(as_uuid=True), primary_key=True)
    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.id"))
    room_number = Column(String, nullable=False)
    type = Column(String, nullable=False)
    price_night = Column(DECIMAL(10, 2), nullable=False)
    is_available = Column(Boolean, server_default='true')
