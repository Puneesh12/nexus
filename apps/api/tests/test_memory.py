"""
NEXUS — Memory and Temporal Extraction Unit Tests
"""
from services.memory.extractor import memory_extractor
from services.temporal.extractor import temporal_extractor


def test_deterministic_entity_and_memory_extraction():
    text = "MacBook Pro M3 invoice purchased by user for college coursework."
    filename = "Apple_MacBook_Invoice.pdf"
    entities, relationships, memories = memory_extractor._deterministic_extract(text, filename)
    
    assert len(entities) >= 1
    assert any(e.name == "MacBook Pro" for e in entities)
    assert any(r.relation_type == "OWNS" for r in relationships)
    assert len(memories) >= 1
    assert "owns a MacBook Pro" in memories[0].content


def test_temporal_event_extraction():
    text = "Dell XPS warranty valid until September 15, 2026. Please contact support before expiration."
    filename = "Dell_Warranty.pdf"
    events = temporal_extractor.extract_events_from_text(text, filename)
    
    assert len(events) >= 1
    assert events[0].event_type == "expiration"
    assert events[0].event_date is not None
    assert events[0].event_date.year == 2026
    assert events[0].event_date.month == 9
    assert events[0].event_date.day == 15
