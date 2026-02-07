import json
from google.cloud import pubsub_v1
import os
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger("events")

class EventProducer:
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "journeyiq-local")
        # In local dev, we might use an emulator or skip.
        # For this contract, we check if CREDENTIALS exist or emulator env var is set
        self.client = None
        try:
            self.client = pubsub_v1.PublisherClient()
        except Exception as e:
            logger.warning(f"PubSub client init failed (expected in local without creds): {e}")

    async def publish(self, topic_id: str, data: Dict[str, Any], ordering_key: str = None):
        """Publish event to Pub/Sub topic."""
        if not self.client:
            logger.info(f"[MOCK PUBLISH] Topic: {topic_id}, Data: {data}")
            return "mock-msg-id"

        topic_path = self.client.topic_path(self.project_id, topic_id)
        data_str = json.dumps(data).encode("utf-8")
        
        try:
            if ordering_key:
                future = self.client.publish(topic_path, data_str, ordering_key=ordering_key)
            else:
                future = self.client.publish(topic_path, data_str)
            message_id = future.result()
        except Exception as e:
            if "404" in str(e) or "Not Found" in str(e):
                logger.info(f"Topic {topic_id} not found, creating it...")
                try:
                    self.client.create_topic(name=topic_path)
                except Exception as create_error:
                    logger.warning(f"Failed to create topic {topic_id}: {create_error}")
                
                # Retry publish
                if ordering_key:
                    future = self.client.publish(topic_path, data_str, ordering_key=ordering_key)
                else:
                    future = self.client.publish(topic_path, data_str)
                message_id = future.result()
            else:
                logger.warning(f"Failed to publish to {topic_id}: {e}")
                # Return mock ID in case of failure (for local dev)
                return "mock-msg-id"
        
        logger.info(f"Published message {message_id} to {topic_id}")
        return message_id

producer = EventProducer()

# Convenience functions for booking events
async def publish_booking_created(booking_id: str, user_id: str, amount: float, currency: str = "USD"):
    """Publish booking.created event."""
    await producer.publish(
        topic_id="booking-events",
        data={
            "event_type": "booking.created",
            "booking_id": booking_id,
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

async def publish_booking_confirmed(booking_id: str):
    """Publish booking.confirmed event."""
    await producer.publish(
        topic_id="booking-events",
        data={
            "event_type": "booking.confirmed",
            "booking_id": booking_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

async def publish_booking_cancelled(booking_id: str, reason: str = None, refundable: bool = False):
    """Publish booking.cancelled event."""
    await producer.publish(
        topic_id="booking-events",
        data={
            "event_type": "booking.cancelled",
            "booking_id": booking_id,
            "reason": reason,
            "refundable": refundable,
            "timestamp": datetime.utcnow().isoformat()
        }
    )