"""
NEXUS — Auth endpoint tests
"""
import pytest


@pytest.mark.asyncio
async def test_register_new_user(client):
    response = await client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@nexus.test",
        "password": "securepassword123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@nexus.test"
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"name": "User", "email": "dupe@nexus.test", "password": "password123"}
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/auth/register", json={
        "name": "Login User",
        "email": "login@nexus.test",
        "password": "mypassword123",
    })
    response = await client.post(
        "/auth/token",
        data={"username": "login@nexus.test", "password": "mypassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    response = await client.post(
        "/auth/token",
        data={"username": "nobody@nexus.test", "password": "wrong"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client):
    await client.post("/auth/register", json={
        "name": "Me User",
        "email": "me@nexus.test",
        "password": "password123",
    })
    token_resp = await client.post(
        "/auth/token",
        data={"username": "me@nexus.test", "password": "password123"},
    )
    token = token_resp.json()["access_token"]
    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@nexus.test"
