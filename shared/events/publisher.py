"""
Google Pub/Sub Event Publisher

Shared utility for publishing events to Google Pub/Sub across all services.
"""
import os
import json
import logging
from google.cloud import pubsub_v1
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "journeyiq-prod")
PUBSUB_EMULATOR_HOST = os.getenv("PUBSUB_EMULATOR_HOST")  # For local development

# Initialize publisher
if PUBSUB_EMULATOR_HOST:
    logger.info(f"Using Pub/Sub emulator at {PUBSUB_EMULATOR_HOST}")

publisher = pubsub_v1.PublisherClient()


def publish_event(topic_name: str, event_data: Dict[str, Any], attributes: Dict[str, str] = None) -> str:
    """
    Publish an event to a Pub/Sub topic.
    
    Args:
        topic_name: Name of the topic (e.g., 'booking-events')
        event_data: Event payload as dictionary
        attributes: Optional message attributes for filtering
        
    Returns:
        Message ID from Pub/Sub
        
    Example:
        >>> publish_event('booking-events', {
        ...     'event_type': 'booking.created',
        ...     'booking_id': 'b123',
        ...     'user_id': 'u456'
        ... })
        '1234567890'
    """
    topic_path = publisher.topic_path(PROJECT_ID, topic_name)
    
    # Convert event data to JSON bytes
    message_data = json.dumps(event_data).encode('utf-8')
    
    # Add default attributes
    if attributes is None:
        attributes = {}
    
    attributes['event_type'] = event_data.get('event_type', 'unknown')
    attributes['source_service'] = os.getenv('SERVICE_NAME', 'unknown')
    
    try:
        # Publish message
        future = publisher.publish(topic_path, message_data, **attributes)
        message_id = future.result()
        
        logger.info(f"Published event to {topic_name}: {event_data.get('event_type')} (ID: {message_id})")
        return message_id
        
    except Exception as e:
        logger.error(f"Failed to publish event to {topic_name}: {str(e)}")
        raise


def publish_booking_created(booking_id: str, user_id: str, amount: float, currency: str = "USD") -> str:
    """
    Publish a booking.created event.
    
    Args:
        booking_id: Booking ID
        user_id: User ID
        amount: Booking amount
        currency: Currency code
        
    Returns:
        Message ID
    """
    event_data = {
        'event_type': 'booking.created',
        'booking_id': booking_id,
        'user_id': user_id,
        'amount': amount,
        'currency': currency,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    return publish_event('booking-events', event_data)


def publish_payment_succeeded(payment_id: str, booking_id: str, amount: float) -> str:
    """
    Publish a payment.succeeded event.
    
    Args:
        payment_id: Payment ID
        booking_id: Associated booking ID
        amount: Payment amount
        
    Returns:
        Message ID
    """
    event_data = {
        'event_type': 'payment.succeeded',
        'payment_id': payment_id,
        'booking_id': booking_id,
        'amount': amount,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    return publish_event('payment-events', event_data)


def publish_booking_cancelled(booking_id: str, user_id: str, reason: str = None) -> str:
    """
    Publish a booking.cancelled event.
    
    Args:
        booking_id: Booking ID
        user_id: User ID
        reason: Optional cancellation reason
        
    Returns:
        Message ID
    """
    event_data = {
        'event_type': 'booking.cancelled',
        'booking_id': booking_id,
        'user_id': user_id,
        'reason': reason,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    return publish_event('booking-events', event_data)


# Import datetime for timestamps
from datetime import datetime
