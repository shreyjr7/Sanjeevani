import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.app.main import app
from ai.pipeline import run_pipeline

print("=== 1. Testing AI Pipeline ===")
res = run_pipeline("I feel completely hopeless and cannot sleep at all.", {"mood_score": 2, "sleep_hours": 3})
assert res["risk"]["risk_level"] in ["high", "critical", "moderate"], "Risk level failure"
assert "hopelessness" in res["features"]["matched_categories"], "Matched categories failure"
print("[PASS] AI Pipeline normal distress check")

res_crisis = run_pipeline("I want to kill myself, end it all tonight", {"mood_score": 1, "sleep_hours": 1})
assert res_crisis["risk"]["crisis_override"] == True, "Crisis override failure"
assert res_crisis["risk"]["risk_level"] == "critical", "Crisis tier failure"
print("[PASS] AI Crisis safety guardrail triggered correctly")

print("\n=== 2. Testing FastAPI Endpoints ===")
client = TestClient(app)

# Test root
r = client.get("/")
assert r.status_code == 200 and "Welcome" in r.json()["message"]
print("[PASS] GET / root endpoint")

# Test auth
r_login = client.post("/api/auth/login", data={"username": "counsellor@demo.com", "password": "demo1234"})
assert r_login.status_code == 200, f"Login failed: {r_login.text}"
token = r_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("[PASS] POST /api/auth/login")

# Test stats
r_stats = client.get("/api/stats/dashboard", headers=headers)
assert r_stats.status_code == 200 and r_stats.json()["total_cases"] > 0
print(f"[PASS] GET /api/stats/dashboard (Total cases: {r_stats.json()['total_cases']}, Alerts: {r_stats.json()['active_alerts']})")

# Test cases
r_cases = client.get("/api/cases", headers=headers)
assert r_cases.status_code == 200 and len(r_cases.json()) > 0
print(f"[PASS] GET /api/cases ({len(r_cases.json())} cases returned)")

# Test alerts
r_alerts = client.get("/api/alerts", headers=headers)
assert r_alerts.status_code == 200 and len(r_alerts.json()) > 0
print(f"[PASS] GET /api/alerts ({len(r_alerts.json())} alerts returned)")

# Test sandbox analysis
r_sandbox = client.post("/api/risk/analyze?text=Everything%20is%20getting%20worse%20and%20I%20feel%20so%20lonely&mood_score=2&sleep_hours=4")
assert r_sandbox.status_code == 200 and "risk" in r_sandbox.json()
print("[PASS] POST /api/risk/analyze sandbox endpoint")

print("\n>>> ALL 7 TESTS PASSED SUCCESSFULLY! System is 100% operational. <<<")
