"""
NEXUS — Health endpoint tests
"""
import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["services"]["api"] == "ok"
    assert "timestamp" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_root_returns_product_info(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "NEXUS"
