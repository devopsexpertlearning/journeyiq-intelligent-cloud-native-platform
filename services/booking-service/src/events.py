import json
from google.cloud import pubsub_v1
import os
import logging
from typing import Dict, Any

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
        if not self.client:
            logger.info(f"[MOCK PUBLISH] Topic: {topic_id}, Data: {data}")
            return "mock-msg-id"

        topic_path = self.client.topic_path(self.project_id, topic_id)
        data_str = json.dumps(data).encode("utf-8")
        
        future = self.client.publish(topic_path, data_str, ordering_key=ordering_key)
        message_id = future.result()
        logger.info(f"Published message {message_id} to {topic_id}")
        return message_id

producer = EventProducer()
