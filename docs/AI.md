# AI Agent & RAG Documentation

## AI Architecture
The `ai-agent-service` is an autonomous agent built with **LangGraph**.

### State Machine
1.  **Agent Node:** Takes user input + history. Decides next step (Answer or Tool Call).
2.  **Action Node:** Executes tool (e.g., `search_flights`). returns output to Agent.
3.  **Loop:** Continues until a final answer is generated.

### Model Routing
Configurable via `LLM_PROVIDER` env var:
- `groq`: Low latency, good for simple tool calling.
- `gpt4` (Azure): High reasoning, used for complex planning.
- `gemini`: High context window, used for large RAG tasks.

## RAG Pipeline
### Ingestion (`rag-ingestion-service`)
1.  **Source:** `rag_documents.json` (Policies, FAQs).
2.  **Chunking:** `RecursiveCharacterTextSplitter` (500 chars).
3.  **Embedding:** `sentence-transformers/all-MiniLM-L6-v2`.
4.  **Storage:** Vectors stored in FAISS (`vector-store-service`).

### Retrieval
The Agent queries `vector-store-service` via HTTP to fetch relevant context before answering user queries.

## Canary Testing
New prompts or models are tested using a **Canary Deployment**:
1.  Deploy new image with `track: canary`.
2.  Route 10% of internal traffic.
3.  Monitor `ai_hallucination_score` (if available) or user feedback.
4.  Promote if metrics are stable.
