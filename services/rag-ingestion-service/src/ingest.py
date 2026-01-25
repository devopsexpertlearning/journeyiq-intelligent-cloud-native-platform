import json
import os
import httpx
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.config import settings

logger = logging.getLogger("ingestion")

async def ingest_rag_documents():
    if os.getenv("LOCAL", "false").lower() != "true":
        return

    file_path = "/app/local/seed-data/rag_documents.json"
    # Local fallback for dev environment where paths might differ
    if not os.path.exists(file_path):
         file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../local/seed-data/rag_documents.json"))

    if not os.path.exists(file_path):
        logger.warning(f"RAG seed file not found at {file_path}")
        return

    logger.info("Starting RAG ingestion...")
    with open(file_path, "r") as f:
        docs = json.load(f)

    # Advanced Chunking Strategy (Semantic Window Simulation)
    # Larger chunks for broad context, overlap for continuity
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    
    payload = []
    for doc in docs:
        chunks = text_splitter.split_text(doc["content"])
        for i, chunk in enumerate(chunks):
            payload.append({
                "content": chunk,
                "metadata": {
                    "source_id": doc["id"], 
                    "title": doc["title"],
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
            })

    # Push to Vector Store
    # Assuming standard Docker compose DNS
    vector_store_url = "http://vector-store-service:8000/index"
    
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Sending {len(payload)} chunks to {vector_store_url}")
            # Real call with timeout
            response = await client.post(vector_store_url, json=payload, timeout=30.0)
            if response.status_code == 200:
                logger.info(f"Successfully ingested {len(payload)} chunks.")
            else:
                 logger.error(f"Vector Store error {response.status_code}: {response.text}")
        except httpx.RequestError as e:
             logger.error(f"Network error connecting to Vector Store: {e}")
        except Exception as e:
            logger.error(f"Failed to ingest: {e}")
