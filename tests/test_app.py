from fastapi.testclient import TestClient

from src import app as app_module

client = TestClient(app_module.app)


def reset_activities():
    app_module.activities.clear()
    app_module.activities.update({
        "Test Club": {
            "description": "A test activity",
            "schedule": "Mondays 3pm",
            "max_participants": 10,
            "participants": ["michael@mergington.edu"]
        }
    })


def setup_function():
    reset_activities()


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Test Club" in data


def test_signup_for_activity_success():
    response = client.post("/activities/Test%20Club/signup", params={"email": "newstudent@mergington.edu"})
    assert response.status_code == 200
    assert response.json()["message"] == "Signed up newstudent@mergington.edu for Test Club"

    response = client.get("/activities")
    participants = response.json()["Test Club"]["participants"]
    assert "newstudent@mergington.edu" in participants


def test_signup_for_activity_duplicate():
    response = client.post("/activities/Test%20Club/signup", params={"email": "michael@mergington.edu"})
    assert response.status_code == 400


def test_signup_nonexistent_activity():
    response = client.post("/activities/NoSuchActivity/signup", params={"email": "anon@mergington.edu"})
    assert response.status_code == 404


def test_unregister_participant_success():
    response = client.post("/activities/Test%20Club/signup", params={"email": "remove@mergington.edu"})
    assert response.status_code == 200

    response = client.delete("/activities/Test%20Club/participants", params={"email": "remove@mergington.edu"})
    assert response.status_code == 200
    assert response.json()["message"] == "Unregistered remove@mergington.edu from Test Club"

    response = client.get("/activities")
    participants = response.json()["Test Club"]["participants"]
    assert "remove@mergington.edu" not in participants


def test_unregister_participant_not_found():
    response = client.delete("/activities/Test%20Club/participants", params={"email": "nosuch@mergington.edu"})
    assert response.status_code == 404


def test_unregister_nonexistent_activity():
    response = client.delete("/activities/NoSuchActivity/participants", params={"email": "anon@mergington.edu"})
    assert response.status_code == 404
