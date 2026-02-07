import json
import os
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.vector_db import db_instance

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
    try:
        with open(file_path, "r") as f:
            docs = json.load(f)

        # Advanced Chunking Strategy
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        
        texts = []
        metas = []
        
        for doc in docs:
            chunks = text_splitter.split_text(doc["content"])
            for i, chunk in enumerate(chunks):
                texts.append(chunk)
                metas.append({
                    "source_id": doc["id"], 
                    "title": doc["title"],
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "content": chunk # Duplicating content in metadata for retrieval convenience
                })

        # Push directly to local Vector Store instance
        logger.info(f"Ingesting {len(texts)} chunks into local VectorDB...")
        db_instance.add_documents(texts, metas)
        logger.info("Ingestion complete.")

    except Exception as e:
        logger.error(f"Failed to ingest: {e}")
