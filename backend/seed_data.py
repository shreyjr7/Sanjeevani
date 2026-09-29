import sys
import os
import json
from datetime import datetime

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from backend.app.database import SessionLocal, engine, Base
from backend.app.models.user import User
from backend.app.models.case import Case
from backend.app.models.checkin import CheckIn
from backend.app.models.risk_score import RiskScore
from backend.app.models.alert import Alert
from backend.app.middleware.auth import get_password_hash
from ai.pipeline import run_pipeline


def seed():
    print("[NovaFlow] Seeding database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    hashed_pwd = get_password_hash("demo1234")
    
    # 1. Create Demo Counsellor
    counsellor = db.query(User).filter(User.email == "counsellor@demo.com").first()
    if not counsellor:
        counsellor = User(
            email="counsellor@demo.com",
            password_hash=hashed_pwd,
            role="counsellor",
            full_name="Dr. Sarah Jenkins"
        )
        db.add(counsellor)
        db.commit()
        db.refresh(counsellor)
        print("  - Created demo counsellor: counsellor@demo.com")

    # 2. Create Demo Victim
    victim = db.query(User).filter(User.email == "victim@demo.com").first()
    if not victim:
        victim = User(
            email="victim@demo.com",
            password_hash=hashed_pwd,
            role="victim",
            full_name="Elena Vance"
        )
        db.add(victim)
        db.commit()
        db.refresh(victim)
        print("  - Created demo victim: victim@demo.com")
        
    demo_case = db.query(Case).filter(Case.victim_id == victim.id).first()
    if not demo_case:
        demo_case = Case(
            victim_id=victim.id,
            assigned_counsellor_id=counsellor.id,
            status="active",
            risk_level="high"
        )
        db.add(demo_case)
        db.commit()
        db.refresh(demo_case)
        print("  - Created demo case for Elena Vance")

    # 3. Load synthetic dataset
    dataset_path = os.path.join(os.path.dirname(__file__), '../data/synthetic_dataset.json')
    if not os.path.exists(dataset_path):
        print(f"[!] Synthetic dataset not found at {dataset_path}. Run generate_data.py first.")
        db.close()
        return

    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    profiles = data.get("profiles", [])
    raw_checkins = data.get("checkins", [])
    
    # Group checkins by profile_id
    checkins_by_profile = {}
    for chk in raw_checkins:
        checkins_by_profile.setdefault(chk.get("profile_id"), []).append(chk)

    # Seed demo victim with check-ins if empty
    existing_demo_checkins = db.query(CheckIn).filter(CheckIn.case_id == demo_case.id).count()
    if existing_demo_checkins == 0 and 1 in checkins_by_profile:
        for chk in checkins_by_profile[1]:
            checkin = CheckIn(
                case_id=demo_case.id,
                free_text=chk["free_text"],
                mood_score=chk["mood_score"],
                sleep_hours=chk["sleep_hours"],
                appetite=chk.get("appetite", 3),
                social_interaction=chk.get("social_interaction", 3),
                submitted_at=datetime.fromisoformat(chk["submitted_at"])
            )
            db.add(checkin)
            db.commit()
            db.refresh(checkin)

            analysis = run_pipeline(chk["free_text"], chk)
            risk = RiskScore(
                checkin_id=checkin.id,
                sentiment_compound=analysis["sentiment"]["compound"],
                sentiment_pos=analysis["sentiment"]["pos"],
                sentiment_neg=analysis["sentiment"]["neg"],
                sentiment_neu=analysis["sentiment"]["neu"],
                emotions=analysis["emotions"],
                distress_keywords=analysis["features"]["crisis_keywords"],
                distress_score=analysis["features"]["distress_score"],
                risk_level=analysis["risk"]["risk_level"],
                explanation=analysis["explanation"]["rationale"],
                factor_breakdown=analysis["explanation"]["factor_breakdown"],
                token_attributions=analysis["explanation"]["token_attributions"]
            )
            db.add(risk)
            demo_case.risk_level = analysis["risk"]["risk_level"]

            if analysis["risk"]["risk_level"] in ["high", "critical"] or analysis["features"]["crisis_override"]:
                alert = Alert(
                    case_id=demo_case.id,
                    alert_type="crisis_keywords" if analysis["features"]["crisis_override"] else "increasing_risk",
                    severity=analysis["risk"]["risk_level"],
                    message=f"High risk detected: {analysis['explanation']['rationale']}"
                )
                db.add(alert)
        db.commit()

    # 4. Seed diverse profiles across all trajectory types (improving, stable, worsening, crisis, erratic)
    diverse_indices = [0, 1, 2, 15, 16, 28, 29, 30, 31, 40, 41, 42, 47, 48]
    selected_profiles = [profiles[i] for i in diverse_indices if i < len(profiles)]
    seeded_count = 0
    for profile in selected_profiles:
        email = profile["email"]
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=hashed_pwd,
                role="victim",
                full_name=profile["name"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        case = db.query(Case).filter(Case.victim_id == user.id).first()
        if not case:
            case = Case(
                victim_id=user.id,
                assigned_counsellor_id=counsellor.id,
                status="active",
                risk_level="low"
            )
            db.add(case)
            db.commit()
            db.refresh(case)

        profile_checkins = checkins_by_profile.get(profile["id"], [])
        existing_chks = db.query(CheckIn).filter(CheckIn.case_id == case.id).count()
        if existing_chks == 0:
            for chk in profile_checkins:
                checkin = CheckIn(
                    case_id=case.id,
                    free_text=chk["free_text"],
                    mood_score=chk["mood_score"],
                    sleep_hours=chk["sleep_hours"],
                    appetite=chk.get("appetite", 3),
                    social_interaction=chk.get("social_interaction", 3),
                    submitted_at=datetime.fromisoformat(chk["submitted_at"])
                )
                db.add(checkin)
                db.commit()
                db.refresh(checkin)

                analysis = run_pipeline(chk["free_text"], chk)
                risk = RiskScore(
                    checkin_id=checkin.id,
                    sentiment_compound=analysis["sentiment"]["compound"],
                    sentiment_pos=analysis["sentiment"]["pos"],
                    sentiment_neg=analysis["sentiment"]["neg"],
                    sentiment_neu=analysis["sentiment"]["neu"],
                    emotions=analysis["emotions"],
                    distress_keywords=analysis["features"]["crisis_keywords"],
                    distress_score=analysis["features"]["distress_score"],
                    risk_level=analysis["risk"]["risk_level"],
                    explanation=analysis["explanation"]["rationale"],
                    factor_breakdown=analysis["explanation"]["factor_breakdown"],
                    token_attributions=analysis["explanation"]["token_attributions"]
                )
                db.add(risk)
                case.risk_level = analysis["risk"]["risk_level"]

                if analysis["risk"]["risk_level"] in ["high", "critical"] or analysis["features"]["crisis_override"]:
                    alert = Alert(
                        case_id=case.id,
                        alert_type="crisis_keywords" if analysis["features"]["crisis_override"] else "increasing_risk",
                        severity=analysis["risk"]["risk_level"],
                        message=f"High risk detected: {analysis['explanation']['rationale']}"
                    )
                    db.add(alert)
            db.commit()
            seeded_count += 1

    db.close()
    print(f"[OK] Database seeded successfully with {seeded_count} cases and full AI evaluations.")


if __name__ == "__main__":
    seed()
