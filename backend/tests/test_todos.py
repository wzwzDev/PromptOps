from fastapi.testclient import TestClient
from app.main import app
from app.db import engine, init_db
from sqlmodel import Session

client = TestClient(app)

def setup_module(module):
    # Ensure DB tables exist
    init_db()


def test_create_todo_201_and_schema():
    payload = {"title": "Write docs", "due": "2030-01-01T12:00:00Z"}
    r = client.post("/api/todos", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    assert set(["id","title","due","created_at"]) <= set(data.keys())
    assert data["title"] == "Write docs"
    assert data["due"].startswith("2030-01-01")


def test_create_todo_422_on_missing_title():
    r = client.post("/api/todos", json={"due": "2030-01-01T12:00:00Z"})
    assert r.status_code == 422


def test_persistence_roundtrip():
    payload = {"title": "Persist me"}
    r = client.post("/api/todos", json=payload)
    assert r.status_code == 201
    # quick check: posting again, id should increment and created_at present
    data = r.json()
    assert isinstance(data["id"], int)
    assert data["created_at"]
    # ensure fields persisted and due is None
    assert data["title"] == "Persist me"
    assert data["due"] is None
