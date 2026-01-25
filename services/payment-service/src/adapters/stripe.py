import asyncio
import random
import uuid
from typing import Dict, Any
import logging

logger = logging.getLogger("payment-adapter")

class StripeAdapter:
    """
    Simulates a real Stripe SDK interaction.
    Includes network latency simulation and random failure injection for chaos testing.
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def create_payment_intent(self, amount: float, currency: str, idempotency_key: str) -> Dict[str, Any]:
        """
        Creates a payment intent.
        Mocks network latency (100ms - 500ms).
        """
        # Simulate network latency
        latency = random.uniform(0.1, 0.5)
        await asyncio.sleep(latency)
        
        logger.info(f"Stripe: Creating PaymentIntent amount={amount} {currency} key={idempotency_key}")

        # Simulate Idempotency Check (Mock logic: if key ends in '9', it fails)
        if idempotency_key.endswith("9"):
            # Simulate a "declined" card or API error
            raise Exception("Stripe API Error: Card Declined (Simulated)")

        return {
            "id": f"pi_{uuid.uuid4()}",
            "amount": amount,
            "currency": currency,
            "status": "succeeded",
            "client_secret": f"pi_{uuid.uuid4()}_secret_{uuid.uuid4()}"
        }

stripe_client = StripeAdapter(api_key="sk_test_mock")
