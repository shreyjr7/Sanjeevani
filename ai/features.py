"""
Clinical Distress Feature Extraction Module
============================================
Extracts linguistic, behavioral, and clinical distress signals from text.
Uses a curated lexicon of distress keywords organized by clinical categories.

NOTE: This module provides AI-assisted decision-support signals only.
It does NOT provide medical diagnoses.
"""

import re
from typing import Dict, List, Any

# ─── Clinical Distress Lexicons ───────────────────────────────────────────────
# Each category has keywords/phrases and an associated weight for scoring.

DISTRESS_LEXICON = {
    "hopelessness": {
        "weight": 25,
        "keywords": [
            "hopeless", "no hope", "give up", "giving up", "pointless",
            "worthless", "no point", "nothing matters", "why bother",
            "can't go on", "no reason to live", "no future", "trapped",
            "no way out", "helpless", "useless", "broken"
        ]
    },
    "sleep_disturbance": {
        "weight": 15,
        "keywords": [
            "can't sleep", "cant sleep", "insomnia", "exhausted",
            "haven't slept", "havent slept", "no sleep", "tired all the time",
            "nightmares", "wake up at night", "restless", "fatigue",
            "so tired", "barely slept", "sleep deprived"
        ]
    },
    "social_isolation": {
        "weight": 15,
        "keywords": [
            "alone", "all alone", "no one cares", "nobody cares",
            "abandoned", "isolated", "lonely", "no friends",
            "no one understands", "nobody understands", "pushed away",
            "withdrawn", "cut off", "disconnected", "invisible"
        ]
    },
    "absolutist_language": {
        "weight": 10,
        "keywords": [
            "always", "never", "everything", "nothing", "completely",
            "totally", "absolutely", "everyone", "nobody", "forever",
            "constantly", "impossible", "entire", "all the time"
        ]
    },
    "anxiety_signals": {
        "weight": 12,
        "keywords": [
            "anxious", "anxiety", "panic", "panicking", "worried",
            "can't breathe", "cant breathe", "heart racing", "terrified",
            "scared", "afraid", "dread", "overwhelmed", "stressed",
            "on edge", "nervous", "restless"
        ]
    },
    "self_harm": {
        "weight": 30,
        "keywords": [
            "hurt myself", "cutting", "self-harm", "self harm",
            "harming myself", "burning myself", "hit myself",
            "punish myself", "scratch myself"
        ]
    },
    "cognitive_distortion": {
        "weight": 8,
        "keywords": [
            "i'm a burden", "im a burden", "my fault", "i deserve this",
            "i'm worthless", "im worthless", "i'm a failure", "im a failure",
            "i can't do anything right", "i ruin everything", "hate myself"
        ]
    }
}

# Crisis keywords trigger an immediate override to CRITICAL risk level
CRISIS_KEYWORDS = [
    "suicide", "suicidal", "kill myself", "end my life", "end it all",
    "want to die", "better off dead", "wish i was dead", "wish i were dead",
    "harm myself", "overdose", "jump off", "hang myself",
    "don't want to be here", "dont want to be here",
    "no reason to live", "goodbye forever"
]

# Negative affect words for token attribution
NEGATIVE_AFFECT_WORDS = [
    "sad", "sadness", "crying", "cry", "tears", "depressed", "depression",
    "miserable", "awful", "terrible", "horrible", "worst", "bad", "pain",
    "suffering", "agony", "grief", "sorrow", "heartbroken", "devastated",
    "upset", "unhappy", "angry", "rage", "furious", "frustrated", "irritated"
]

# Physical symptom words
PHYSICAL_SYMPTOM_WORDS = [
    "headache", "nausea", "dizzy", "pain", "ache", "exhausted",
    "tired", "fatigue", "insomnia", "appetite", "weight", "eating",
    "stomach", "chest", "breathing", "shaking", "trembling"
]


def extract_features(text: str, checkin_data: dict) -> Dict[str, Any]:
    """
    Extract comprehensive clinical distress features from text and check-in data.
    
    Args:
        text: Preprocessed check-in text
        checkin_data: Dict with mood_score, sleep_hours, appetite, social_interaction
    
    Returns:
        Dictionary containing all extracted features, scores, and attributions
    """
    lower_text = text.lower()
    words = lower_text.split()
    word_count = len(words)
    
    if word_count == 0:
        return _empty_features()
    
    # ── Linguistic Features ────────────────────────────────────────────────
    unique_words = set(words)
    vocabulary_diversity = len(unique_words) / word_count if word_count > 0 else 0
    
    # Self-reference ratio (I, me, my, mine, myself)
    self_ref_words = {"i", "me", "my", "mine", "myself", "i'm", "im", "i've", "ive"}
    self_refs = sum(1 for w in words if w in self_ref_words)
    self_ref_ratio = self_refs / word_count
    
    # Sentence count and avg length
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    sentence_count = max(len(sentences), 1)
    avg_sentence_length = word_count / sentence_count
    
    # ── Lexicon-Based Distress Scoring ─────────────────────────────────────
    distress_score = 0.0
    matched_categories = {}
    all_distress_keywords = []
    
    for category, config in DISTRESS_LEXICON.items():
        matched = [kw for kw in config["keywords"] if kw in lower_text]
        if matched:
            # Score: weight * min(matched_count, 3) to cap per-category contribution
            category_score = config["weight"] * min(len(matched), 3)
            distress_score += category_score
            matched_categories[category] = {
                "keywords": matched,
                "weight": config["weight"],
                "contribution": category_score
            }
            all_distress_keywords.extend(matched)
    
    # Cap distress score at 100
    distress_score = min(100.0, distress_score)
    
    # ── Crisis Keyword Detection ───────────────────────────────────────────
    crisis_keywords_found = [kw for kw in CRISIS_KEYWORDS if kw in lower_text]
    crisis_override = len(crisis_keywords_found) > 0
    
    # ── Token Attribution ──────────────────────────────────────────────────
    token_attributions = _build_token_attributions(words, all_distress_keywords)
    
    # ── Behavioral Features (from check-in data) ──────────────────────────
    mood = checkin_data.get("mood_score", 5)
    sleep = checkin_data.get("sleep_hours", 7)
    appetite = checkin_data.get("appetite", 3)
    social = checkin_data.get("social_interaction", 3)
    
    # Behavioral distress indicators
    behavioral_distress = 0.0
    behavioral_flags = []
    
    if mood <= 3:
        behavioral_distress += 20
        behavioral_flags.append(f"Low mood score ({mood}/10)")
    elif mood <= 5:
        behavioral_distress += 10
    
    if sleep < 4:
        behavioral_distress += 20
        behavioral_flags.append(f"Severe sleep deficit ({sleep}h)")
    elif sleep < 6:
        behavioral_distress += 10
        behavioral_flags.append(f"Poor sleep ({sleep}h)")
    
    if appetite <= 1:
        behavioral_distress += 10
        behavioral_flags.append("Very poor appetite")
    
    if social <= 1:
        behavioral_distress += 10
        behavioral_flags.append("No social interaction")
    
    # Combine text distress with behavioral distress
    combined_distress = min(100.0, distress_score + behavioral_distress * 0.5)
    
    return {
        # Linguistic features
        "word_count": word_count,
        "vocabulary_diversity": round(vocabulary_diversity, 3),
        "self_ref_ratio": round(self_ref_ratio, 3),
        "sentence_count": sentence_count,
        "avg_sentence_length": round(avg_sentence_length, 1),
        
        # Distress features
        "distress_score": round(combined_distress, 1),
        "text_distress_score": round(distress_score, 1),
        "behavioral_distress": round(behavioral_distress, 1),
        "matched_categories": matched_categories,
        "all_distress_keywords": all_distress_keywords,
        "behavioral_flags": behavioral_flags,
        
        # Crisis detection
        "crisis_override": crisis_override,
        "crisis_keywords": crisis_keywords_found,
        
        # Token-level analysis
        "token_attributions": token_attributions,
        
        # Raw behavioral data
        "mood_score": mood,
        "sleep_hours": sleep,
        "appetite": appetite,
        "social_interaction": social
    }


def _build_token_attributions(words: list, distress_keywords: list) -> dict:
    """
    Build token-level attributions categorizing each word into:
    - negative_affect: words expressing negative emotions
    - distress_keyword: clinical distress trigger words
    - physical_symptom: physical health symptom words
    - neutral: all other words
    """
    attributions = {
        "negative_affect": [],
        "distress_keyword": [],
        "physical_symptom": [],
        "neutral": []
    }
    
    distress_set = set(distress_keywords)
    
    for word in words:
        clean_word = re.sub(r'[^\w]', '', word).lower()
        if not clean_word:
            continue
            
        if clean_word in distress_set or any(clean_word in kw for kw in distress_set):
            attributions["distress_keyword"].append(clean_word)
        elif clean_word in NEGATIVE_AFFECT_WORDS:
            attributions["negative_affect"].append(clean_word)
        elif clean_word in PHYSICAL_SYMPTOM_WORDS:
            attributions["physical_symptom"].append(clean_word)
        else:
            attributions["neutral"].append(clean_word)
    
    return attributions


def _empty_features() -> Dict[str, Any]:
    """Return empty feature set for edge cases (empty text)."""
    return {
        "word_count": 0,
        "vocabulary_diversity": 0,
        "self_ref_ratio": 0,
        "self_ref_ratio": 0,
        "sentence_count": 0,
        "avg_sentence_length": 0,
        "distress_score": 0,
        "text_distress_score": 0,
        "behavioral_distress": 0,
        "matched_categories": {},
        "all_distress_keywords": [],
        "behavioral_flags": [],
        "crisis_override": False,
        "crisis_keywords": [],
        "token_attributions": {"negative_affect": [], "distress_keyword": [], "physical_symptom": [], "neutral": []},
        "mood_score": 5,
        "sleep_hours": 7,
        "appetite": 3,
        "social_interaction": 3
    }
