from .preprocessing import clean_text
from .sentiment import analyze_sentiment
from .emotion import detect_emotions
from .features import extract_features
from .risk_model import calculate_risk_score
from .explainer import explain_risk

def run_pipeline(text: str, checkin_data: dict, history: list = None) -> dict:
    if history is None:
        history = []
        
    cleaned = clean_text(text)
    sentiment = analyze_sentiment(cleaned)
    emotions = detect_emotions(cleaned)
    features = extract_features(cleaned, checkin_data)
    
    risk = calculate_risk_score(sentiment, emotions, features, history)
    
    result = {
        "text": text,
        "cleaned_text": cleaned,
        "sentiment": sentiment,
        "emotions": emotions,
        "features": features,
        "risk": risk
    }
    
    explanation = explain_risk(result)
    result["explanation"] = explanation
    
    return result
