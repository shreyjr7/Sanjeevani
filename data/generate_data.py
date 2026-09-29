"""
Synthetic Demonstration Dataset Generator
==========================================
Generates realistic (but clearly synthetic) mental health check-in data
for demonstrating the NovaFlow system.

Produces:
  - 50 victim profiles with demographics
  - ~500 check-in records spanning 6 months
  - 5 trajectory types: improving, stable, worsening, crisis, erratic
  - Realistic free-text journal entries for each emotional state
  - Properly labelled as synthetic/demonstration data

IMPORTANT: All data is entirely synthetic. No real patient data is used.
Names, details, and narratives are fictional.
"""

import json
import random
import os
from datetime import datetime, timedelta

# ─── Profile Templates ────────────────────────────────────────────────────────

FIRST_NAMES = [
    "Elena", "Marcus", "Sarah", "David", "Priya", "James", "Aisha", "Carlos",
    "Mei", "Oliver", "Fatima", "Noah", "Zara", "Liam", "Sofia", "Ethan",
    "Amara", "Lucas", "Anya", "Benjamin", "Diya", "Alexander", "Nadia",
    "William", "Layla", "Sebastian", "Kira", "Daniel", "Yuki", "Mateo",
    "Aaliyah", "Gabriel", "Rina", "Samuel", "Leila", "Isaac", "Maya",
    "Nathan", "Sana", "Julian", "Clara", "Adrian", "Hana", "Leo",
    "Jasmine", "Ryan", "Nina", "Thomas", "Elise", "Victor"
]

LAST_NAMES = [
    "Vance", "Chen", "Jenkins", "Ross", "Sharma", "Williams", "Okafor",
    "Martinez", "Liu", "Taylor", "Ahmed", "Brown", "Nazari", "Murphy",
    "Rodriguez", "White", "Patel", "Kim", "Ivanova", "Davis", "Singh",
    "Thompson", "Nakamura", "Wilson", "Al-Rashid", "Garcia", "Petrov",
    "Anderson", "Tanaka", "Morales", "Johnson", "Fernandez", "Ito",
    "Carter", "Hassan", "Clark", "Suzuki", "Torres", "Lee", "Cruz",
    "Ali", "Santos", "Watanabe", "Reyes", "Moore", "Park", "Lewis",
    "Gupta", "Fischer", "Novak"
]

# ─── Journal Entry Templates by Emotional State ──────────────────────────────

ENTRIES_LOW_RISK = [
    "Had a productive day today. Finished my tasks and went for a walk in the park. Feeling pretty good about things.",
    "Slept well last night, around 8 hours. Feeling rested and ready to take on the day. Called a friend and we had a great conversation.",
    "Things are looking up. I managed to cook a healthy meal and even read a few chapters of my book. Small wins matter.",
    "Feeling grateful today. The weather was nice and I spent some time in the garden. It really helps clear my mind.",
    "Good day overall. Work was manageable, had lunch with a colleague. Feeling more like myself lately.",
    "Did some exercise today - just a 30 minute walk, but it felt great. My mood has been steadily improving.",
    "Woke up feeling calm. Meditated for 10 minutes and journaled. I'm starting to see progress in my recovery.",
    "Today was okay. Nothing spectacular but nothing bad either. I'm learning to appreciate the quiet days.",
    "Spent time with family today. It was nice to feel connected. I'm sleeping better too - about 7 hours straight.",
    "Feeling optimistic about the future for the first time in a while. Started a new hobby and it brings me joy.",
]

ENTRIES_MODERATE_RISK = [
    "Today was harder than usual. I couldn't focus at work and felt this heavy weight on my chest. Tried to push through but it was exhausting.",
    "Didn't sleep great last night - maybe 5 hours with a lot of tossing and turning. My mind won't stop racing.",
    "Feeling kind of low today. I cancelled plans with friends because I just didn't have the energy. Stayed in bed most of the day.",
    "Work stress is getting to me. I snapped at a coworker and immediately felt awful about it. I'm not usually like this.",
    "I've been eating less lately. Food just doesn't appeal to me. I know I should eat but everything tastes bland.",
    "Feeling disconnected from people around me. Even when I'm in a room full of people, I feel isolated somehow.",
    "My thoughts keep going to dark places. Not anything extreme, just this persistent feeling that things won't get better.",
    "Had a panic attack at the grocery store today. It came out of nowhere. My heart was racing and I had to leave.",
    "I'm trying to stay positive but some days it's really hard. Today is one of those days. Just feeling overwhelmed.",
    "Struggling with motivation. Everything feels like such an effort. Even getting out of bed takes all my energy.",
    "The nightmares came back last night. I woke up drenched in sweat at 3am and couldn't fall back asleep.",
    "Feeling frustrated with myself. I know what I should be doing to feel better but I just can't seem to do it.",
]

ENTRIES_HIGH_RISK = [
    "I can't stop crying today. Everything feels hopeless and I haven't slept in 3 days. I don't know what's wrong with me.",
    "The darkness is closing in again. I feel completely alone and no one understands what I'm going through. What's the point?",
    "I haven't left my apartment in a week. I can't face anyone. The anxiety is so bad I feel physically sick all the time.",
    "Every day feels worse than the last. I'm exhausted but I can't sleep. I can't eat. I can't function. I feel like I'm falling apart.",
    "I had a terrible flashback today. The memories keep coming back no matter what I do. I feel trapped in my own mind.",
    "I feel so worthless. Nothing I do matters. I've been staring at the wall for hours just feeling nothing. Or everything. I can't tell.",
    "The pain is unbearable. Not physical pain but this crushing weight inside me. I feel like I'm drowning and no one can see it.",
    "I pushed everyone away. My family tried to reach out but I ignored their calls. I don't deserve their concern. I'm a burden.",
    "Can't sleep, can't eat, can't think straight. The fear and sadness are constant. I feel completely overwhelmed and helpless.",
    "Everything is falling apart. Lost my job, my relationship is strained, and I can barely take care of myself. I feel broken beyond repair.",
]

ENTRIES_CRISIS = [
    "I can't take this anymore. Every single day is suffering and I don't see how it gets better. I feel trapped with no way out.",
    "I've been thinking about ending it all. The pain is too much. Everyone would be better off without me being a burden.",
    "I feel completely hopeless and alone. I haven't eaten in days and I can't stop the dark thoughts. Nothing matters anymore.",
    "The thoughts are getting stronger. I keep thinking about ways to make the pain stop permanently. I'm scared of myself.",
    "I don't want to be here anymore. Not in this place, not in this body, not in this life. Everything is too much.",
]

ENTRIES_IMPROVING = [
    "Started therapy last week and it's already helping me see things differently. Still have bad days but fewer than before.",
    "Managed to sleep 6 hours last night - that's an improvement from the 3-4 I was getting. Baby steps.",
    "Went outside today for the first time in a while. Just sat on the bench and watched people. It felt... nice, actually.",
    "My counselor suggested journaling and I think it's helping. Getting thoughts out of my head onto paper makes them feel smaller.",
    "Had a moment today where I actually laughed. It surprised me. Maybe things aren't as dark as they seem.",
    "Took my medication on time all week. Eating a bit more regularly. It's not perfect but it's progress.",
    "Called a friend today. Just hearing a familiar voice helped. I forget sometimes that people do care about me.",
    "The nightmares are less frequent now. Still have them but maybe once a week instead of every night. That's something.",
]


def generate_trajectory(trajectory_type: str, num_checkins: int) -> list:
    """Generate a sequence of check-in data following a specific trajectory pattern."""
    checkins = []
    
    for i in range(num_checkins):
        progress = i / max(num_checkins - 1, 1)  # 0 to 1
        
        if trajectory_type == "improving":
            # Start moderate/high, gradually improve
            base_mood = 3 + progress * 5  # 3 → 8
            base_sleep = 4 + progress * 4  # 4 → 8
            if progress < 0.3:
                entries = ENTRIES_HIGH_RISK + ENTRIES_MODERATE_RISK
            elif progress < 0.6:
                entries = ENTRIES_MODERATE_RISK + ENTRIES_IMPROVING
            else:
                entries = ENTRIES_IMPROVING + ENTRIES_LOW_RISK
                
        elif trajectory_type == "stable_low":
            # Consistently low risk
            base_mood = 7 + random.uniform(-1, 1)
            base_sleep = 7 + random.uniform(-1, 1)
            entries = ENTRIES_LOW_RISK
            
        elif trajectory_type == "worsening":
            # Start low/moderate, gradually worsen
            base_mood = 7 - progress * 5  # 7 → 2
            base_sleep = 7 - progress * 3  # 7 → 4
            if progress < 0.3:
                entries = ENTRIES_LOW_RISK
            elif progress < 0.6:
                entries = ENTRIES_MODERATE_RISK
            else:
                entries = ENTRIES_HIGH_RISK
                
        elif trajectory_type == "crisis_recovery":
            # Normal → crisis → recovery
            if progress < 0.3:
                base_mood = 6 + random.uniform(-1, 1)
                base_sleep = 6 + random.uniform(-1, 1)
                entries = ENTRIES_LOW_RISK + ENTRIES_MODERATE_RISK
            elif progress < 0.5:
                base_mood = 2 + random.uniform(-1, 1)
                base_sleep = 3 + random.uniform(-1, 1)
                entries = ENTRIES_CRISIS + ENTRIES_HIGH_RISK
            elif progress < 0.7:
                base_mood = 3 + random.uniform(-1, 2)
                base_sleep = 4 + random.uniform(-1, 1)
                entries = ENTRIES_HIGH_RISK + ENTRIES_IMPROVING
            else:
                base_mood = 5 + random.uniform(-1, 2)
                base_sleep = 6 + random.uniform(-1, 1)
                entries = ENTRIES_IMPROVING + ENTRIES_MODERATE_RISK
                
        elif trajectory_type == "erratic":
            # Unpredictable swings
            phase = random.choice(["good", "bad", "moderate"])
            if phase == "good":
                base_mood = random.uniform(6, 9)
                base_sleep = random.uniform(6, 9)
                entries = ENTRIES_LOW_RISK
            elif phase == "bad":
                base_mood = random.uniform(1, 4)
                base_sleep = random.uniform(2, 5)
                entries = ENTRIES_HIGH_RISK
            else:
                base_mood = random.uniform(4, 6)
                base_sleep = random.uniform(4, 7)
                entries = ENTRIES_MODERATE_RISK
        else:
            base_mood = 5
            base_sleep = 6
            entries = ENTRIES_MODERATE_RISK
        
        # Add some randomness
        mood = max(1, min(10, round(base_mood + random.uniform(-0.5, 0.5))))
        sleep = max(1, min(12, round(base_sleep + random.uniform(-0.5, 0.5), 1)))
        appetite = max(1, min(5, round(mood / 2.5 + random.uniform(-0.5, 0.5))))
        social = max(1, min(5, round(mood / 2.5 + random.uniform(-0.5, 0.5))))
        
        checkins.append({
            "free_text": random.choice(entries),
            "mood_score": mood,
            "sleep_hours": sleep,
            "appetite": appetite,
            "social_interaction": social
        })
    
    return checkins


def generate_dataset():
    """Generate the complete synthetic demonstration dataset."""
    random.seed(42)  # Reproducible results
    
    # Distribution of trajectory types (matching plan percentages)
    trajectory_distribution = (
        ["improving"] * 15 +        # 30%
        ["stable_low"] * 13 +       # 26%
        ["worsening"] * 12 +        # 24%
        ["crisis_recovery"] * 7 +   # 14%
        ["erratic"] * 3             # 6%
    )
    
    dataset = {
        "_metadata": {
            "generated_at": datetime.now().isoformat(),
            "description": "SYNTHETIC DEMONSTRATION DATA - Not real patient data",
            "disclaimer": "This dataset is entirely fictional and generated for system demonstration purposes only.",
            "version": "1.0",
            "total_profiles": 50,
            "note": "AI signals are for decision support only, not medical diagnosis"
        },
        "profiles": [],
        "checkins": []
    }
    
    base_date = datetime.now() - timedelta(days=180)  # 6 months ago
    
    for i in range(50):
        profile_id = i + 1
        trajectory = trajectory_distribution[i]
        
        # Generate profile
        profile = {
            "id": profile_id,
            "name": f"{FIRST_NAMES[i]} {LAST_NAMES[i]}",
            "email": f"{FIRST_NAMES[i].lower()}.{LAST_NAMES[i].lower()}@demo.example.com",
            "trajectory_type": trajectory,
            "created_at": (base_date + timedelta(days=random.randint(0, 30))).isoformat()
        }
        dataset["profiles"].append(profile)
        
        # Generate check-ins (8-15 per victim)
        num_checkins = random.randint(8, 15)
        trajectory_data = generate_trajectory(trajectory, num_checkins)
        
        for j, checkin in enumerate(trajectory_data):
            # Space check-ins 3-14 days apart
            days_offset = random.randint(3, 14)
            checkin_date = base_date + timedelta(
                days=30 + j * days_offset + random.randint(0, 3)
            )
            
            checkin_record = {
                "id": len(dataset["checkins"]) + 1,
                "profile_id": profile_id,
                "submitted_at": checkin_date.isoformat(),
                **checkin
            }
            dataset["checkins"].append(checkin_record)
    
    return dataset


def main():
    """Generate and save the synthetic dataset."""
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        
    print("[NovaFlow] Generating Synthetic Demonstration Dataset...")
    print("=" * 60)
    print("DISCLAIMER: All data is entirely synthetic/fictional.")
    print("No real patient data is used or referenced.")
    print("=" * 60)
    
    dataset = generate_dataset()
    
    # Save to data directory
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "synthetic_dataset.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    print(f"\n[OK] Generated {len(dataset['profiles'])} victim profiles")
    print(f"[OK] Generated {len(dataset['checkins'])} check-in records")
    print(f"[OK] Saved to: {output_path}")
    
    # Print trajectory distribution
    from collections import Counter
    trajectories = Counter(p["trajectory_type"] for p in dataset["profiles"])
    print("\n[Trajectory Distribution]:")
    for ttype, count in trajectories.most_common():
        print(f"   {ttype}: {count} ({count*2}%)")


if __name__ == "__main__":
    main()
