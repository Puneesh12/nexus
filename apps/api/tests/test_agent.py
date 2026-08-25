"""
NEXUS — Agent Orchestrator and Tool Routing Unit Tests
"""
from services.agents.orchestrator import agent_orchestrator


def test_agent_intent_detection():
    # Temporal queries
    assert agent_orchestrator._detect_intent("What do I need to take care of in the next 30 days?") == "temporal_summary"
    assert agent_orchestrator._detect_intent("When does my warranty expire?") == "temporal_summary"
    assert agent_orchestrator._detect_intent("Any upcoming deadlines this week?") == "temporal_summary"

    # Personal fact queries
    assert agent_orchestrator._detect_intent("Where do I study?") == "personal_fact"
    assert agent_orchestrator._detect_intent("What do I own?") == "personal_fact"

    # Document queries
    assert agent_orchestrator._detect_intent("Show me the invoice document for my laptop") == "document"
