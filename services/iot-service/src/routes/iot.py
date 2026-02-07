from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator
from datetime import datetime
from uuid import uuid4
import logging
from src.database import get_db
from src.models import SmartDevice, DeviceTelemetry

router = APIRouter(tags=["iot"])
logger = logging.getLogger("iot-service")

# Models
class DeviceRegister(BaseModel):
    device_name: str
    device_type: str
    owner_id: Optional[str] = None

class DeviceUpdate(BaseModel):
    latitude: float
    longitude: float
    battery_level: float
    sensor_data: Dict[str, Any] = {}
    
    @field_validator('latitude')
    def validate_latitude(cls, v):
        if not (-90 <= v <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('longitude')
    def validate_longitude(cls, v):
        if not (-180 <= v <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v
        
    @field_validator('battery_level')
    def validate_battery(cls, v):
        if not (0 <= v <= 100):
            raise ValueError('Battery level must be between 0 and 100')
        return v

class DeviceResponse(BaseModel):
    id: str
    device_name: str
    status: str

@router.post("/devices", status_code=201)
async def register_device(
    device: DeviceRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new IoT device."""
    new_device = SmartDevice(
        id=uuid4(),
        device_name=device.device_name,
        device_type=device.device_type,
        owner_id=device.owner_id
    )
    db.add(new_device)
    await db.commit()
    return {"id": str(new_device.id), "status": "REGISTERED", "message": f"Device {device.device_name} registered"}

@router.post("/devices/{device_id}/telemetry")
async def receive_telemetry(
    device_id: str,
    data: DeviceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Receive telemetry data (location, battery, sensors)."""
    # Verify device exists
    device_query = select(SmartDevice).where(SmartDevice.id == device_id)
    result = await db.execute(device_query)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Store telemetry
    telemetry = DeviceTelemetry(
        id=uuid4(),
        device_id=device_id,
        latitude=data.latitude,
        longitude=data.longitude,
        battery_level=data.battery_level,
        sensor_data=data.sensor_data,
        timestamp=datetime.utcnow()
    )
    
    # Update device last seen
    device.last_seen = datetime.utcnow()
    
    db.add(telemetry)
    await db.commit()
    
    return {"status": "success", "timestamp": telemetry.timestamp}

@router.get("/devices/{device_id}/status")
async def get_device_status(
    device_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get latest status and location of a device."""
    device_query = select(SmartDevice).where(SmartDevice.id == device_id)
    device = (await db.execute(device_query)).scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    # Get last location
    telemetry_query = select(DeviceTelemetry).where(DeviceTelemetry.device_id == device_id).order_by(desc(DeviceTelemetry.timestamp)).limit(1)
    telemetry = (await db.execute(telemetry_query)).scalar_one_or_none()
    
    result = {
        "id": str(device.id),
        "name": device.device_name,
        "status": device.status,
        "last_seen": device.last_seen
    }
    
    if telemetry:
        result["location"] = {"lat": telemetry.latitude, "lng": telemetry.longitude}
        result["battery"] = telemetry.battery_level
        result["sensors"] = telemetry.sensor_data
        
    return result
