"""
Composite Risk Scoring Engine
===============================
Computes a continuous risk score R ∈ [0, 100] using a multi-factor weighted formula:

  R = min(100, α·S + β·E + γ·L + δ·T)

Where:
  S (α=0.25) = Sentiment valence impact from VADER compound score
  E (β=0.35) = Clinical emotion intensity from emotion detection
  L (γ=0.25) = Lexicon-based distress keyword signals
  T (δ=0.15) = Temporal velocity and trend analysis

Crisis Override: If crisis keywords detected → R = max(R, 95) immediately.

Risk Tiers:
  0-29:   Low      (🟢 Emerald)
  30-59:  Moderate (🟡 Amber)
  60-79:  High     (🟠 Orange)
  80-100: Critical (🔴 Crimson)

NOTE: This system provides AI-assisted decision-support signals only.
It does NOT provide medical diagnoses.
"""

from typing import Dict, Any, List, Optional


# Formula weights
ALPHA = 0.25  # Sentiment weight
BETA = 0.35   # Emotion weight
GAMMA = 0.25  # Lexicon weight
DELTA = 0.15  # Temporal weight


def calculate_risk_score(
    sentiment: dict,
    emotions: dict,
    features: dict,
    history: Optional[List[dict]] = None
) -> dict:
    """
    Calculate the composite risk score using the multi-factor weighted formula.
    
    Args:
        sentiment: VADER sentiment scores (compound, pos, neg, neu)
        emotions: Emotion probability distribution (7 emotions)
        features: Extracted features including distress score and crisis flags
        history: List of previous risk assessments for temporal analysis
    
    Returns:
        Dictionary with score, risk_level, confidence, and component scores
    """
    if history is None:
        history = []
    
    # ── Component 1: Sentiment Valence Impact (S) ──────────────────────────
    # Transform VADER compound [-1, +1] to risk scale [0, 100]
    # -1 (most negative) → 100 risk, +1 (most positive) → 0 risk
    compound = sentiment.get("compound", 0)
    s_score = max(0, min(100, (-compound + 1) * 50))
    
    # ── Component 2: Clinical Emotion Intensity (E) ────────────────────────
    # Weighted combination emphasizing sadness, fear, and anger
    # Joy acts as a protective factor (negative weight)
    sadness = emotions.get("sadness", 0)
    fear = emotions.get("fear", 0)
    anger = emotions.get("anger", 0)
    joy = emotions.get("joy", 0)
    disgust = emotions.get("disgust", 0)
    
    # Scale clinical negative emotional intensity appropriately
    neg_intensity = sadness * 1.5 + fear * 1.2 + anger * 1.0 + disgust * 0.7
    e_score = max(0, min(100, (neg_intensity - joy * 0.4) * 100))
    
    # ── Component 3: Lexicon-Based Distress Signals (L) ────────────────────
    l_score = features.get("distress_score", 0)
    
    # Boost for high self-reference ratio (rumination indicator)
    self_ref = features.get("self_ref_ratio", 0)
    if self_ref > 0.15:
        l_score = min(100, l_score + self_ref * 30)
    
    # ── Component 4: Temporal Velocity & Trend (T) ─────────────────────────
    t_score = _calculate_temporal_score(history)
    
    # ── Composite Score Calculation ────────────────────────────────────────
    r_score = (
        ALPHA * s_score +
        BETA * e_score +
        GAMMA * l_score +
        DELTA * t_score
    )
    r_score = max(0, min(100, r_score))
    
    # ── Crisis Override (Non-Negotiable Safety Guardrail) ──────────────────
    if features.get("crisis_override", False):
        r_score = max(r_score, 95.0)
    
    # ── Risk Level Classification ──────────────────────────────────────────
    risk_level = _classify_risk(r_score)
    
    # ── Confidence Estimation ──────────────────────────────────────────────
    # Higher confidence when more data points are available
    confidence = _estimate_confidence(features, history)
    
    return {
        "score": round(r_score, 1),
        "risk_level": risk_level,
        "confidence": round(confidence, 2),
        "components": {
            "sentiment": {"score": round(s_score, 1), "weight": ALPHA},
            "emotion": {"score": round(e_score, 1), "weight": BETA},
            "lexicon": {"score": round(l_score, 1), "weight": GAMMA},
            "temporal": {"score": round(t_score, 1), "weight": DELTA}
        },
        "crisis_override": features.get("crisis_override", False)
    }


def _calculate_temporal_score(history: List[dict]) -> float:
    """
    Calculate temporal risk based on trend analysis of previous assessments.
    
    Returns a score 0-100 where:
      - Rising risk trend → higher score
      - Stable/declining → lower score
      - No history → neutral (50)
    """
    if not history or len(history) < 2:
        return 50.0  # Neutral baseline when no history
    
    # Get the last 5 scores
    recent_scores = []
    for h in history[-5:]:
        if isinstance(h, dict) and "score" in h:
            recent_scores.append(h["score"])
        elif isinstance(h, (int, float)):
            recent_scores.append(float(h))
    
    if len(recent_scores) < 2:
        return 50.0
    
    # Calculate trend direction
    # Positive diff = risk is increasing (bad)
    diffs = [
        recent_scores[i] - recent_scores[i-1]
        for i in range(1, len(recent_scores))
    ]
    avg_diff = sum(diffs) / len(diffs)
    
    # Detect accelerating risk (3+ consecutive increases)
    consecutive_increases = 0
    for d in diffs:
        if d > 2:  # Meaningful increase threshold
            consecutive_increases += 1
        else:
            consecutive_increases = 0
    
    # Base temporal score on trend
    t_score = 50 + avg_diff * 2  # Scale the average change
    
    # Bonus for consecutive increases (accelerating risk)
    if consecutive_increases >= 3:
        t_score += 20
    elif consecutive_increases >= 2:
        t_score += 10
    
    return max(0, min(100, t_score))


def _classify_risk(score: float) -> str:
    """Classify numeric risk score into categorical tier."""
    if score >= 80:
        return "critical"
    elif score >= 60:
        return "high"
    elif score >= 30:
        return "moderate"
    else:
        return "low"


def _estimate_confidence(features: dict, history: list) -> float:
    """
    Estimate confidence in the risk assessment.
    Higher confidence when:
      - More text data (higher word count)
      - More history available
      - Multiple signal types agree
    """
    confidence = 0.60  # Base confidence
    
    # More words = more signal
    word_count = features.get("word_count", 0)
    if word_count >= 50:
        confidence += 0.10
    elif word_count >= 20:
        confidence += 0.05
    
    # History provides trend context
    if len(history) >= 5:
        confidence += 0.15
    elif len(history) >= 2:
        confidence += 0.08
    
    # Multiple distress categories = stronger signal
    matched = features.get("matched_categories", {})
    if len(matched) >= 3:
        confidence += 0.10
    elif len(matched) >= 1:
        confidence += 0.05
    
    return min(0.95, confidence)
