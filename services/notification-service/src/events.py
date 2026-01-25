import json
from google.cloud import pubsub_v1
import os
import logging
import asyncio
from concurrent.futures import TimeoutError
from src.database import AsyncSessionLocal
from sqlalchemy import text

logger = logging.getLogger("events")

class EventConsumer:
    def __init__(self, service_name: str, subscription_id: str):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "journeyiq-local")
        self.subscription_id = subscription_id
        self.service_name = service_name
        self.subscriber = None
        try:
            self.subscriber = pubsub_v1.SubscriberClient()
        except Exception:
            logger.warning("PubSub subscriber init failed.")

    def start_listening(self):
        if not self.subscriber:
            logger.info("[MOCK LISTENER] Started (Mock Mode)")
            return

        subscription_path = self.subscriber.subscription_path(self.project_id, self.subscription_id)
        
        def callback(message):
            # Run async processing in a thread-safe way? 
            # Standard python PubSub callback is synchronous.
            # Usually we bridge to async or run sync logic.
            # For simplicity here:
            try:
                data = json.loads(message.data.decode("utf-8"))
                msg_id = message.message_id
                
                # Check Idempotency (Sync check or blocking call if inside sync callback)
                # In real production, use careful async bridging.
                logger.info(f"Received message {msg_id}: {data}")
                
                # Simulate Idempotency Check
                # if exists(msg_id): message.ack(); return
                
                # Process
                self.process_message(data)
                
                message.ack()
            except Exception as e:
                logger.error(f"Failed to process message: {e}")
                message.nack()

        streaming_pull_future = self.subscriber.subscribe(subscription_path, callback=callback)
        logger.info(f"Listening on {self.subscription_id}...")
        
        # Keep alive logic usually managed by app runner

    def process_message(self, data):
        # Business Logic stub
        logger.info(f"Processing event: {data}")

# Specific Consumer Instance
# Subscribing to booking.created.v1 for notifications
notification_consumer = EventConsumer("notification-service", "booking.created.v1-sub")
