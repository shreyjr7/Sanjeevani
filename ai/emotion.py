"""
Emotion Detection Module
=========================
Rule-based emotion classifier that detects 7 discrete emotions:
  anger, disgust, fear, joy, neutral, sadness, surprise

This is a lightweight, zero-dependency implementation using keyword matching
and VADER-informed heuristics. It runs in <1ms on CPU with zero model downloads.

For production use, this can be upgraded to use the transformer model:
  j-hartmann/emotion-english-distilroberta-base (~329MB)
which provides deep contextual emotion classification.

NOTE: This system provides decision-support signals, NOT medical diagnoses.
"""

import re
from typing import Dict

# ─── Emotion Keyword Lexicons ─────────────────────────────────────────────────
# Each emotion has primary keywords (strong signal) and secondary (weaker signal)

EMOTION_LEXICONS = {
    "sadness": {
        "primary": [
            "sad", "sadness", "depressed", "depression", "hopeless", "miserable",
            "heartbroken", "grief", "grieving", "mourning", "crying", "cry",
            "tears", "devastated", "despair", "sorrow", "lonely", "loneliness",
            "empty", "numb", "worthless", "lost", "broken", "hurting",
            "suffering", "aching", "melancholy", "gloomy", "unhappy"
        ],
        "secondary": [
            "down", "low", "blue", "heavy", "dark", "painful", "miss",
            "missing", "alone", "abandoned", "forgotten", "rejected"
        ]
    },
    "fear": {
        "primary": [
            "afraid", "fear", "scared", "terrified", "anxious", "anxiety",
            "panic", "panicking", "dread", "phobia", "horror", "petrified",
            "frightened", "alarmed", "paranoid", "nightmare", "nightmares"
        ],
        "secondary": [
            "nervous", "worried", "worry", "uneasy", "tense", "stressed",
            "overwhelmed", "trembling", "shaking", "on edge", "restless",
            "threatened", "intimidated", "uncertain"
        ]
    },
    "anger": {
        "primary": [
            "angry", "anger", "furious", "rage", "outraged", "livid",
            "enraged", "infuriated", "fuming", "hostile", "hateful",
            "hate", "loathe", "disgusted"
        ],
        "secondary": [
            "annoyed", "irritated", "frustrated", "resentful", "bitter",
            "agitated", "fed up", "mad", "upset", "pissed", "unfair",
            "injustice"
        ]
    },
    "joy": {
        "primary": [
            "happy", "happiness", "joy", "joyful", "elated", "ecstatic",
            "thrilled", "delighted", "overjoyed", "blissful", "euphoric",
            "grateful", "gratitude", "blessed", "wonderful", "amazing",
            "fantastic", "excellent", "love", "loving"
        ],
        "secondary": [
            "good", "great", "nice", "fine", "okay", "content", "pleased",
            "satisfied", "cheerful", "optimistic", "hopeful", "positive",
            "better", "improving", "calm", "peaceful", "proud", "smile"
        ]
    },
    "surprise": {
        "primary": [
            "surprised", "shocking", "shocked", "stunned", "astonished",
            "amazed", "bewildered", "startled", "unexpected", "unbelievable"
        ],
        "secondary": [
            "wow", "whoa", "really", "suddenly", "out of nowhere",
            "didn't expect", "caught off guard"
        ]
    },
    "disgust": {
        "primary": [
            "disgusting", "revolting", "repulsive", "sickening", "vile",
            "gross", "nauseating", "repelled", "appalled", "abhorrent"
        ],
        "secondary": [
            "sick", "nauseous", "awful", "terrible", "horrible",
            "dreadful", "pathetic", "contempt"
        ]
    }
}

# Intensity modifiers that amplify emotion scores
INTENSIFIERS = {
    "very", "extremely", "incredibly", "absolutely", "completely",
    "totally", "utterly", "deeply", "profoundly", "so", "really",
    "genuinely", "truly", "seriously"
}

# Negation words that can flip emotion signals
NEGATION_WORDS = {
    "not", "no", "never", "don't", "dont", "doesn't", "doesnt",
    "didn't", "didnt", "won't", "wont", "can't", "cant",
    "isn't", "isnt", "aren't", "arent", "wasn't", "wasnt",
    "hardly", "barely", "neither", "nor"
}


def detect_emotions(text: str) -> Dict[str, float]:
    """
    Detect probability distribution across 7 emotions using keyword-based analysis.
    
    Args:
        text: Preprocessed text to analyze
    
    Returns:
        Dictionary mapping emotion names to probability scores [0, 1]
        Scores are normalized to sum to approximately 1.0
    """
    lower_text = text.lower()
    words = set(lower_text.split())
    
    # Check for intensifiers in the text
    has_intensifier = bool(words & INTENSIFIERS)
    intensity_boost = 1.3 if has_intensifier else 1.0
    
    # Check for negation (simplified — checks if negation word appears)
    has_negation = bool(words & NEGATION_WORDS)
    
    # Calculate raw scores for each emotion
    raw_scores = {}
    for emotion, lexicon in EMOTION_LEXICONS.items():
        score = 0.0
        
        # Primary keywords (strong signal)
        for keyword in lexicon["primary"]:
            if keyword in lower_text:
                score += 2.0
        
        # Secondary keywords (weaker signal)
        for keyword in lexicon["secondary"]:
            if keyword in lower_text:
                score += 1.0
        
        # Apply intensity modifier
        score *= intensity_boost
        
        raw_scores[emotion] = score
    
    # Handle negation: if text has negation, reduce joy and boost sadness slightly
    if has_negation:
        raw_scores["joy"] *= 0.5
        raw_scores["sadness"] += 0.5
        raw_scores["fear"] += 0.3
    
    # Add neutral score (inversely proportional to other emotions)
    total_emotion = sum(raw_scores.values())
    raw_scores["neutral"] = max(0, 5.0 - total_emotion * 0.3)
    
    # Normalize to probabilities (sum ≈ 1.0)
    total = sum(raw_scores.values())
    if total > 0:
        probabilities = {
            emotion: round(score / total, 3)
            for emotion, score in raw_scores.items()
        }
    else:
        # Default: mostly neutral
        probabilities = {
            "anger": 0.0, "disgust": 0.0, "fear": 0.0,
            "joy": 0.0, "neutral": 1.0, "sadness": 0.0, "surprise": 0.0
        }
    
    return probabilities
