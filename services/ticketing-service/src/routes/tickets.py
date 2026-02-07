from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import qrcode
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from src.database import get_db
from src.models import Booking, Flight

router = APIRouter(tags=["ticketing"])

# In-memory ticket storage (in production, use database)
tickets_db = {}

# Request/Response Models
class TicketGenerateRequest(BaseModel):
    booking_id: str

class PassengerInfo(BaseModel):
    first_name: str
    last_name: str
    seat_number: Optional[str] = "TBA"

class TicketResponse(BaseModel):
    ticket_id: str
    booking_id: str
    passenger_name: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    seat_number: str
    qr_code_data: str
    status: str
    generated_at: datetime

@router.post("/generate", response_model=TicketResponse, status_code=201)
async def generate_ticket(
    request: TicketGenerateRequest,
    passenger: PassengerInfo,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate an e-ticket for a confirmed booking.
    Creates ticket with QR code for validation.
    """
    # Verify booking exists and is confirmed
    booking_result = await db.execute(
        select(Booking).where(Booking.id == request.booking_id)
    )
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != "CONFIRMED":
        raise HTTPException(status_code=400, detail="Booking must be confirmed to generate ticket")
    
    # Get flight details
    flight_result = await db.execute(
        select(Flight).where(Flight.id == booking.resource_id)
    )
    flight = flight_result.scalar_one_or_none()
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Generate ticket
    ticket_id = str(uuid4())
    generated_at = datetime.utcnow()
    
    # QR code data (contains ticket verification info)
    qr_data = f"TICKET:{ticket_id}|BOOKING:{request.booking_id}|FLIGHT:{flight.flight_number}"
    
    # Store ticket
    ticket = {
        "ticket_id": ticket_id,
        "booking_id": request.booking_id,
        "passenger_name": f"{passenger.first_name} {passenger.last_name}",
        "flight_number": flight.flight_number,
        "origin": flight.origin,
        "destination": flight.destination,
        "departure_time": flight.departure_time,
        "arrival_time": flight.arrival_time,
        "seat_number": passenger.seat_number,
        "qr_code_data": qr_data,
        "status": "VALID",
        "generated_at": generated_at
    }
    
    tickets_db[ticket_id] = ticket
    
    return TicketResponse(**ticket)

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str):
    """Retrieve ticket details by ID."""
    ticket = tickets_db.get(ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return TicketResponse(**ticket)

@router.get("/{ticket_id}/download")
async def download_ticket_pdf(ticket_id: str):
    """
    Download ticket as PDF with QR code.
    Generates a professional e-ticket PDF.
    """
    ticket = tickets_db.get(ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Create PDF in memory - Landscape mode for Boarding Pass look
    buffer = io.BytesIO()
    # Use standard credit card size roughly or landscape letter clipped
    c = canvas.Canvas(buffer, pagesize=(8*inch, 3.5*inch))
    width, height = (8*inch, 3.5*inch)
    
    # --- DESIGN SETTINGS ---
    primary_color = (0.1, 0.4, 0.8)  # JourneyIQ Blue
    text_color = (0.2, 0.2, 0.2)
    
    # --- LEFT SECTION (Main Pass) ---
    # Header Strip - Vertically centered text
    c.setFillColorRGB(*primary_color)
    c.rect(0, height - 0.8*inch, 5.7*inch, 0.8*inch, fill=1, stroke=0)
    
    c.setFillColorRGB(1, 1, 1) # White text
    c.setFont("Helvetica-Bold", 24)
    # Centered vertically in 0.8 inch strip: height - 0.4 - (font_height/2)
    c.drawString(0.3*inch, height - 0.5*inch, "JourneyIQ")
    c.setFont("Helvetica", 10)
    c.drawString(4.2*inch, height - 0.5*inch, "BOARDING PASS")
    
    # Flight Info Row 1 - Improved spacing
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica", 8)
    y_row1_label = height - 1.2*inch
    y_row1_value = height - 1.4*inch
    
    # Column 1: Passenger
    c.drawString(0.3*inch, y_row1_label, "PASSENGER NAME")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.3*inch, y_row1_value, ticket['passenger_name'].upper())
    
    # Column 2: Flight
    c.setFont("Helvetica", 8)
    c.drawString(3.0*inch, y_row1_label, "FLIGHT")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(3.0*inch, y_row1_value, ticket['flight_number'])
    
    # Column 3: Date
    c.setFont("Helvetica", 8)
    c.drawString(4.3*inch, y_row1_label, "DATE")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(4.3*inch, y_row1_value, ticket['departure_time'].strftime('%d %b %Y'))

    # Route Row (Center Section)
    y_route_label = height - 1.9*inch
    y_route_val = height - 2.25*inch
    
    c.setFont("Helvetica", 8)
    c.drawString(0.3*inch, y_route_label, "FROM")
    c.drawString(2.5*inch, y_route_label, "TO")
    
    c.setFont("Helvetica-Bold", 28)
    c.drawString(0.3*inch, y_route_val, ticket['origin'])
    c.drawString(2.5*inch, y_route_val, ticket['destination'])
    
    # Plane Icon (Better looking)
    c.setLineWidth(2.5)
    c.setStrokeColorRGB(*primary_color)
    # Draw arrow path
    p = c.beginPath()
    p.moveTo(1.5*inch, y_route_val + 0.15*inch)
    p.lineTo(2.1*inch, y_route_val + 0.15*inch) # Main line
    # Arrow head
    p.moveTo(2.0*inch, y_route_val + 0.22*inch) 
    p.lineTo(2.15*inch, y_route_val + 0.15*inch)
    p.lineTo(2.0*inch, y_route_val + 0.08*inch)
    c.drawPath(p, stroke=1, fill=0)
    
    # Bottom Details Row
    y_bottom_label = 0.8*inch
    y_bottom_val = 0.5*inch
    
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica", 8)
    c.drawString(0.3*inch, y_bottom_label, "GATE")
    c.drawString(1.3*inch, y_bottom_label, "BOARDING TIME")
    c.drawString(3.0*inch, y_bottom_label, "SEAT")
    c.drawString(4.3*inch, y_bottom_label, "CLASS")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(0.3*inch, y_bottom_val, "D4") 
    c.drawString(1.3*inch, y_bottom_val, ticket['departure_time'].strftime('%H:%M'))
    c.drawString(3.0*inch, y_bottom_val, ticket['seat_number'])
    c.drawString(4.3*inch, y_bottom_val, "ECONOMY")

    # --- DIVIDER ---
    c.setDash(4, 4)
    c.setStrokeColorRGB(0.6, 0.6, 0.6)
    c.line(5.7*inch, 0, 5.7*inch, height)
    c.setDash(1, 0) # Reset dash

    # --- RIGHT SECTION (Stub) ---
    c.setFillColorRGB(*primary_color)
    c.rect(5.7*inch, height - 0.8*inch, 2.3*inch, 0.8*inch, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(5.9*inch, height - 0.5*inch, "JourneyIQ")
    
    c.setFillColorRGB(*text_color)
    st_x = 5.9*inch
    
    # Stub Details
    c.setFont("Helvetica", 7)
    c.drawString(st_x, height - 1.1*inch, "PASSENGER")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(st_x, height - 1.25*inch, ticket['passenger_name'].upper()[:16])
    
    c.setFont("Helvetica", 7)
    c.drawString(st_x, height - 1.5*inch, "FLIGHT")
    c.drawString(st_x + 1.2*inch, height - 1.5*inch, "SEAT")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(st_x, height - 1.65*inch, ticket['flight_number'])
    c.drawString(st_x + 1.2*inch, height - 1.65*inch, ticket['seat_number'])
    
    c.setFont("Helvetica", 7)
    c.drawString(st_x, height - 1.9*inch, f"{ticket['origin']}    {ticket['destination']}")

    # --- QR CODE ON STUB (Fixed positioning) ---
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(ticket['qr_code_data'])
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code to buffer
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    # Draw QR code at bottom of stub without overlap
    c.drawImage(ImageReader(qr_buffer), 6.15*inch, 0.3*inch, width=1.3*inch, height=1.3*inch)
    
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=boarding_pass_{ticket_id[:8]}.pdf"}
    )

@router.post("/{ticket_id}/validate")
async def validate_ticket(ticket_id: str):
    """
    Validate a ticket for boarding.
    Checks if ticket is valid and not already used.
    """
    ticket = tickets_db.get(ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket['status'] == "USED":
        return {
            "valid": False,
            "message": "Ticket already used",
            "ticket_id": ticket_id
        }
    
    if ticket['status'] == "CANCELLED":
        return {
            "valid": False,
            "message": "Ticket cancelled",
            "ticket_id": ticket_id
        }
    
    # Check if flight has departed
    from datetime import timezone
    current_time = datetime.now(timezone.utc)
    
    # Ensure departure_time is offset-aware
    departure_time = ticket['departure_time']
    if departure_time.tzinfo is None:
        departure_time = departure_time.replace(tzinfo=timezone.utc)
        
    if departure_time < current_time:
        return {
            "valid": False,
            "message": "Flight has already departed",
            "ticket_id": ticket_id
        }
    
    return {
        "valid": True,
        "message": "Ticket is valid",
        "ticket_id": ticket_id,
        "passenger_name": ticket['passenger_name'],
        "flight_number": ticket['flight_number'],
        "seat_number": ticket['seat_number']
    }

@router.post("/{ticket_id}/use")
async def use_ticket(ticket_id: str):
    """Mark ticket as used (for boarding)."""
    ticket = tickets_db.get(ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket['status'] == "USED":
        raise HTTPException(status_code=400, detail="Ticket already used")
    
    ticket['status'] = "USED"
    
    return {
        "message": "Ticket marked as used",
        "ticket_id": ticket_id,
        "status": "USED"
    }

@router.get("/")
async def list_tickets():
    """List all tickets (admin endpoint)."""
    return {
        "tickets": [
            {
                "ticket_id": t['ticket_id'],
                "passenger_name": t['passenger_name'],
                "flight_number": t['flight_number'],
                "status": t['status']
            }
            for t in tickets_db.values()
        ],
        "total": len(tickets_db)
    }
