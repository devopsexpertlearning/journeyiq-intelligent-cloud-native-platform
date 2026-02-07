from sqlalchemy import Column, String, Float, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class SmartDevice(Base):
    __tablename__ = "iot_devices"

    id = Column(UUID(as_uuid=True), primary_key=True)
    device_name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False) # LUGGAGE_TAG, BEACON
    owner_id = Column(UUID(as_uuid=True), nullable=True) # Linked to User
    status = Column(String(20), default="ACTIVE")
    last_seen = Column(TIMESTAMP(timezone=True), nullable=True)
    registered_at = Column(TIMESTAMP(timezone=True), default=datetime.datetime.utcnow)

class DeviceTelemetry(Base):
    __tablename__ = "iot_telemetry"

    id = Column(UUID(as_uuid=True), primary_key=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("iot_devices.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    battery_level = Column(Float, nullable=True)
    sensor_data = Column(JSONB, nullable=True) # Temp, humidity, shock
    timestamp = Column(TIMESTAMP(timezone=True), default=datetime.datetime.utcnow)
