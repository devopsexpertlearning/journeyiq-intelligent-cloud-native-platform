from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
from langchain_core.messages import HumanMessage, BaseMessage
from typing import TypedDict, Sequence
import operator
from src.agent.models import get_llm
from src.agent.tools import tools
from src.agent.safety import check_safety
import json
import logging

import logging

logger = logging.getLogger("agent")

class AgentState(TypedDict):
    messages: Sequence[BaseMessage]
    user_id: str

model = get_llm()
tool_executor = ToolExecutor(tools)
# Bind tools to model
model_with_tools = model.bind_tools(tools)

async def agent_node(state: AgentState):
    messages = state["messages"]
    # Safety Check
    last_msg = messages[-1]
    if isinstance(last_msg, HumanMessage):
        if not check_safety(last_msg.content):
             return {"messages": [("assistant", "I cannot fulfill this request due to safety guidelines.")]}

    response = await model_with_tools.ainvoke(messages)
    logger.info(json.dumps({"event": "agent_response", "content": response.content}))
    return {"messages": [response]}

async def action_node(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    # Execute tool calls
    tool_input = last_message.tool_calls[0]
    action = ToolExecutor(tools).invoke(tool_input)
    
    logger.info(json.dumps({"event": "tool_execution", "tool": tool_input["name"], "input": tool_input["args"], "result": str(action)}))
    
    return {"messages": [action]}

def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "continue"
    return "end"

# Graph Construction
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("action", action_node)

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "continue": "action",
        "end": END
    }
)
workflow.add_edge("action", "agent")

app_graph = workflow.compile()
