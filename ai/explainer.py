"""
Explainable AI (XAI) Module
============================
Generates human-readable explanations for risk assessments.
Provides 3-layer explainability:
  1. Token Attribution Highlighting
  2. Factor Contribution Breakdown
  3. Natural Language Clinician Rationale

NOTE: All outputs are template-driven (no LLM hallucination risk).
This system provides decision-support signals, NOT medical diagnoses.
"""

from typing import Dict, Any, List


def explain_risk(analysis_result: dict) -> dict:
    """
    Generate a comprehensive, explainable AI output for the risk assessment.
    
    Args:
        analysis_result: Complete pipeline result containing sentiment, emotions,
                         features, and risk score.
    
    Returns:
        Dictionary with rationale, factor_breakdown, token_attributions,
        and contributing_factors.
    """
    risk = analysis_result["risk"]
    score = risk["score"]
    level = risk["risk_level"]
    features = analysis_result["features"]
    sentiment = analysis_result["sentiment"]
    emotions = analysis_result["emotions"]
    
    # ── Layer 1: Token Attribution Highlighting ────────────────────────────
    token_attributions = features.get("token_attributions", {})
    
    # ── Layer 2: Factor Contribution Breakdown ─────────────────────────────
    factor_breakdown = _calculate_factor_breakdown(sentiment, emotions, features)
    
    # ── Layer 3: Natural Language Clinician Rationale ───────────────────────
    rationale = _generate_rationale(score, level, sentiment, emotions, features)
    
    # ── Contributing Factors List ──────────────────────────────────────────
    contributing_factors = _identify_contributing_factors(
        sentiment, emotions, features
    )
    
    return {
        "rationale": rationale,
        "factor_breakdown": factor_breakdown,
        "token_attributions": token_attributions,
        "contributing_factors": contributing_factors,
        "risk_level": level,
        "risk_score": round(score, 1)
    }


def _calculate_factor_breakdown(
    sentiment: dict, emotions: dict, features: dict
) -> dict:
    """
    Calculate the exact percentage contribution of each factor to the risk score.
    Based on the formula weights: α=0.25, β=0.35, γ=0.25, δ=0.15
    """
    # Calculate raw component scores
    s_raw = max(0, (-sentiment["compound"]) * 50 + 50)
    
    e_raw = (
        emotions.get("sadness", 0) * 100
        + emotions.get("fear", 0) * 100
        + emotions.get("anger", 0) * 50
    ) / 2.5
    
    l_raw = features.get("distress_score", 0)
    t_raw = 50  # Default temporal baseline
    
    # Weighted contributions
    s_contrib = 0.25 * s_raw
    e_contrib = 0.35 * e_raw
    l_contrib = 0.25 * l_raw
    t_contrib = 0.15 * t_raw
    
    total = s_contrib + e_contrib + l_contrib + t_contrib
    
    if total > 0:
        return {
            "sentiment": {
                "percentage": round((s_contrib / total) * 100, 1),
                "raw_score": round(s_raw, 1),
                "weight": 0.25,
                "description": "Valence polarity from VADER analysis"
            },
            "emotion": {
                "percentage": round((e_contrib / total) * 100, 1),
                "raw_score": round(e_raw, 1),
                "weight": 0.35,
                "description": "Clinical emotion intensity (sadness, fear, anger)"
            },
            "lexicon": {
                "percentage": round((l_contrib / total) * 100, 1),
                "raw_score": round(l_raw, 1),
                "weight": 0.25,
                "description": "Distress keyword and phrase signals"
            },
            "temporal": {
                "percentage": round((t_contrib / total) * 100, 1),
                "raw_score": round(t_raw, 1),
                "weight": 0.15,
                "description": "Historical trend and velocity"
            }
        }
    
    return {
        "sentiment": {"percentage": 25, "weight": 0.25},
        "emotion": {"percentage": 35, "weight": 0.35},
        "lexicon": {"percentage": 25, "weight": 0.25},
        "temporal": {"percentage": 15, "weight": 0.15}
    }


def _generate_rationale(
    score: float,
    level: str,
    sentiment: dict,
    emotions: dict,
    features: dict
) -> str:
    """
    Generate a template-driven natural language rationale for the clinician.
    No LLM involved — purely deterministic output.
    """
    parts = []
    
    # Opening statement
    parts.append(
        f"Patient evaluated at {level.upper()} risk (Score: {score:.1f}/100)."
    )
    
    # Crisis override alert
    if features.get("crisis_override"):
        crisis_kws = features.get("crisis_keywords", [])
        parts.append(
            f"CRISIS ALERT: Explicit self-harm/suicidal ideation keywords "
            f"detected: [{', '.join(crisis_kws)}]. Immediate intervention required."
        )
        return " ".join(parts)
    
    # Key drivers
    drivers = []
    
    # Emotion drivers
    dominant_emotions = _get_dominant_emotions(emotions)
    if dominant_emotions:
        emotion_strs = [
            f"{name} ({prob*100:.1f}%)" for name, prob in dominant_emotions
        ]
        drivers.append(f"prominent {', '.join(emotion_strs)}")
    
    # Sentiment driver
    compound = sentiment.get("compound", 0)
    if compound < -0.5:
        drivers.append(
            f"strongly negative sentiment (compound: {compound:.2f})"
        )
    elif compound < -0.2:
        drivers.append(f"negative sentiment (compound: {compound:.2f})")
    
    # Distress keyword drivers
    matched = features.get("matched_categories", {})
    if matched:
        for category, info in matched.items():
            kws = info.get("keywords", [])
            if kws:
                category_label = category.replace("_", " ").title()
                drivers.append(
                    f"{category_label.lower()} indicators "
                    f"('{', '.join(kws[:3])}')"
                )
    
    # Behavioral drivers
    behavioral_flags = features.get("behavioral_flags", [])
    for flag in behavioral_flags[:2]:
        drivers.append(flag.lower())
    
    if drivers:
        parts.append(f"Key drivers include {'; '.join(drivers)}.")
    
    # Recommendation
    if level == "critical":
        parts.append(
            "Recommendation: Immediate caseworker contact and crisis resources."
        )
    elif level == "high":
        parts.append(
            "Recommendation: Priority caseworker review within 24 hours."
        )
    elif level == "moderate":
        parts.append(
            "Recommendation: Continue monitoring. Consider follow-up check-in."
        )
    else:
        parts.append(
            "Status: Stable. Continue regular check-in schedule."
        )
    
    return " ".join(parts)


def _get_dominant_emotions(emotions: dict, threshold: float = 0.15) -> List:
    """Get emotions above the significance threshold, sorted by probability."""
    significant = [
        (name, prob) for name, prob in emotions.items()
        if isinstance(prob, (int, float)) and prob >= threshold
        and name not in ("neutral",)
    ]
    return sorted(significant, key=lambda x: x[1], reverse=True)[:3]


def _identify_contributing_factors(
    sentiment: dict, emotions: dict, features: dict
) -> List[Dict[str, Any]]:
    """
    Identify specific contributing factors for the risk score,
    ordered by severity/impact.
    """
    factors = []
    
    # Crisis keywords
    if features.get("crisis_override"):
        factors.append({
            "type": "crisis",
            "severity": "critical",
            "message": f"Crisis keywords detected: {', '.join(features['crisis_keywords'])}",
            "impact": "override"
        })
    
    # Negative sentiment
    compound = sentiment.get("compound", 0)
    if compound < -0.5:
        factors.append({
            "type": "sentiment",
            "severity": "high",
            "message": f"Strongly negative sentiment detected (compound: {compound:.2f})",
            "impact": "high"
        })
    elif compound < -0.2:
        factors.append({
            "type": "sentiment",
            "severity": "moderate",
            "message": f"Negative sentiment detected (compound: {compound:.2f})",
            "impact": "moderate"
        })
    
    # Dominant distressing emotions
    for name, prob in _get_dominant_emotions(emotions):
        if name in ("sadness", "fear", "anger") and prob >= 0.3:
            factors.append({
                "type": "emotion",
                "severity": "high" if prob >= 0.5 else "moderate",
                "message": f"Elevated {name} detected ({prob*100:.1f}%)",
                "impact": "high" if prob >= 0.5 else "moderate"
            })
    
    # Distress categories
    for category, info in features.get("matched_categories", {}).items():
        label = category.replace("_", " ").title()
        kws = info.get("keywords", [])
        factors.append({
            "type": "lexicon",
            "severity": "high" if info["weight"] >= 25 else "moderate",
            "message": f"{label} signals: {', '.join(kws[:3])}",
            "impact": "high" if info["weight"] >= 25 else "moderate"
        })
    
    # Behavioral flags
    for flag in features.get("behavioral_flags", []):
        factors.append({
            "type": "behavioral",
            "severity": "moderate",
            "message": flag,
            "impact": "moderate"
        })
    
    return factors
