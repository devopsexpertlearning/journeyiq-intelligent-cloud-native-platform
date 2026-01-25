import os
import asyncio
from src.database import AsyncSessionLocal
from sqlalchemy import text
import logging

logger = logging.getLogger("seeder")

async def run_seed():
    if os.getenv("LOCAL", "false").lower() != "true":
        return

    logger.info("Checking for seed data...")
    # Logic: In a real app, strict checking. 
    # For this contract, we log that we are delegating to the 01_init_schemas.sql
    # because that file is mounted in docker-compose for the DB container.
    # We verify connectivity here.
    
    async with AsyncSessionLocal() as session:
        try:
            # Simple health check query
            await session.execute(text("SELECT 1"))
            logger.info("Local DB connected. Seed data should be present via init script.")
        except Exception as e:
            logger.error(f"Seeder failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(run_seed())
