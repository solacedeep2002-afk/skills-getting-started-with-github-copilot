from fastapi.testclient import TestClient
import urllib.parse
import pytest

from src import app as app_module


@pytest.fixture(autouse=True)
def reset_db():
    # reset in-memory activities before each test
    app_module.reset_activities()
    yield


def test_get_activities():
    client = TestClient(app_module.app)
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    client = TestClient(app_module.app)
    activity = "Chess Club"
    email = "teststudent@example.com"

    # Signup
    signup_r = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}")
    assert signup_r.status_code == 200
    assert "Signed up" in signup_r.json().get("message", "")

    # Confirm participant present
    r = client.get("/activities")
    participants = r.json()[activity]["participants"]
    assert email in participants

    # Unregister
    unreg_r = client.post(f"/activities/{urllib.parse.quote(activity)}/unregister?email={urllib.parse.quote(email)}")
    assert unreg_r.status_code == 200
    assert "Unregistered" in unreg_r.json().get("message", "")

    # Confirm removed
    r2 = client.get("/activities")
    participants2 = r2.json()[activity]["participants"]
    assert email not in participants2


def test_double_signup_returns_400():
    client = TestClient(app_module.app)
    activity = "Chess Club"
    email = "double@example.com"

    r1 = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}")
    assert r1.status_code == 200

    r2 = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}")
    assert r2.status_code == 400


def test_signup_nonexistent_activity_returns_404():
    client = TestClient(app_module.app)
    r = client.post("/activities/Nonexistent%20Activity/signup?email=a@b.com")
    assert r.status_code == 404
