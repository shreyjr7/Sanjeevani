import os
import json
import re
import random
from typing import Optional, List, Dict, Any

import httpx
from .config import settings

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "hinglish": "Hinglish (conversational Hindi written in Roman/English alphabet)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
    "te": "Telugu (తెలుగు)",
    "ta": "Tamil (தமிழ்)",
    "gu": "Gujarati (ગુજરાતી)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "ur": "Urdu (اردو)",
}

def _build_language_instruction(language: str) -> str:
    lang_desc = LANGUAGE_NAMES.get(language, language)
    return (
        f"\n\nCRITICAL MULTILINGUAL INSTRUCTION:\n"
        f"The user has explicitly selected the language: '{lang_desc}'.\n"
        f"You MUST generate your entire conversational response in {lang_desc}.\n"
        f"- For Indic languages (Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu), write fluently in their authentic native script.\n"
        f"- For Hinglish, write natural, empathetic conversational Hindi using Roman/English alphabet.\n"
        f"- For English, write in fluent, warm, supportive English.\n"
        f"Maintain a calm, trauma-informed, conversational tone. Do not default to English when another language is requested."
    )

def _extract_response_text(raw_text: str) -> str:
    """Extract clean conversational response if model output is in JSON format."""
    if not raw_text:
        return ""
    text = raw_text.strip()
    
    # Check if text is enclosed in markdown code fences: ```json ... ``` or ``` ... ```
    fence_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    candidate = fence_match.group(1).strip() if fence_match else text

    # Try parsing candidate as JSON
    if candidate.startswith("{") and candidate.endswith("}"):
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                if "response" in data and isinstance(data["response"], str):
                    return data["response"].strip()
                if "reply" in data and isinstance(data["reply"], str):
                    return data["reply"].strip()
                if "message" in data and isinstance(data["message"], str):
                    return data["message"].strip()
        except Exception:
            pass
            
    # Try finding "response": "..." via regex
    resp_match = re.search(r'"response"\s*:\s*"((?:[^"\\]|\\.)*)"', candidate)
    if resp_match:
        try:
            return json.loads(f'"{resp_match.group(1)}"')
        except Exception:
            return resp_match.group(1).replace(r'\"', '"').replace(r'\n', '\n')

    return text

def _call_gemini(user_text: str, patient_name: str, counsellor_name: str, language: str,
                 conversation_history: List[Dict[str, str]],
                 vocal_emotion: Optional[Dict[str, Any]],
                 case_context: Optional[Dict[str, Any]]) -> Optional[str]:
    """Call Gemini model via Google Generative Language REST API.
    Works reliably without requiring external binary SDK packages.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or getattr(settings, "GEMINI_API_KEY", "")
    if not api_key or len(api_key.strip()) < 8:
        return None

    model = os.getenv("DEFAULT_AI_MODEL", getattr(settings, "DEFAULT_AI_MODEL", "gemini-2.0-flash"))
    # Normalize model name for v1beta API
    if "/" in model:
        model = model.split("/")[-1]

    system_instruction = getattr(settings, "SYSTEM_PROMPT", "")
    if language:
        system_instruction += _build_language_instruction(language)

    contents = []
    if conversation_history:
        for turn in conversation_history[-10:]:
            role = "user" if turn.get("role") == "user" else "model"
            content = turn.get("content", "")
            if content:
                contents.append({
                    "role": role,
                    "parts": [{"text": content}]
                })
    contents.append({
        "role": "user",
        "parts": [{"text": user_text}]
    })

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": float(getattr(settings, "LLM_TEMPERATURE", 0.7)),
            "maxOutputTokens": 1024
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key.strip()}"

    try:
        with httpx.Client(timeout=25.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        raw = parts[0]["text"]
                        return _extract_response_text(raw)
            else:
                print(f"[Gemini REST API error {resp.status_code}]: {resp.text[:200]}")
    except Exception as e:
        print(f"[Gemini REST Exception]: {e}")

    return None

def _call_openai(user_text: str, patient_name: str, counsellor_name: str, language: str,
                 conversation_history: List[Dict[str, str]],
                 vocal_emotion: Optional[Dict[str, Any]],
                 case_context: Optional[Dict[str, Any]]) -> Optional[str]:
    """Call OpenAI compatible API via REST."""
    api_key = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", "")
    if not api_key or len(api_key.strip()) < 8:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    sys_prompt = getattr(settings, "SYSTEM_PROMPT", "")
    if language:
        sys_prompt += _build_language_instruction(language)
    messages = [{"role": "system", "content": sys_prompt}]

    if conversation_history:
        for turn in conversation_history[-10:]:
            role = "user" if turn.get("role") == "user" else "assistant"
            content = turn.get("content", "")
            if content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_text})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": float(getattr(settings, "LLM_TEMPERATURE", 0.7)),
        "max_tokens": 1024
    }

    try:
        with httpx.Client(timeout=25.0) as client:
            resp = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key.strip()}", "Content-Type": "application/json"},
                json=payload
            )
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    raw = choices[0].get("message", {}).get("content", "")
                    return _extract_response_text(raw)
            else:
                print(f"[OpenAI REST error {resp.status_code}]: {resp.text[:200]}")
    except Exception as e:
        print(f"[OpenAI REST Exception]: {e}")

    return None

def generate_response(user_text: str, patient_name: str = "User", counsellor_name: str = "Counsellor",
                      language: str = "en", conversation_history: List[Dict[str, str]] = None,
                      vocal_emotion: Optional[Dict[str, Any]] = None,
                      case_context: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Unified LLM entry point.
    Dispatches to Gemini or OpenAI, or falls back to None (letting the autonomous engine respond).
    """
    provider = (os.getenv("LLM_PROVIDER") or getattr(settings, "LLM_PROVIDER", "gemini")).lower()
    
    if provider == "gemini":
        reply = _call_gemini(user_text, patient_name, counsellor_name, language,
                             conversation_history or [], vocal_emotion, case_context)
        if reply:
            return reply
    elif provider in {"openai", "gpt", "gpt4", "gpt-4", "gpt-4o"}:
        reply = _call_openai(user_text, patient_name, counsellor_name, language,
                             conversation_history or [], vocal_emotion, case_context)
        if reply:
            return reply

    # Fallback to alternative provider if key exists
    if os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", ""):
        reply = _call_gemini(user_text, patient_name, counsellor_name, language,
                             conversation_history or [], vocal_emotion, case_context)
        if reply:
            return reply
    if os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", ""):
        reply = _call_openai(user_text, patient_name, counsellor_name, language,
                             conversation_history or [], vocal_emotion, case_context)
        if reply:
            return reply

    return None

def get_greeting(language: str = "en") -> str:
    """Return a warm, natural greeting in the selected language."""
    greetings = {
        "hi": "नमस्ते! आप कैसे हैं? मैं संजीवनी हूँ, बताइए आज मैं आपकी क्या मदद कर सकता हूँ?",
        "hinglish": "Hello! Kaise ho aap? Main Sanjeevani hoon — aaj kis baare mein baat karna chahenge?",
        "bn": "নমস্কার! কেমন আছেন? আমি সঞ্জীবনী, আপনার সার্বক্ষণিক সহচর। আজ আপনাকে কীভাবে সাহায্য করতে পারি?",
        "mr": "नमस्कार! कसे आहात? मी संजीवनी आहे. आज मी आपल्याला कशी मदत करू शकेन?",
        "te": "నమస్కారం! మీరు ఎలా ఉన్నారు? నేను సంజీవని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
        "ta": "வணக்கம்! நீங்கள் எப்படி இருக்கிறீர்கள்? நான் சஞ்சீவனி. இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
        "gu": "નમસ્તે! તમે કેમ છો? હું સંજીવની છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
        "kn": "ನಮಸ್ಕಾರ! ನೀವು ಹೇಗಿದ್ದೀರಿ? ನಾನು ಸಂಜೀವನಿ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
        "ml": "നമസ്കാരം! സുഖമാണോ? ഞാൻ സഞ്ജീവനി ആണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?",
        "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ? ਮੈਂ ਸੰਜੀਵਨੀ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
        "or": "ନମସ୍କାର! ଆପଣ କିପରି ଅଛନ୍ତି? ମୁଁ ସଞ୍ଜୀବନୀ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
        "ur": "سلام! آپ کیسے ہیں؟ میں سنجیوانی ہوں۔ آج میں آپ کی کیا مدد کر سکتا ہوں؟",
    }
    if language in greetings:
        return greetings[language]

    en_options = [
        "Hello! How are you doing today? How can I help you?",
        "Hi there! What would you like to talk about today?",
        "Hey! I'm Sanjeevani, your companion. How can I assist you right now?",
        "Hello! How are you feeling today?",
        "Hi! It's good to see you. How can I support you today?",
    ]
    return random.choice(en_options)
