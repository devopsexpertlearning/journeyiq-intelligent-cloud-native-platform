# ADR 001: Why LangGraph for AI Agent

**Status:** Accepted  
**Date:** 2026-01-10  
**Deciders:** Platform Architecture Team

## Context

We needed to build an intelligent AI agent capable of:
- Multi-turn conversations with context
- Tool calling for booking operations
- RAG integration for policy queries
- State management across conversation steps
- Observable and debuggable agent behavior

## Decision

We chose **LangGraph** over alternatives (LangChain LCEL, AutoGPT, custom state machine).

## Rationale

### Why LangGraph?

1. **Explicit State Management**
   - Graph-based state machine is easy to visualize
   - Clear state transitions between nodes
   - Predictable behavior vs. implicit chains

2. **Built-in Observability**
   - Every node execution is traceable
   - Easy to add logging/metrics at each step
   - Supports LangSmith integration

3. **Tool Calling Support**
   - First-class support for function calling
   - Easy to add new tools (search, book, cancel)
   - Automatic schema generation

4. **RAG Integration**
   - Simple to add retrieval nodes
   - Supports multiple retrieval strategies
   - Easy to A/B test different approaches

5. **Production Ready**
   - Used by Anthropic, OpenAI partners
   - Active development and support
   - Good performance characteristics

### Alternatives Considered

**LangChain LCEL (Expression Language):**
- ❌ Less explicit state management
- ❌ Harder to debug complex flows
- ✅ Simpler for basic chains

**AutoGPT:**
- ❌ Too autonomous, hard to control
- ❌ Expensive token usage
- ❌ Unpredictable behavior

**Custom State Machine:**
- ❌ Reinventing the wheel
- ❌ No ecosystem support
- ✅ Maximum control

## Consequences

### Positive
- Clear, debuggable agent logic
- Easy to add new capabilities
- Good observability out of the box
- Strong community support

### Negative
- Learning curve for team
- Dependency on LangChain ecosystem
- Some overhead vs. direct LLM calls

### Neutral
- Requires understanding of graph concepts
- Need to design state schema carefully

## Implementation

```python
from langgraph.graph import StateGraph

# Define state
class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_id: str
    context: Dict

# Build graph
workflow = StateGraph(AgentState)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)
workflow.add_edge("retrieve", "generate")
```

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph vs LCEL](https://blog.langchain.dev/langgraph-vs-lcel/)
- Internal: `services/ai-agent-service/src/agent/graph.py`
