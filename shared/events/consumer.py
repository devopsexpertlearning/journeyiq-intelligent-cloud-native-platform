"""
Google Pub/Sub Event Consumer

Shared utility for consuming events from Google Pub/Sub across all services.
"""
import os
import json
import logging
from google.cloud import pubsub_v1
from typing import Callable, Dict, Any
from concurrent import futures

logger = logging.getLogger(__name__)

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "journeyiq-prod")
PUBSUB_EMULATOR_HOST = os.getenv("PUBSUB_EMULATOR_HOST")  # For local development

# Initialize subscriber
if PUBSUB_EMULATOR_HOST:
    logger.info(f"Using Pub/Sub emulator at {PUBSUB_EMULATOR_HOST}")

subscriber = pubsub_v1.SubscriberClient()


class EventConsumer:
    """
    Event consumer for Google Pub/Sub subscriptions.
    
    Usage:
        consumer = EventConsumer('booking-events-subscription')
        consumer.register_handler('booking.created', handle_booking_created)
        consumer.start_listening()
    """
    
    def __init__(self, subscription_name: str):
        """
        Initialize event consumer.
        
        Args:
            subscription_name: Name of the Pub/Sub subscription
        """
        self.subscription_name = subscription_name
        self.subscription_path = subscriber.subscription_path(PROJECT_ID, subscription_name)
        self.handlers: Dict[str, Callable] = {}
        self.streaming_pull_future = None
        
    def register_handler(self, event_type: str, handler: Callable[[Dict[str, Any]], None]):
        """
        Register a handler function for a specific event type.
        
        Args:
            event_type: Event type to handle (e.g., 'booking.created')
            handler: Function to call when event is received
        """
        self.handlers[event_type] = handler
        logger.info(f"Registered handler for {event_type}")
    
    def _callback(self, message: pubsub_v1.subscriber.message.Message):
        """
        Internal callback for processing messages.
        
        Args:
            message: Pub/Sub message
        """
        try:
            # Parse message data
            event_data = json.loads(message.data.decode('utf-8'))
            event_type = event_data.get('event_type')
            
            logger.info(f"Received event: {event_type}")
            
            # Find and call handler
            if event_type in self.handlers:
                handler = self.handlers[event_type]
                handler(event_data)
                message.ack()
                logger.info(f"Successfully processed {event_type}")
            else:
                logger.warning(f"No handler registered for {event_type}")
                message.ack()  # Ack anyway to avoid redelivery
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode message: {str(e)}")
            message.nack()  # Negative ack for redelivery
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            message.nack()
    
    def start_listening(self):
        """
        Start listening for events.
        
        This is a blocking call that will run until stopped.
        """
        logger.info(f"Starting to listen on {self.subscription_name}")
        
        # Configure flow control
        flow_control = pubsub_v1.types.FlowControl(max_messages=10)
        
        # Start streaming pull
        self.streaming_pull_future = subscriber.subscribe(
            self.subscription_path,
            callback=self._callback,
            flow_control=flow_control
        )
        
        logger.info(f"Listening for messages on {self.subscription_path}")
        
        try:
            # Block and wait for messages
            self.streaming_pull_future.result()
        except KeyboardInterrupt:
            self.streaming_pull_future.cancel()
            logger.info("Stopped listening for messages")
    
    def stop_listening(self):
        """Stop listening for events."""
        if self.streaming_pull_future:
            self.streaming_pull_future.cancel()
            logger.info("Stopped listening for messages")


# Example handlers
def handle_booking_created(event_data: Dict[str, Any]):
    """
    Example handler for booking.created events.
    
    Args:
        event_data: Event payload
    """
    booking_id = event_data.get('booking_id')
    user_id = event_data.get('user_id')
    logger.info(f"Handling booking.created: {booking_id} for user {user_id}")
    # Add your business logic here


def handle_payment_succeeded(event_data: Dict[str, Any]):
    """
    Example handler for payment.succeeded events.
    
    Args:
        event_data: Event payload
    """
    payment_id = event_data.get('payment_id')
    booking_id = event_data.get('booking_id')
    logger.info(f"Handling payment.succeeded: {payment_id} for booking {booking_id}")
    # Add your business logic here
