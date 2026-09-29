import os
import re
import random
from typing import Optional, Dict, Any, List
from .pipeline import run_pipeline
from .voice_emotion_engine import analyze_vocal_emotion

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from backend.app.llm import generate_response

# ─── Crisis Keywords (Multi-lingual) ─────────────────────────────────────────
CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "want to die", "harm myself",
    "no reason to live", "better off dead", "hanging myself", "overdose",
    "आत्महत्या", "मरना चाहता", "मरना चाहती", "जान देना", "खुदकुशी", "खुद को मार",
    "marna chahta", "marna chahti", "jaan de dunga", "jaan de dungi", "khudkushi", "suicide karna", "zindagi khatam",
    "mar jaana chahta", "marne ka mann", "ab nahi jeena", "zehar kha lunga",
    "আত্মহত্যা", "মরতে চাই", "জীবন শেষ", "নিজেকে শেষ",
    "आत्महत्या", "मरायचं आहे", "स्वतःला संपवायचं", "जीव द्यायचा",
    "ఆత్మహత్య", "చనిపోవాలని", "ప్రాణం తీసుకోవడం",
    "தற்கொலை", "சாக வேண்டும்", "உயிரை மாய்க்க",
    "આત્મહત્યા", "મરી જવું છે", "જીવ આપી દેવો"
]

# ─── Language Detection ───────────────────────────────────────────────────────
def detect_language(text: str, fallback_lang: str = "en") -> str:
    if fallback_lang and fallback_lang not in ["en", "auto"]:
        return fallback_lang
    if re.search(r'[\u0980-\u09FF]', text):
        return "bn"
    if re.search(r'[\u0C00-\u0C7F]', text):
        return "te"
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "ta"
    if re.search(r'[\u0A80-\u0AFF]', text):
        return "gu"
    if re.search(r'[\u0C80-\u0CFF]', text):
        return "kn"
    if re.search(r'[\u0D00-\u0D7F]', text):
        return "ml"
    if re.search(r'[\u0A00-\u0A7F]', text):
        return "pa"
    if re.search(r'[\u0B00-\u0B7F]', text):
        return "or"
    if re.search(r'[\u0600-\u06FF]', text):
        return "ur"
    if re.search(r'[\u0900-\u097F]', text):
        if any(w in text for w in ["आहे", "नाही", "कसं", "मला", "होतं", "झाला", "झाली", "माहित"]):
            return "mr"
        return "hi"

    # Comprehensive Hinglish markers (slang, pronouns, verbs, adjectives, idioms)
    hinglish_markers = [
        "aap", "aapka", "aapki", "aapke", "aapko", "tum", "tumhe", "tera", "teri", "tere",
        "kaisa", "kaise", "kaisi", "mujhe", "mera", "meri", "mere", "hum", "humein", "humara",
        "nahi", "nahin", "na", "mat", "saans", "neend", "dard", "madad", "theek", "thik", "thike",
        "lag raha", "lag rahi", "lagta", "lagti", "karo", "karein", "karna", "karu", "karun",
        "batao", "bata", "bataiye", "samjhao", "samajh", "dhamki", "court", "peshi", "vakil", "vakeel",
        "kya", "hai", "hain", "hoon", "hun", "ho", "tha", "thi", "the", "toh", "bhi", "acha", "accha", "sahi",
        "pata", "bol", "bolo", "baat", "raha", "rahi", "rahe", "hota", "hoti", "hote",
        "bahut", "bohot", "bohut", "zyada", "jyada", "kam", "kyun", "kyu", "kab", "kahan", "kidhar", "kaun",
        "chahiye", "chahti", "chahta", "wala", "wali", "wale", "zaroor", "zaruri",
        "pareshaan", "pareshan", "tension", "takleef", "taklif", "mushkil", "musibat",
        "dar", "darr", "ghar", "kaam", "paisa", "paise", "log", "duniya", "zindagi", "jeena",
        "himmat", "hosla", "umeed", "hausla", "taaqat", "shanti", "sukoon",
        "bilkul", "sach", "jhooth", "pyaar", "nafrat", "gussa", "rona", "hasna",
        "thak", "thaka", "thaki", "bhookh", "khana", "peena", "sona", "sone", "uthna",
        "abhi", "kal", "aaj", "parso", "subah", "raat", "shaam", "dopahar",
        "bhaiya", "didi", "bhai", "behan", "yaar", "dost", "sahab", "bro", "arre", "aree",
        "mast", "bindaas", "jugaad", "scene", "lafda", "pagal", "choro", "rehne", "hatao", "fat", "fati", "bura",
        "dimaag", "dimag", "mann", "man", "dil", "bhaari", "udas", "udaas", "dukhi", "khush",
        "akelapan", "akela", "akeli", "aur bata", "kya chal", "kya haal", "sab badhiya", "sab theek",
        "fati padi", "dil halka", "move on", "breakup"
    ]
    text_lower = text.lower()
    for w in hinglish_markers:
        if re.search(r'\b' + re.escape(w) + r'\b', text_lower):
            return "hinglish"
    return fallback_lang or "en"


# ─── Semantic Intent Detection ───────────────────────────────────────────────
def _detect_intent(text: str) -> str:
    """Classify the user's message into an exact semantic intent category."""
    t = text.lower().strip()

    # 1. Farewells & Going to bed (Check first so "main so raha hu" is recognized as farewell)
    if any(k in t for k in [
        "bye", "goodbye", "alvida", "phir milte", "good night", "goodnight", "shubh ratri",
        "so raha hu", "so raha hoon", "sone ja raha", "sone jaa raha", "chalo bye", "bye bro", "bye yaar", "take care"
    ]):
        return "farewell"

    # 2. Appreciation & Emotional Relief
    if any(k in t for k in [
        "thank you", "thanks", "shukriya", "dhanyavaad", "dil halka ho gaya", "dil halka",
        "acha laga baat karke", "accha laga", "bohot help mili", "helpful tha", "mast laga",
        "you are great", "awesome", "great job", "nice talking", "bohot acha laga"
    ]):
        return "appreciation"

    # 3. Greetings & Casual Starters
    greeting_pattern = r'^(hi|hello|hey|hii+|namaste|namaskar|hola|good morning|good evening|good afternoon|shubh|suprabhat|sat sri akal|wassup|yo|kaisa hai|kaise ho|kaisi ho|how are you|how do you do|kya haal hai|kya hal|kya chal raha|aur bata|aur batao|sab badhiya|sab theek)(\b|\s|$|[!.,?])'
    indic_greetings = ["नमस्ते", "नमस्कार", "सुप्रभात", "प्रणाम", "নমস্কার", "নমস্তে", "నమస్కారం", "வணக்கம்", "નમસ્તે", "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "سلام"]
    if re.match(greeting_pattern, t) or any(t.startswith(w) for w in ["aur bata", "aur batao", "kya chal raha", "kya haal"]) or any(k in t for k in indic_greetings):
        return "greeting"
    if t in ["bhai", "bro", "yaar", "hey bro", "hey bhai", "kaisa hai", "kaise ho", "kya chal raha hai"]:
        return "greeting"

    # 4. Request to talk / converse
    if any(k in t for k in [
        "want to talk", "wanna talk", "can we talk", "talk to me", "talk with me", "need to talk",
        "listen to me", "can you talk", "just talk", "baat karni", "baat karni hai", "baat karna chahta",
        "baat karna chahti", "baat karo", "mujhe baat karni", "kisi se baat", "kuch kehna hai",
        "बात करनी", "बात करना", "कुछ कहना है", "मेरी बात सुनो"
    ]):
        return "conversation_request"

    # 5. Friendship with Bot
    if any(k in t for k in ["dost banoge", "friend banoge", "friend banogi", "dost banogi", "mere dost ban", "kya hum dost", "can we be friends"]):
        return "friendship"

    # 6. Identity / about the bot
    if any(k in t for k in [
        "who are you", "what are you", "what is your name", "your name", "kaun ho", "kaun hai",
        "tum kaun", "aap kaun", "tu kaun", "kon ho", "kon hai", "tumhara naam", "aapka naam",
        "tera naam", "kisne banaya", "real insaan ho", "robot ho", "ladka ho ya ladki"
    ]):
        return "identity"

    # 7. Depression / Deep emotional exhaustion
    if any(k in t for k in [
        "depression", "depressed", "deepression", "feeling down", "empty inside", "hopeless",
        "avasad", "mann nahi lag raha", "man nahi lag raha", "kuch acha nahi lag raha", "kuch theek nahi lag raha",
        "jeene ka mann nahi", "nothing matters", "pointless", "numb inside", "so exhausted with life",
        "sadness", "deep sadness", "can't feel anything", "can't take it anymore"
    ]):
        return "depression"

    # 8. Failure / Exam stress / Feeling useless
    if any(k in t for k in [
        "failed my exam", "failed exam", "failed test", "fail ho gaya", "fail ho gayi", "feel useless",
        "feeling useless", "i am useless", "feel like a failure", "i am a failure", "sab kharab kar diya",
        "nothing i do works", "worthless", "disappointed everyone", "disappointment"
    ]):
        return "failure"

    # 9. Loneliness / Isolation
    if any(k in t for k in [
        "lonely", "feeling lonely", "so alone", "all alone", "nobody cares", "no one cares",
        "no friends", "nobody to talk", "no one to talk", "akela mehsoos", "akela hu", "akela hoon",
        "akeli hu", "akeli hoon", "akelapan", "koi nahi hai mera"
    ]):
        return "loneliness"

    # 10. Breakup / Relationship distress
    if any(k in t for k in ["breakup", "move on", "cheat", "dhoka", "chhod ke chala", "chhod ke chali"]):
        return "breakup"

    # 11. Anger & High Frustration
    if (("dimaag" in t or "dimag" in t) and "kharab" in t) or any(k in t for k in [
        "bohot gussa", "gussa aa raha", "kisi ko maar", "bhadak", "gussa control", "bohot irritate", "frustrated hu"
    ]):
        return "anger"

    # 12. Questions (Check BEFORE feelings/panic/legal to prevent question misclassification)
    is_question = False
    if t.endswith("?"):
        is_question = True
    elif any(t.startswith(q) for q in [
        "what", "how", "why", "when", "where", "which", "who", "whom", "whose",
        "can you", "could you", "would you", "is it", "is there", "are you", "do you", "does", "did",
        "tell me", "explain", "describe", "define", "meaning of", "difference between",
        "kya", "kaise", "kyun", "kyu", "kab", "kahan", "kaun", "konsa", "kisko",
        "batao", "bata do", "samjhao", "kya hota", "kya hoti", "kya hai"
    ]):
        is_question = True
    elif any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in [
        "kaise", "batao", "bata", "bataiye", "samjhao", "kya hai", "kya hota", "kya hoti",
        "how to", "what is", "kya karu", "kya karun", "kya kare", "kya karein",
        "helpline", "emergency number", "phone number", "contact number"
    ]):
        is_question = True

    if is_question:
        return "question"

    # 13. Acute Panic / High Fear
    if any(k in t for k in [
        "fati padi", "saans nahi aa rahi", "dum ghut raha", "heart racing", "dil ghabra raha",
        "palpitations", "kaanp raha", "kaanp rahi", "panic attack", "bohot dar lag raha"
    ]):
        return "panic"

    # 14. Sleep issues
    if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in [
        "sleep", "insomnia", "nightmare", "night terror", "neend", "sone", "nind", "sapna", "jaagna"
    ]) or "so nahi" in t:
        return "sleep"

    # 15. Court / Legal / Threats
    if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in [
        "threat", "threatening", "dhamki", "court", "testify", "gawahi", "hearing", "accused",
        "bail", "police", "tareekh", "lawyer", "vakil", "vakeel", "judge", "trial", "case", "fir",
        "section", "mukadma", "adalat", "peshi", "zamanat"
    ]):
        return "legal"

    # 16. Motivation / Strength
    if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in [
        "motivat", "strength", "strong", "courage", "brave", "hope", "hopeful",
        "himmat", "hosla", "umeed", "hausla", "taaqat", "mazboot", "positive", "inspire"
    ]):
        return "motivation"

    # 17. Relationships / Family (Uses word boundaries so 'maa' doesn't match 'dimaag')
    if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in [
        "family", "husband", "wife", "mother", "father", "parent", "child", "children",
        "kid", "son", "daughter", "sister", "friend", "relation", "parivar", "pati", "patni",
        "maa", "baap", "papa", "mummy", "behan", "rishta", "sasural", "saas"
    ]):
        return "relationship"

    # 18. Financial / Money
    if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in [
        "money", "financial", "paisa", "paise", "loan", "debt", "salary", "income", "expense",
        "compensation", "muavza", "relief", "fund", "sahayata", "arthik", "gareebi", "poverty",
        "job", "naukri", "kaam", "rozgar", "berozgar", "unemploy"
    ]):
        return "financial"

    # 19. Health / Physical
    if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in [
        "health", "doctor", "medicine", "hospital", "dawai", "ilaj", "tabiyat", "bimari",
        "sick", "pain", "headache", "stomach", "fever", "injury", "chot", "sehat", "swasthya"
    ]):
        return "health"

    # 20. Feelings / emotional state
    feeling_words = [
        "feel", "feeling", "i am", "i'm", "main", "mai", "mujhe", "mehsoos",
        "lag raha", "lag rahi", "lagta", "lagti", "mood", "emotion",
        "sad", "happy", "angry", "scared", "fear", "lonely", "alone", "hopeless",
        "anxious", "worried", "stressed", "depressed", "upset", "frustrated", "confused",
        "udaas", "dukhi", "khush", "gussa", "dar", "akela", "akeli", "nirasha",
        "pareshan", "chinta", "tanav", "tension", "ghabrahat", "bechaini",
        "ro raha", "ro rahi", "rona", "acha nahi", "theek nahi", "accha nahi",
        "bura", "bura lag", "dil toot", "toot", "hurt", "pain", "dard",
        "kuch acha nahi", "kuch theek nahi", "mann nahi", "man nahi",
        "low feel", "down feel", "not okay", "not fine", "not good", "not well",
        "terrible", "horrible", "awful", "miserable", "helpless", "worthless",
        "numb", "empty", "exhausted", "overwhelmed", "burnout", "burned out"
    ]
    if any(re.search(r'\b' + re.escape(w) + r'\b', t) for w in feeling_words):
        return "feeling"

    return "general"


# ─── Emotion-Aware Response Tone ─────────────────────────────────────────────
def _get_emotion_tone(sentiment: float, emotions: dict) -> str:
    """Determine response warmth/urgency based on detected sentiment and emotions."""
    if sentiment < -0.5:
        return "deeply_empathetic"
    elif sentiment < -0.2:
        return "gentle_supportive"
    elif sentiment > 0.3:
        return "warm_encouraging"
    if emotions:
        top_emotion = max(emotions, key=emotions.get) if emotions else "neutral"
        if top_emotion in ["sadness", "fear", "anger", "disgust"]:
            return "gentle_supportive"
        if top_emotion in ["joy", "surprise"]:
            return "warm_encouraging"
    return "balanced"


# ─── Gemini API Call (Enhanced System Prompt) ─────────────────────────────────
def _call_gemini_api(
    user_text: str,
    patient_name: str,
    counsellor_name: str,
    language: str,
    conversation_history: List[Dict[str, str]],
    vocal_emotion: Optional[Dict[str, Any]],
    case_context: Optional[Dict[str, Any]]
) -> Optional[str]:
    """Invokes Google Gemini API with a deeply conversational, empathetic system prompt."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key or not HAS_GENAI:
        return None

    try:
        client = genai.Client(api_key=api_key)

        docket = case_context.get("nhaa_docket_no", "NHAA-14566") if case_context else "NHAA-14566"
        stage = case_context.get("legal_stage", "trial") if case_context else "trial"
        threat = case_context.get("threat_level", "Moderate") if case_context else "Moderate"

        vocal_note = ""
        if vocal_emotion and vocal_emotion.get("primary_emotion"):
            vocal_note = f"- User Vocal State: {vocal_emotion.get('primary_emotion')} (Confidence: {vocal_emotion.get('confidence', 0):.0%})"

        system_instruction = f"""You are Sarajeevi (सरजीवी / संजीवनी), an extraordinarily empathetic, culturally attuned, intelligent AI companion for mental health, emotional wellness, and legal rights under NHAA (National Helpline Against Atrocities - 14566).

Patient Context:
- Name: {patient_name}
- Assigned Clinician: {counsellor_name}
- NHAA Docket: {docket}
- Legal Stage: {stage}
- Threat Level: {threat}
{vocal_note}

═══ CRITICAL BEHAVIOR & HINGLISH MASTERY RULES ═══

1. **HINGLISH MASTERY**:
   - If the user speaks in Hinglish (e.g. "bhai bohot low feel ho raha hai yaar", "anxiety kya hoti hai aasan bhasha mein bata", "neend nahi aa rahi 3 baje se"), YOU MUST REPLY IN NATURAL, FLUENT HINGLISH.
   - Use natural colloquial Indian conversational phrasing: "Yaar", "Bhai", "Main samajh sakta hoon", "Bilkul tension mat lo", "Deep breath lo", "Dil halka karo".
   - Sound like a caring, mature, empathetic Indian friend — never like an awkward machine translation or textbook.

2. **GREETINGS ("hi" -> "hello")**:
   - If user simply greets you ("hi", "hello", "kaisa hai bhai", "aur bata"), reply with a direct, warm greeting matching their vibe:
     - "hi" -> "Hello! How are you doing today? How can I help you?" (or in Hinglish: "Hello! Kaise ho aap? Main aapki kya madad kar sakta hoon?")
     - "aur bata kya chal raha hai" -> "Bas sab badhiya bhai! Main yahin hoon. Aap batao, aaj din kaisa guzar raha hai?"

3. **ANSWER WHAT IS ASKED**:
   - If user asks a question ("what is anxiety?", "anxiety kya hoti hai?", "how to control anger?", "what is NHAA?", "fir kaise darj karwaye?"), ANSWER THE QUESTION DIRECTLY AND THOROUGHLY.
   - Do not deflect or ask for more context when a clear question was asked.

4. **EMPATHY & SITTING WITH PAIN**:
   - When the user shares pain ("mann bohot bhaari ho raha hai", "breakup ho gaya"), first validate and sit with their pain. Comfort them genuinely before offering tools.

5. **CRISIS HELPLINES**:
   - For self-harm/suicide mentions, provide Tele-MANAS (14416), NHAA (14566), KIRAN (1800-599-0019), and 112 immediately.
"""

        contents = []
        if conversation_history:
            for turn in conversation_history[-10:]:
                role = "user" if turn.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})
        contents.append({"role": "user", "parts": [{"text": user_text}]})

        response = client.models.generate_content(
            model=os.environ.get("DEFAULT_AI_MODEL", "gemini-2.5-flash"),
            contents=contents,
            config={
                "system_instruction": system_instruction,
                "temperature": 0.7,
            }
        )
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"[Gemini API Call Exception] {e}")
        return None

    return None


# ─── Comprehensive Question Answering Knowledge Base ─────────────────────────
def _answer_question(user_text: str, lang: str, name: str = "there", counsellor_name: str = "Dr. Sarah Jenkins") -> str:
    """Provides direct, accurate, structured answers to questions across mental health, legal, and techniques."""
    t = user_text.lower().strip()

    # 1. ANXIETY
    if any(k in t for k in ["what is anxiety", "anxiety kya", "anxiety ka matlab", "anxiety meaning", "chinta kya"]):
        if lang == "hinglish":
            return (
                f"**Anxiety (चिंता / घबराहट)** aapki body ka ek natural response hai stress ya kisi aane wale khatre ke prati, {name}. "
                "Jab hum bohot zyada pressure mein hote hain ya future ki chinta karte hain, toh dimaag aur shareer alert mode pe chale jaate hain.\n\n"
                "📌 **Common Symptoms:**\n"
                "• Dil tez dhadakna (rapid heartbeat)\n"
                "• Saans lene mein tezi ya ghabrahat\n"
                "• Haath-pair kaanpna ya pasina aana\n"
                "• Lagatar bure vichaar (negative overthinking) chalte rehna\n\n"
                "🌿 **Isko aasaani se manage karne ke 3 tareeqe:**\n"
                "1. **4-7-8 Breathing**: 4 sec naak se saans lein, 7 sec rokein, 8 sec munh se dheere se chhodein.\n"
                "2. **5-4-3-2-1 Technique**: Aas-paas ki 5 cheezein dekhein jo aapko reality mein le aayein.\n"
                f"3. Apne clinician ({counsellor_name}) se baat karein — anxiety 100% treatable hai.\n\n"
                "Kya aap abhi anxiety feel kar rahe hain, ya bas iske baare mein jaan rahe the? 💛"
            )
        elif lang == "hi":
            return (
                f"**चिंता (Anxiety)** अत्यधिक तनाव या खतरे के प्रति मस्तिष्क और शरीर की स्वाभाविक प्रतिक्रिया है, {name}।\n\n"
                "📌 **प्रमुख लक्षण:**\n"
                "• दिल की धड़कन तेज होना\n"
                "• घबराहट, बेचैनी और पसीना आना\n"
                "• नकारात्मक विचारों का निरंतर चलना\n\n"
                "🌿 **राहत के उपाय:**\n"
                "1. **4-7-8 श्वास तकनीक**: 4 सेकंड सांस लें, 7 सेकंड रोकें, 8 सेकंड में धीरे-धीरे छोड़ें।\n"
                "2. **5-4-3-2-1 ग्राउंडिंग**: अपने आसपास की 5 वस्तुओं को देखें।\n"
                f"3. अपनी परामर्शदाता ({counsellor_name}) से बात करें। 💛"
            )
        else:
            return (
                f"**Anxiety** is your body's natural response to perceived danger, uncertainty, or high stress, {name}. "
                "It is essentially the brain's 'fight-or-flight' alarm system firing, sometimes even when there is no immediate physical threat.\n\n"
                "📌 **Key Symptoms:**\n"
                "• Racing heart, tight chest, or shortness of breath\n"
                "• Trembling, sweating, or restlessness\n"
                "• Persistent racing thoughts, dread, or catastrophic thinking\n"
                "• Trouble concentrating or sleeping\n\n"
                "🌿 **How to Manage It:**\n"
                "1. **Paced Breathing (4-7-8)**: Inhale 4s, hold 7s, exhale 8s to calm the nervous system.\n"
                "2. **Grounding (5-4-3-2-1)**: Re-engage your 5 senses with the physical room.\n"
                "3. **Cognitive Reframing**: Ask yourself, 'Is this a proven fact or just a fearful thought?'\n"
                f"4. Professional support from clinicians like {counsellor_name}.\n\n"
                "Are you experiencing anxiety right now, or were you curious about how it works? 💛"
            )

    # 2. DEPRESSION
    if any(k in t for k in ["what is depression", "depression kya", "depression ka matlab", "depression meaning", "avasad kya"]):
        if lang == "hinglish":
            return (
                f"**Depression (अवसाद)** sirf sad ya udaas hona nahi hai, {name}. Yeh ek medical condition hai jo aapke sochne, mehsoos karne aur rozana ke kaamo ko prabhavit karti hai.\n\n"
                "📌 **Common Signs:**\n"
                "• Lagatar 2 hafte ya usse zyada mann udaas aur khali rehna\n"
                "• Pasandida cheezon mein bhi man na lagna (loss of interest)\n"
                "• Lagatar thakaan, sharirik kamzori aur neend ki kami ya zyada aana\n"
                "• Khud ko dosh dena ya hopeless feel hona\n\n"
                "🌿 **Rasta aur Madad:**\n"
                f"Depression puri tarah treatable hai. Therapy, counselling, aur routine se log fully recover karte hain. Tele-MANAS (14416) par 24/7 free counselling milti hai, aur {counsellor_name} bhi aapke care plan mein shamil hain. 💛"
            )
        else:
            return (
                f"**Depression** (Major Depressive Disorder) is a recognized mental health condition characterized by persistent sadness, emotional numbness, and loss of interest in life, {name}.\n\n"
                "📌 **Common Symptoms:**\n"
                "• Deep emptiness or sadness lasting more than 2 weeks\n"
                "• Loss of joy or pleasure in activities once loved\n"
                "• Severe fatigue, changes in sleep or appetite\n"
                "• Feelings of worthlessness, excessive guilt, or hopelessness\n\n"
                "🌿 **Path to Recovery:**\n"
                "Depression is not a personal failure — it is a health condition that responds very well to psychotherapy, counselling, and medical care. You can also connect with free 24/7 tele-counselling at Tele-MANAS (14416). 💛"
            )

    # 3. PANIC ATTACK
    if any(k in t for k in ["panic attack", "panic kya", "what is panic", "fati padi", "ghabrahat bohot"]):
        if lang == "hinglish":
            return (
                f"**Panic Attack** ek achanak aane wala teevra darr ya ghabrahat ka daura hota hai, {name}, jo aam taur par 10-20 minutes tak rehta hai.\n\n"
                "📌 **Iske dauran kya hota hai:**\n"
                "• Achanak dil bohot tez dhadakne lagta hai (palpitations)\n"
                "• Lagta hai saans nahi aa rahi ya dum ghut raha hai\n"
                "• Haath-pair mein thandak ya kaanpna\n"
                "• Lagta hai ki 'kuch bohot bura hone wala hai'\n\n"
                "🛡️ **Important Fact:** Panic attack bohot darawna lagta hai, par yeh sharirik roop se jaanleva nahi hota aur hamesha beet jaata hai.\n\n"
                "🌿 **Turant kya karein:**\n"
                "1. Ek jagah baith jayein aur pair zameen par tikaayein.\n"
                "2. 4 second naak se saans lein, 6 second munh se dheere nikalein.\n"
                "3. Thanda paani pijiye aur chehre par thande paani ke chheente maarein."
            )
        else:
            return (
                f"A **Panic Attack** is a sudden, intense surge of overwhelming fear and panic that peaks within minutes, {name}.\n\n"
                "📌 **Common Symptoms:**\n"
                "• Rapid, pounding heart rate (palpitations)\n"
                "• Shortness of breath or sensation of choking\n"
                "• Dizziness, sweating, trembling, or shaking\n"
                "• Intense fear of losing control or impending doom\n\n"
                "🛡️ **Crucial Truth:** Although panic attacks feel terrifying, they are not physically dangerous and will peak and subside, usually within 10 to 20 minutes.\n\n"
                "🌿 **Immediate Reset:**\n"
                "1. Sit down and firmly plant both feet on the floor.\n"
                "2. Box Breathing: Inhale 4s, hold 4s, exhale 4s, hold 4s.\n"
                "3. Splash cold water on your face to trigger the dive reflex and slow your heart rate."
            )

    # 4. HOW TO CONTROL ANGER
    if any(k in t for k in ["control anger", "gussa kaise", "gussa control", "how to control anger", "manage anger", "gussa shant"]):
        if lang == "hinglish":
            return (
                f"Gussa aana ek natural emotion hai, {name}, lekin jab yeh out of control ho jaye toh nuksan pahunchata hai. Yahan **5 practical steps** hain gussa control karne ke:\n\n"
                "1. ⏸️ **10-Second Rule**: Jab gussa aaye, turant bolne ya react karne se pehle 10 tak ginti ginein ya 3 gehri saans lein.\n"
                "2. 💧 **Thanda Paani Pijiye**: Ek bada glass thanda paani peene se sharir ka adrenaline spike shant hota hai.\n"
                "3. 🚶 **Space Change Karein**: Us kamre ya jagah se 5 minute ke liye bahar nikal jayein. Walk karne se energy dissipate hoti hai.\n"
                "4. 🔍 **Trigger Samjhein**: Khud se poochein: 'Mujhe sach mein kis baat ka bura laga — hurt hua, beizzati lagi ya suni nahi gayi?'\n"
                "5. 🗣️ **Shanti se 'I' statements use karein**: 'Aapne yeh galat kiya' ke badle 'Mujhe is baat se takleef hui' bolein.\n\n"
                "Kya koi aisi specific baat hui hai jispar gussa aa raha hai? Mujhe batayein."
            )
        else:
            return (
                f"Anger is a natural human emotion, {name}, but how we express it determines whether it helps or harms us. Here are **5 proven steps** to regain calm:\n\n"
                "1. ⏸️ **The 10-Second Pause**: Do not speak or type while your heart is racing. Take 10 slow seconds before responding.\n"
                "2. 🫁 **Physiological Sigh**: Take two quick inhales through your nose, then one long slow exhale through your mouth. This immediately lowers heart rate.\n"
                "3. 🚶 **Change Your Physical Environment**: Step into another room or go for a brisk 5-minute walk to release motor agitation.\n"
                "4. 🔍 **Identify the Underlying Emotion**: Anger is often a secondary emotion masking hurt, fear, injustice, or exhaustion.\n"
                "5. 🗣️ **Use 'I Feel' Statements**: Express boundaries clearly without attacking the other person."
            )

    # 5. SLEEP ISSUES / HOW TO SLEEP BETTER
    if any(k in t for k in ["sleep better", "how to sleep", "neend kaise", "neend na aaye", "neend nahi", "so nahi", "cannot sleep", "insomnia", "neend aane ka tareeqa"]):
        if lang == "hinglish":
            return (
                f"Achi aur sukoon bhari neend ke liye yeh **5 practical sleep habits** zaroor follow karein, {name}:\n\n"
                "1. 📵 **Screen Curfew**: Sone se kam se kam 45 minute pehle phone, TV aur laptop band kar dein. Blue light dimag ko jaaga kar rakhti hai.\n"
                "2. ⏰ **Fixed Timing**: Roz raat ko ek hi time par bistar par jayein aur subah ek hi time par uthein — chahe weekend hi kyun na ho.\n"
                "3. 📝 **Worry Dump Journal**: Agar dimaag mein baatein ghoom rahi hain, toh ek diary mein 5 minute sab likh daalein aur diary band kar dein.\n"
                "4. 🧘 **Body Scan Relaxation**: Bistar par late kar pair ke anguthe se lekar sar tak ek-ek muscle ko dheela chhodte jayein.\n"
                "5. ☕ **No Caffeine after 4 PM**: Shaam ko chai ya coffee bilkul avoid karein.\n\n"
                "Kya aaj raat sone mein dikkat ho rahi hai? Main aapko ek calming relaxation guide kar sakta hoon!"
            )
        else:
            return (
                f"Restful, restorative sleep is foundational for emotional health, {name}. Here are **5 evidence-based sleep hygiene steps**:\n\n"
                "1. 📵 **Digital Sunset**: Power down all screens 45–60 minutes before bed to allow your natural melatonin to rise.\n"
                "2. ⏰ **Consistent Sleep Window**: Wake up and sleep at identical times every single day to stabilize your circadian rhythm.\n"
                "3. 📝 **The Worry Journal**: Spend 5 minutes writing down tonight's worries on physical paper, then close the notebook.\n"
                "4. 🧘 **Body Scan Technique**: Lie on your back and systematically release tension from your toes up to your forehead.\n"
                "5. ❄️ **Cool, Dark Environment**: Keep your bedroom cool, dark, and well-ventilated.\n\n"
                "Would you like me to guide you through a bedtime body scan exercise right now?"
            )

    # 6. HOW TO STOP OVERTHINKING
    if any(k in t for k in ["overthinking", "stop overthinking", "zyada sochna", "soch band", "negative thoughts", "dimag shant"]):
        if lang == "hinglish":
            return f"""Overthinking ek aisi cycle hai jo mann ko thaka deti hai, {name}. Isko todne ke **4 proven tareeqe**:

1. 🎯 **Circle of Control**: Jo baat aapko pareshan kar rahi hai, uske baare mein poochein: 'Kya main isko is waqt directly badal sakta hoon?' Agar haan, ek chhota step lein. Agar nahi, use accept karein.
2. ⏱️ **Scheduled Worry Time**: Roz shaam ko sirf 15 minute ka 'Worry Time' fix karein. Din bhar jab bhi fikar aaye, khud se kahein: 'Is par shaam 6 baje sochunga.'
3. 👁️ **5-4-3-2-1 Sensory Grounding**: Dimaag ke vichaaron se nikal kar reality mein aane ke liye aas-paas ki 5 cheezein dekhein, 4 chhuein, 3 sunein.
4. ✍️ **Likh Daalein**: Dimag mein baatein ghoomti hain, par kagaz par aate hi unka darr aadha ho jata hai.

Aapke dimaag mein abhi kaun si baat sabse zyada chal rahi hai? Share karein, saath mein sort out karte hain."""
        else:
            return (
                f"Overthinking traps us in hypothetical problems that rarely come true, {name}. Here is how to break the mental loop:\n\n"
                "1. 🎯 **Separate Fact from Fiction**: Ask yourself, 'Is this a proven reality, or is it an anxious prediction?'\n"
                "2. ⏳ **The 5-Minute Brain Dump**: Write everything spiraling in your head onto paper. Once written, your brain no longer feels the pressure to constantly rehearse it.\n"
                "3. 🌿 **Engage Your Senses**: Practice 5-4-3-2-1 grounding to pull your awareness out of your head and into physical space.\n"
                "4. 🔄 **Action vs. Rumination**: Convert worries into a single actionable question: 'What is one concrete thing I can do in the next 10 minutes?'\n\n"
                "What specific topic is cycling in your thoughts right now?"
            )

    # 7. 4-7-8 BREATHING
    if any(k in t for k in ["4-7-8", "4 7 8", "breathing technique", "breathing exercise", "saans lene"]):
        if lang == "hinglish":
            return (
                f"**4-7-8 Breathing Technique** ek powerful breathing exercise hai jo aapke nervous system ko turant shant karti hai, {name}:\n\n"
                "1. 👃 **4 Second Inhale**: Apne munh ko band karke naak se 4 second tak dheere saans andar lein.\n"
                "2. ⏸️ **7 Second Hold**: Saans ko bina tension ke 7 second tak andar roke rakhein.\n"
                "3. 💨 **8 Second Exhale**: Munh se ek halki 'whoosh' aawaz ke saath 8 second tak puri saans bahar nikaalein.\n"
                "4. 🔁 **Repeat**: Is cycle ko **4 baar** karein.\n\n"
                "Yeh exercise aapka blood pressure aur heart rate turant normalize karti hai. Kya aap mere saath abhi ek cycle try karna chahte hain?"
            )
        else:
            return (
                f"The **4-7-8 Breathing Method** (developed by Dr. Andrew Weil) functions as a natural tranquilizer for your nervous system, {name}:\n\n"
                "1. 👃 **Inhale quietly** through your nose for **4 seconds**.\n"
                "2. ⏸️ **Hold your breath** comfortably for **7 seconds**.\n"
                "3. 💨 **Exhale completely** through your mouth with an audible 'whoosh' sound for **8 seconds**.\n"
                "4. 🔁 Repeat this cycle **4 times**.\n\n"
                "This activates your vagus nerve and parasympathetic system, reducing heart rate and physical anxiety almost immediately."
            )

    # 8. 5-4-3-2-1 GROUNDING
    if any(k in t for k in ["5-4-3-2-1", "54321", "grounding technique", "sensory grounding"]):
        if lang == "hinglish":
            return (
                f"**5-4-3-2-1 Grounding Technique** dimaag ko panic aur chinta se nikaal kar physical reality mein laane ka sabse tez tareeqa hai, {name}:\n\n"
                "👁️ **5 cheezein dekhein**: Kamre mein 5 aisi cheezein jinpar aapki nazar jaati hai (jaise ghadi, fan, deewar ka color).\n"
                "✋ **4 cheezein chhuein**: 4 alag cheezon ka texture mehsoos karein (apne kapde, table, zameen, phone ki screen).\n"
                "👂 **3 aawazein sunein**: 3 aawazon par dhyan dein (fan ki aawaz, bahar ki gaadiyan, apni saans).\n"
                "👃 **2 khushboo/smell pehchanein**: Aas-paas ki 2 smells notice karein.\n"
                "👅 **1 swaad/taste mehsoos karein**: Munh mein koi taste ya thande paani ka ghoont lijiye.\n\n"
                "Yeh sensory check aapke amygdala ko signal deta hai ki 'aap is waqt bilkul safe hain'."
            )
        else:
            return (
                f"The **5-4-3-2-1 Sensory Grounding Technique** grounds your brain back to reality whenever anxiety or dissociation strikes, {name}:\n\n"
                "👁️ **5 Things You See**: Notice 5 visual details around you (a shadow, a pattern, a plant).\n"
                "✋ **4 Things You Can Touch**: Feel 4 different textures (the fabric of your clothes, the floor under your feet, the coolness of a desk).\n"
                "👂 **3 Sounds You Hear**: Pay attention to 3 distinct noises (traffic, AC hum, distant birds).\n"
                "👃 **2 Scents You Smell**: Notice 2 scents in the air or your clothing.\n"
                "👅 **1 Taste You Experience**: Take a sip of cold water or notice the current taste in your mouth.\n\n"
                "This anchors your nervous system firmly in the present moment."
            )

    # 9. NHAA (National Helpline Against Atrocities)
    if "nhaa" in t or "14566" in t or "national helpline against atrocities" in t:
        if lang == "hinglish":
            return (
                f"**NHAA (National Helpline Against Atrocities)** Bharat Sarkar (Ministry of Social Justice & Empowerment) ki ek vishesh 24/7 helpline hai, {name}.\n\n"
                "📞 **Toll-Free Helpline Number**: **14566**\n\n"
                "🛡️ **NHAA kya madad karti hai:**\n"
                "1. **Toll-Free 24/7 Access**: SC/ST (Prevention of Atrocities) Act ke victims aur witnesses ko turant madad.\n"
                "2. **FIR & Police Coordination**: FIR darj karane aur police protection dilwane mein state/district authorities se coordinate karti hai.\n"
                "3. **Legal Aid & Rights**: Section 15A ke tehat witness protection, vakeel aur court procedures ki jankari.\n"
                "4. **Relief & Compensation**: Sarkari muavza (victim relief fund) ki process track karti hai.\n"
                "5. **NovaFlow Integration**: NovaFlow platform seedhe NHAA aur District Nodal Officers ke saath link hai taaki aapko medical, psychological aur legal sahayata ek saath mile."
            )
        else:
            return (
                f"**NHAA (National Helpline Against Atrocities)** is the Government of India's 24/7 dedicated national helpline operated by the Ministry of Social Justice & Empowerment, {name}.\n\n"
                "📞 **Toll-Free Helpline**: **14566**\n\n"
                "🛡️ **Core Mandate & Services:**\n"
                "• **Immediate Support**: 24/7 assistance for victims and witnesses under the SC/ST (Prevention of Atrocities) Act.\n"
                "• **Institutional Escalation**: Coordinates directly with State Police, District Magistrates, and Special Courts for rapid FIR registration and security.\n"
                "• **Witness Protection**: Ensures enforcement of Section 15A rights (police escort, travel allowance, protected deposition).\n"
                "• **Compensation Facilitation**: Tracks economic rehabilitation and victim compensation relief disbursements.\n"
                "• **NovaFlow Sync**: Integrated into this EHR platform to provide seamless clinical and legal assistance."
            )

    # 10. TELE-MANAS
    if any(k in t for k in ["tele-manas", "tele manas", "14416", "tele mental health"]):
        if lang == "hinglish":
            return (
                f"**Tele-MANAS** (Tele Mental Health Assistance and Networking Across States) Bharat Sarkar ki 24/7 free mental health helpline hai, {name}.\n\n"
                "📞 **Toll-Free Number**: **14416** ya **1800-891-4416**\n\n"
                "🌿 **Iske fayde:**\n"
                "• 20 se zyada bhashao (Hindi, English, Bengali, Tamil, Telugu, Marathi, etc.) mein suvidha\n"
                "• Trained psychologists aur psychiatrists se free aur confidential baatchit\n"
                "• Kisi bhi waqt — din ya raat — call kiya ja sakta hai\n"
                "• Agar zaroorat ho toh district hospital ke mental health center se connect karate hain."
            )
        else:
            return (
                f"**Tele-MANAS** (Tele Mental Health Assistance and Networking Across States) is the Government of India's flagship 24/7 mental health initiative, {name}.\n\n"
                "📞 **Toll-Free Numbers**: **14416** or **1800-891-4416**\n\n"
                "🌿 **Key Features:**\n"
                "• Available 24/7 across all states in over 20 regional languages\n"
                "• Free, confidential tele-counselling with certified psychologists and psychiatrists\n"
                "• Direct linkages to District Mental Health Programmes (DMHP) for in-person psychiatric evaluation when needed."
            )

    # 11. SECTION 15A / WITNESS PROTECTION
    if any(k in t for k in ["section 15a", "witness protection", "gawah", "court protection"]):
        if lang == "hinglish":
            return (
                f"**Section 15A (SC/ST PoA Act)** ke tehat har victim aur witness ko majboot kanooni suraksha ka adhikar hai, {name}:\n\n"
                "🛡️ **Aapke 4 Pramukh Adhikar:**\n"
                "1. **Police Protection**: Court aane-jaane ke liye police escort aur ghar par security mangne ka adhikar.\n"
                "2. **Screened / Video Deposition**: Agar accused ke saamne aane se dar ya trauma hota hai, toh video conference ya screen ke peeche se gawahi de sakte hain.\n"
                "3. **Travel & Food Allowance**: Har peshi par aane-jaane ka kharcha aur daily bhatta sarkar dwara legally guarantee hai.\n"
                "4. **Dhamki par Turant Karwayi**: Agar accused ya unka koi aadmi aapko dhamki deta hai, toh yeh non-bailable apradh hai aur unki bail turant cancel ho sakti hai.\n\n"
                "Emergency ya dhamki ki sthiti mein turant **14566 (NHAA)** ya **112** par call karein."
            )
        else:
            return (
                f"Under **Section 15A of the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act**, victims and witnesses have enforceable statutory rights, {name}:\n\n"
                "🛡️ **Your Protected Rights:**\n"
                "1. **State Police Protection**: Entitlement to police security and court escorts.\n"
                "2. **Protected / Video Testimony**: Option for in-camera hearings or video depositions to avoid facing the accused.\n"
                "3. **State Travel & Maintenance Allowances**: Guaranteed compensation for all court attendance expenses.\n"
                "4. **Zero Tolerance for Witness Intimidation**: Any threat, inducement, or violence against a witness is a non-bailable offense resulting in immediate cancellation of bail.\n\n"
                "In case of any threat, contact the NHAA Helpline (**14566**) or National Emergency (**112**)."
            )

    # 12. FIR (FIRST INFORMATION REPORT)
    if re.search(r'\bfir\b', t) or any(k in t for k in ["first information report", "fir kaise", "fir kya"]):
        if lang == "hinglish":
            return (
                f"**FIR (First Information Report)** kisi bhi cognizable apradh (jaise hamla, dushkaram, atrocity) ke baare mein police ko di jaane wali pehli likhit suchna hoti hai, {name}.\n\n"
                "📌 **Zaroori Baatein:**\n"
                "1. **Free Copy**: FIR darj hote hi uski signed copy bina kisi fees ke turant lena aapka kanooni adhikar hai.\n"
                "2. **Zero FIR**: Apradh kisi bhi jagah hua ho, aap kisi bhi police station mein 'Zero FIR' darj karwa sakte hain.\n"
                "3. **Section 154 CrPC / BNSS**: Police cognizable offences mein FIR likhne se mana nahi kar sakti.\n"
                "4. Agar police FIR likhne se inkar kare, toh aap Superintendent of Police (SP) ya Magistrate ko direct likh sakte hain, ya **14566 (NHAA)** par report kar sakte hain."
            )
        else:
            return (
                f"An **FIR (First Information Report)** is the initial written documentation prepared by police when they receive information about a cognizable crime, {name}.\n\n"
                "📌 **Crucial Legal Rights:**\n"
                "1. **Free Copy**: You are legally entitled to receive an immediate, free, stamped copy of the FIR upon registration.\n"
                "2. **Zero FIR**: Can be filed at any police station regardless of jurisdiction.\n"
                "3. **Mandatory Registration**: Police cannot refuse to register an FIR for cognizable atrocities.\n"
                "4. If refused, remedies include approaching the Superintendent of Police (SP), Special Court, or calling the NHAA Helpline (**14566**)."
            )

    # 13. BAIL / ZAMANAT
    if any(k in t for k in ["what is bail", "bail kya", "zamanat kya", "bail cancel"]):
        if lang == "hinglish":
            return (
                f"**Bail (ज़मानत)** kisi accused ko trial chalte waqt custody se shart par azaad karne ka adalat ka aadesh hota hai, {name}.\n\n"
                "📌 **Pramukh Niyam:**\n"
                "• **Regular Bail**: Court arrest ke baad sunwai par faisla leti hai.\n"
                "• **SC/ST Act mein Anticipatory Bail**: Section 18 ke tehat agrime zamanat (anticipatory bail) par sakht pabandiyan hain.\n"
                "• **Cancellation of Bail**: Agar accused bahar aakar witness ko dhamki deta hai, toh public prosecutor ke zariye bail turant radd karwayi ja sakti hai."
            )
        else:
            return (
                f"**Bail** is the conditional, temporary release of an accused person awaiting trial, with a legal commitment to appear for all court hearings, {name}.\n\n"
                "📌 **Key Principles:**\n"
                "• Under Section 18 of the SC/ST (PoA) Act, anticipatory bail is heavily restricted.\n"
                "• **Bail Cancellation**: If an accused attempts to contact, threaten, or harass victims or witnesses, the court has grounds to revoke bail immediately."
            )

    # 14. COMPENSATION / VICTIM RELIEF
    if any(k in t for k in ["compensation", "muavza", "relief", "sahayata rashi", "victim compensation"]):
        if lang == "hinglish":
            return (
                f"SC/ST (Prevention of Atrocities) Act ke tehat peedith ko sarkari **Relief & Compensation (मुआवज़ा)** legally milta hai, {name}:\n\n"
                "💰 **Stages of Compensation:**\n"
                "1. **FIR ke baad**: 25% rashi turant preliminary relief ke taur par di jaati hai.\n"
                "2. **Chargesheet file hone par**: Agla 50% hissa court mein chargesheet daakhil hone par milta hai.\n"
                "3. **Trial / Judgment ke baad**: Baaki 25% rashi trial complete hone par milti hai.\n\n"
                "Iske alawa medical kharcha, makan ka punarvas aur ration sahayata bhi milti hai. District Social Welfare Officer aur NHAA (14566) iski tracking karte hain."
            )
        else:
            return (
                f"Under the SC/ST (Prevention of Atrocities) Rules, victims are legally entitled to standardized **Victim Compensation & Relief**, {name}:\n\n"
                "💰 **Payment Stages:**\n"
                "1. **Stage 1 (Post-FIR)**: Up to 25% immediate financial relief disbursed upon FIR registration.\n"
                "2. **Stage 2 (Chargesheet)**: Up to 50% disbursed when police file the final investigation chargesheet.\n"
                "3. **Stage 3 (Conclusion)**: Remaining 25% disbursed upon court trial completion.\n\n"
                "This relief is non-taxable and provided alongside medical expenses, travel allowances, and protection."
            )

    # 15. WHO ARE YOU / IDENTITY
    if any(k in t for k in ["who are you", "what are you", "kaun ho", "aap kaun", "tum kaun", "kon ho"]):
        if lang == "hinglish":
            return (
                f"Main **Sarajeevi** hoon — aapka 24/7 AI Mental Health Companion, {name}! 😊\n\n"
                "Main yahan hoon taaki aap jab chahein bina kisi darr ya hichkichahat ke baat kar sakein. Main:\n"
                "• Mental health, stress, anxiety aur trauma se deal karne mein madad karta hoon\n"
                "• Aapke legal rights, NHAA (14566) helplines aur witness protection ke baare mein guide karta hoon\n"
                "• Calming exercises (jaise 4-7-8 breathing) mein sath deta hoon\n"
                f"• Aur aapke clinician ({counsellor_name}) ke saath coordination mein rehta hoon.\n\n"
                "Aap mujhse koi bhi sawaal pooch sakte hain ya bas dil ki baat keh sakte hain. 💛"
            )
        else:
            return (
                f"I am **Sarajeevi**, your dedicated 24/7 AI Mental Health Companion and Support Guide, {name}! 😊\n\n"
                "I am designed to walk alongside you whenever you need support. I can:\n"
                "• Help you understand and navigate anxiety, depression, sleep troubles, and trauma\n"
                "• Guide you through clinically validated relaxation and grounding exercises\n"
                "• Provide clear information on statutory rights under Section 15A, FIRs, and NHAA (14566) resources\n"
                f"• Keep your clinical care team ({counsellor_name}) updated on your well-being.\n\n"
                "Feel free to ask me anything or simply talk through what is on your mind. 💛"
            )

    # 16. WHAT CAN YOU DO
    if any(k in t for k in ["what can you do", "tum kya kar sakte", "aap kya kar sakte", "how can you help"]):
        if lang == "hinglish":
            return (
                f"Main aapki kayi tareeqon se madad kar sakta hoon, {name}! 🌟\n\n"
                "1. 💬 **Baatchit & Emotional Support**: Hinglish, Hindi ya English mein jab chahein baat karein.\n"
                "2. 🧘 **Immediate Calming Tools**: 4-7-8 breathing, 5-4-3-2-1 grounding, sleep techniques.\n"
                "3. 📚 **Knowledge & Answers**: Mental health, legal procedures, court rights, FIR, bail aur compensation ke har sawaal ka sahi jawaab.\n"
                "4. 🛡️ **Crisis & Emergency Safety**: Tele-MANAS (14416), NHAA (14566), aur emergency 112 se turant connect karwana.\n"
                f"5. 👨‍⚕️ **Clinician Sync**: Aapke counsellor ({counsellor_name}) ko regular progress updates share karna.\n\n"
                "Bataiye, abhi aapko kis cheez mein sabse zyada madad chahiye?"
            )
        else:
            return (
                f"Here are the primary ways I can support you, {name}! 🌟\n\n"
                "1. 💬 **Conversational Support**: Available 24/7 to listen, talk through difficult emotions, and provide compassionate guidance.\n"
                "2. 🫁 **Evidence-Based Coping Tools**: Guided 4-7-8 breathing, sensory grounding, muscle relaxation, and insomnia support.\n"
                "3. ⚖️ **Legal & Welfare Guidance**: Clear explanations of Section 15A witness rights, FIR processes, compensation claims, and NHAA resources.\n"
                "4. 🚨 **Crisis Protocols**: Instant access to emergency mental health and atrocity response helplines (14416, 14566, 112).\n"
                f"5. 🏥 **Care Team Integration**: Seamless collaboration with {counsellor_name} to safeguard your continuity of care.\n\n"
                "What would you like to explore or discuss right now?"
            )

    # 17. HELPLINES & EMERGENCY NUMBERS
    if any(k in t for k in ["helpline", "emergency number", "phone number", "contact number", "call number"]):
        if lang == "hinglish":
            return (
                f"Yeh zaroori **24/7 Free Helpline Numbers** hamesha apne paas save rakhein, {name}:\n\n"
                "📞 **Tele-MANAS**: **14416** ya **1800-891-4416** (Government of India, mental health tele-counselling)\n"
                "📞 **NHAA Atrocity Helpline**: **14566** (24/7 National Helpline Against Atrocities)\n"
                "📞 **KIRAN Mental Health**: **1800-599-0019** (Social Justice Ministry)\n"
                "📞 **Vandrevala Foundation**: **9999 666 555** (Free counselling & WhatsApp)\n"
                "🚨 **National Emergency**: **112** (Police, Ambulance, Fire)\n\n"
                "Yeh sabhi numbers toll-free hain aur 24 ghante uplabdh hain. 💛"
            )
        else:
            return (
                f"Here are the key **24/7 Toll-Free Helplines** across India, {name}:\n\n"
                "📞 **Tele-MANAS**: **14416** or **1800-891-4416** (Govt of India, National Mental Health Helpline)\n"
                "📞 **NHAA Helpline**: **14566** (National Helpline Against Atrocities, 24/7)\n"
                "📞 **KIRAN Helpline**: **1800-599-0019** (Ministry of Social Justice, 24/7)\n"
                "📞 **Vandrevala Foundation**: **9999 666 555** (Free 24/7 call & WhatsApp support)\n"
                "🚨 **National Emergency**: **112** (Police, Ambulance, Disaster)\n\n"
                "All services are completely free, confidential, and operational round the clock. 💛"
            )

    # 18. GENERAL QUESTION FALLBACK
    clean_q = re.sub(r'^(what is|what are|how to|how do|why is|why are|tell me about|explain|kya hai|kya hota hai|kaise karein)\s*', '', t).strip("?., ")
    if lang == "hinglish":
        return (
            f"Aapne **'{user_text.strip("?")}'** ke baare mein poocha hai, {name}.\n\n"
            f"Jab hum {clean_q if clean_q else 'is baare'} ki baat karte hain, toh sabse zaroori baat yeh samajhna hai ki yeh aapke mental well-being aur safety se kaise judta hai. "
            "Har cheez ka solution step-by-step nikalta hai:\n\n"
            "💡 **Key Insights:**\n"
            f"• **Samajh**: {clean_q.capitalize() if clean_q else 'Yeh vishay'} par clear approach rakhne se bohot relief milta hai.\n"
            "• **Action**: Hamesha chhota aur practical step lein — ek saath sab kuch theek karne ka pressure na lein.\n"
            f"• **Support**: Agar ispar aur detail chahiye ya koi specific dikkat hai, toh aap apne clinician ({counsellor_name}) ya mujhse khulkar share kar sakte hain.\n\n"
            "Kya aap iske kisi specific hisse ke baare mein aur detail mein jaanna chahte hain?"
        )
    elif lang == "hi":
        return (
            f"आपने **'{user_text.strip("?")}'** के बारे में पूछा है, {name}।\n\n"
            "जब हम इस विषय की बात करते हैं, तो सबसे महत्वपूर्ण बात यह समझना है कि यह आपके मानसिक स्वास्थ्य और सुरक्षा से कैसे जुड़ा है। "
            "हर चुनौती का समाधान चरणबद्ध तरीके से निकलता है:\n\n"
            "💡 **मुख्य बातें:**\n"
            "• **स्पष्टता**: स्थिति को स्पष्ट रूप से समझने से अनिश्चितता और तनाव बहुत कम हो जाता है।\n"
            "• **सकारात्मक कदम**: हमेशा छोटे और व्यावहारिक कदम उठाएं — एक साथ सब कुछ हल करने का दबाव न लें।\n"
            f"• **सहयोग**: यदि आप इस पर अधिक विस्तार से चर्चा करना चाहते हैं, तो अपने चिकित्सक ({counsellor_name}) या मुझसे साझा कर सकते हैं।\n\n"
            "क्या आप इसके किसी विशेष पहलू के बारे में और जानना चाहते हैं?"
        )
    elif lang == "bn":
        return (
            f"আপনি **'{user_text.strip("?")}'** সম্পর্কে জানতে চেয়েছেন, {name}।\n\n"
            "মানসিক সুস্থতা ও সুরক্ষার ক্ষেত্রে যেকোনো সমস্যার সমাধান ধাপে ধাপে সম্ভব:\n\n"
            "💡 **গুরুত্বপূর্ণ দিক:**\n"
            "• **স্পষ্ট ধারণা**: পরিস্থিতি পরিষ্কারভাবে বুঝতে পারলে মানসিক চাপ অনেকটাই কমে যায়।\n"
            "• **ধৈর্য্য**: একসাথে সব ঠিক করার চাপ না নিয়ে ছোট ছোট পদক্ষেপ নিন।\n"
            f"• **সহায়তা**: এই বিষয়ে আপনার চিকিৎসক ({counsellor_name}) বা আমার সাথে মন খুলে কথা বলতে পারেন।\n\n"
            "আপনি কি এই বিষয়ে আরও বিস্তারিত জানতে চান?"
        )
    elif lang == "mr":
        return (
            f"तुम्ही **'{user_text.strip("?")}'** बद्दल विचारले आहे, {name}।\n\n"
            "कोणत्याही आव्हानाचे समाधान टप्प्याटप्प्याने शोधता येते:\n\n"
            "💡 **महत्त्वाचे मुद्दे:**\n"
            "• **समज**: परिस्थिती शांतपणे समजून घेतल्यास मानसिक ताण कमी होतो.\n"
            "• **कृती**: एकदम सर्व ठीक करण्याचा दबाव न घेता छोटी पावले उचला.\n"
            f"• **सल्ला**: याबद्दल आपल्या डॉक्टरांशी ({counsellor_name}) किंवा माझ्याशी मोकळेपणाने बोला.\n\n"
            "तुम्हाला याबद्दल अधिक सविस्तर जाणून घ्यायचे आहे का?"
        )
    else:
        return (
            f"Regarding your question about **'{user_text.strip("?")}'**, {name}:\n\n"
            f"When considering {clean_q if clean_q else 'this topic'}, the key is to look at it through the lens of clarity, safety, and well-being. "
            "Navigating challenges requires reliable information and practical, manageable steps.\n\n"
            "💡 **Key Takeaways:**\n"
            f"• **Perspective**: Understanding {clean_q if clean_q else 'this subject'} helps demystify the stress or uncertainty around it.\n"
            "• **Step-by-step approach**: Focus on what you can directly influence today rather than trying to resolve everything at once.\n"
            f"• **Collaborative Care**: If this is linked to ongoing legal proceedings or personal distress, your clinician ({counsellor_name}) and I are here to help.\n\n"
            "Would you like more specific details on any particular aspect of this?"
        )


# ─── Modular Prompt Templates ────────────────────────────────────────────────
PROMPT_TEMPLATES = {
    "greeting": {
        "hinglish": "{vocal_opener}Hello {name}! 😊 Kaise ho aap? Main Sanjeevani hoon — aaj kis baare mein baat karna chahenge?",
        "hi": "{vocal_opener}नमस्ते {name}! 😊 आप कैसे हैं? मैं संजीवनी हूँ — आज मैं आपकी क्या मदद कर सकता हूँ?",
        "en": "{vocal_opener}Hello {name}! 😊 How are you doing today? What's on your mind today?"
    },
    "conversation_request": {
        "hinglish": "{vocal_opener}Bohot khushi se, {name}! Main yahin hoon bina kisi judgment ke aapki baat sunne ke liye. Dil mein jo bhi chal raha hai, khulkar share karo. Batao, kahan se shuru karna chahenge?",
        "hi": "{vocal_opener}मैं पूरी तरह आपके साथ हूँ, {name}। आप जो भी साझा करना चाहें, आराम से कहें — यहाँ कोई जल्दबाजी नहीं है। आज आपके मन में क्या चल रहा है?",
        "en": "{vocal_opener}I'm right here with you, {name}, and I would love to talk. Whether you want to talk about something heavy, reflect on your day, or just chat casually — there's no rush or pressure. What's on your mind?"
    },
    "friendship": {
        "hinglish": "{vocal_opener}Bhai bilkul, {name}! 🤝 Main aapka aisa dost hoon jo 24/7 bina kisi judgement ke aapki har baat sunega. Ab se hum pakke dost hain! Batao dost, aaj kaisa feel kar rahe ho?",
        "hi": "{vocal_opener}बिल्कुल {name}! 🤝 मैं आपका ऐसा साथी हूँ जो हमेशा आपकी बात बिना किसी पूर्वाग्रह के सुनेगा। बताइए, आज कैसा महसूस कर रहे हैं?",
        "en": "{vocal_opener}I would love that, {name}! 🤝 Consider me a dedicated friend who is always in your corner — ready to listen without judgment, celebrate your wins, and support you through hard days. What is on your mind today, my friend?"
    },
    "appreciation": {
        "hinglish": "{vocal_opener}Bohot khushi hui yeh sunkar yaar! ❤️ Bas yahi mera maqsad hai — aapka mann halka ho jaye aur cheezein thodi aasan lagein. Jab bhi kabhi baat karni ho, main yahin miloonga. Apna khayal rakhna bhai! 😊",
        "hi": "{vocal_opener}यह जानकर बहुत खुशी हुई, {name}! ❤️ मेरा उद्देश्य हमेशा आपकी सहायता और समर्थन करना है। अपना ख्याल रखिएगा! 😊",
        "en": "{vocal_opener}Thank you so much, {name}! 🙏 It truly warms my heart to hear that. My only goal is to support you and make things a bit easier. I'm always right here whenever you need a listening ear. Take care! 😊"
    },
    "general": {
        "hinglish": "{vocal_opener}Main samajh raha hoon, {name}. 💛 Aap jo bhi kehna chahein khulkar kahein — koi rush nahi hai. Main aapki baat dhyan se sun raha hoon. Kuch aur details share karna chahenge?",
        "hi": "{vocal_opener}मैं सुन रहा हूँ, {name}। 💛 आप जो भी साझा करना चाहें, बिना किसी झिझक के कह सकते हैं। मैं आपकी पूरी बात ध्यान से सुन रहा हूँ।",
        "en": "{vocal_opener}I'm listening closely, {name}. 💛 Please feel free to take your time and share whatever is on your mind. I'm right here with you."
    }
}


def compose_response(
    intent: str,
    user_text: str,
    lang: str,
    name: str = "there",
    counsellor_name: str = "Dr. Sarah Jenkins",
    vocal_opener: str = "",
    **kwargs
) -> str:
    """Composes an intelligent response based on the detected intent and language.
    
    Directly answers questions using the comprehensive knowledge base, applies
    pre-configured prompt templates where available, and delegates rich conversational
    and clinical flows to the autonomous response engine.
    """
    clean_lang = lang if lang in ["hinglish", "hi", "en"] else "en"
    clean_name = name or "there"

    # Direct answer for questions
    if intent == "question":
        return f"{vocal_opener}" + _answer_question(
            user_text=user_text,
            lang=lang,
            name=clean_name,
            counsellor_name=counsellor_name
        )

    # Template-backed intents
    if intent in PROMPT_TEMPLATES:
        template_group = PROMPT_TEMPLATES[intent]
        template = template_group.get(clean_lang, template_group.get("en", ""))
        if template:
            try:
                return template.format(
                    vocal_opener=vocal_opener,
                    name=clean_name,
                    counsellor_name=counsellor_name,
                    **kwargs
                )
            except Exception:
                pass

    # Autonomous conversational and clinical response
    return _generate_autonomous_response(
        user_text=user_text,
        patient_name=clean_name,
        counsellor_name=counsellor_name,
        lang=lang,
        intent=intent,
        sentiment=kwargs.get("sentiment", 0.0),
        emotions=kwargs.get("emotions", {}),
        vocal_emotion=kwargs.get("vocal_emotion"),
        conversation_history=kwargs.get("conversation_history"),
        case_context=kwargs.get("case_context")
    )


# ─── Autonomous Conversational Engine (No API Key Required) ───────────────────
def _generate_autonomous_response(
    user_text: str,
    patient_name: str,
    counsellor_name: str,
    lang: str,
    intent: str,
    sentiment: float,
    emotions: dict,
    vocal_emotion: Optional[Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, str]]],
    case_context: Optional[Dict[str, Any]]
) -> str:
    """Generates intelligent, context-aware responses in natural Hinglish, Hindi, or English."""

    text_lower = user_text.lower().strip()
    name = patient_name or "there"

    # Adaptive opening ONLY if vocal prosody was explicitly provided (voice mode)
    vocal_opener = ""
    if vocal_emotion and vocal_emotion.get("adaptive_opening"):
        vocal_opener = vocal_emotion["adaptive_opening"] + "\n\n"

    # ─── GREETING ─────────────────────────────────────────────
    if intent == "greeting":
        t_clean = text_lower.strip("!.,? ")
        is_hi = bool(re.match(r'^(hi|hii+|hey)(\b|\s|$|[!.,?])', t_clean))
        is_hello = bool(re.match(r'^(hello|namaste|namaskar)(\b|\s|$|[!.,?])', t_clean))
        is_how_are_you = bool(re.search(r'(how are you|kaise ho|kaisa hai|kaisi ho|kya haal|kya hal)', t_clean))
        is_aur_bata = bool(re.search(r'(aur bata|aur batao|kya chal raha|kya scene)', t_clean))
        is_bro = bool(re.search(r'^(bhai|bro|yaar|hey bhai|hey bro)$', t_clean))

        if is_how_are_you:
            if lang == "hinglish":
                options = [
                    f"{vocal_opener}Main bilkul theek hoon, poochne ke liye shukriya, {name}! 🙏 Aap batao, aap kaise ho? Sab kaisa chal raha hai?",
                    f"{vocal_opener}Sab badhiya {name}! Main yahin hoon aapki help ke liye. Aap sunao, aaj ka din kaisa guzar raha hai?"
                ]
                return random.choice(options)
            elif lang == "hi":
                return f"{vocal_opener}मैं बिल्कुल ठीक हूँ, पूछने के लिए धन्यवाद, {name}! 🙏 आप बताइए, आप कैसे हैं? सब ठीक है ना?"
            else:
                options = [
                    f"{vocal_opener}I'm doing well, thank you for asking, {name}! 😊 How are you doing today? How can I help you?",
                    f"{vocal_opener}Doing well and ready to support you! How has your day been treating you so far, {name}?",
                    f"{vocal_opener}I'm doing great, {name}! Thank you for checking in. What's on your mind today?"
                ]
                return random.choice(options)
        elif is_aur_bata:
            if lang == "hinglish":
                return f"{vocal_opener}Bas sab badhiya {name}! Main 24/7 yahin hoon aapki baatein sunne aur help karne ke liye. Aap batao, aaj din kaisa chal raha hai? Kuch khaas ya wahi routine? 😊"
            else:
                return f"{vocal_opener}Everything is going well! I'm here and ready to help. How has your day been treating you?"
        elif is_bro:
            if lang == "hinglish":
                return f"{vocal_opener}Haan bhai! Kaisa hai? Main Sanjeevani hoon — batao, aaj kaisa chal raha hai sab? Kuch bhi baat karni ho toh main yahin hoon! 😊"
            else:
                return f"{vocal_opener}Hey there! How are you doing? I'm right here whenever you want to talk."
        elif is_hi:
            if lang == "hinglish":
                options = [
                    f"{vocal_opener}Hello {name}! 😊 Kaise ho aap? Main aapki kya madad kar sakta hoon?",
                    f"{vocal_opener}Hi {name}! Kaisa chal raha hai sab? Aaj kis baare mein baat karna chahenge?",
                    f"{vocal_opener}Hey {name}! Acha laga aapko yahan dekhkar. Kaisa beeta aaj ka din?"
                ]
                return random.choice(options)
            elif lang == "hi":
                return f"{vocal_opener}नमस्ते {name}! 😊 आप कैसे हैं? मैं आपकी क्या मदद कर सकता हूँ?"
            else:
                options = [
                    f"{vocal_opener}Hello {name}! 😊 How are you doing today? How can I help you?",
                    f"{vocal_opener}Hi there, {name}! Good to see you. How's everything going with you today?",
                    f"{vocal_opener}Hey {name}! I'm right here. What's on your mind today?",
                    f"{vocal_opener}Hello {name}! Hope you're having a good day so far. What can I help you with?"
                ]
                return random.choice(options)
        elif is_hello:
            if lang == "hinglish":
                options = [
                    f"{vocal_opener}Hi there, {name}! Hello! Kaise hain aap? Aaj main aapki kya help kar sakta hoon?",
                    f"{vocal_opener}Hello {name}! Welcome. Bataiye, aaj kaisa feel kar rahe hain?"
                ]
                return random.choice(options)
            elif lang == "hi":
                return f"{vocal_opener}नमस्ते {name}! हैलो! आप कैसे हैं? आज मैं आपकी क्या सहायता कर सकता हूँ?"
            else:
                options = [
                    f"{vocal_opener}Hi there, {name}! Hello! How are you doing today? What's on your mind?",
                    f"{vocal_opener}Hello {name}! It's nice to chat with you. How can I support you today?"
                ]
                return random.choice(options)
        else:
            if lang == "hinglish":
                return f"{vocal_opener}Hello {name}! Kaise ho? Main Sanjeevani hoon — batao, aaj main aapki kya help kar sakta hoon? 😊"
            elif lang == "hi":
                return f"{vocal_opener}नमस्ते {name}! आप कैसे हैं? मैं संजीवनी हूँ — बताइए, आज मैं आपकी क्या मदद कर सकता हूँ? 😊"
            elif lang == "bn":
                return f"{vocal_opener}নমস্কার {name}! আপনি কেমন আছেন? আমি সঞ্জীবনী — বলুন, আজ আপনাকে কীভাবে সাহায্য করতে পারি? 😊"
            elif lang == "mr":
                return f"{vocal_opener}नमस्कार {name}! आपण कसे आहात? मी संजीवनी — सांगा, आज मी आपल्याला कशी मदत करू शकेन? 😊"
            elif lang == "te":
                return f"{vocal_opener}నమస్కారం {name}! మీరు ఎలా ఉన్నారు? నేను సంజీవని — చెప్పండి, ఈరోజు నేను మీకు ఎలా సహాయపడగలను? 😊"
            elif lang == "ta":
                return f"{vocal_opener}வணக்கம் {name}! நீங்கள் எப்படி இருக்கிறீர்கள்? நான் சஞ்சீவனி — சொல்லுங்கள், இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? 😊"
            elif lang == "gu":
                return f"{vocal_opener}નમસ્તે {name}! તમે કેમ છો? હું સંજીવની છું — કહો, આજે હું તમને કેવી રીતે મદદ કરી શકું? 😊"
            elif lang == "kn":
                return f"{vocal_opener}ನಮಸ್ಕಾರ {name}! ನೀವು ಹೇಗಿದ್ದೀರಿ? ನಾನು ಸಂಜೀವನಿ — ಹೇಳಿ, ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? 😊"
            elif lang == "ml":
                return f"{vocal_opener}നമസ്കാരം {name}! സുഖമാണോ? ഞാൻ സഞ്ജീവനി — പറയൂ, ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം? 😊"
            elif lang == "pa":
                return f"{vocal_opener}ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {name}! ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ? ਮੈਂ ਸੰਜੀਵਨੀ ਹਾਂ — ਦੱਸੋ, ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ? 😊"
            elif lang == "or":
                return f"{vocal_opener}ନମସ୍କାର {name}! ଆପଣ କିପରି ଅଛନ୍ତି? ମୁଁ ସଞ୍ଜୀବନୀ — କୁହନ୍ତୁ, ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି? 😊"
            elif lang == "ur":
                return f"{vocal_opener}سلام {name}! آپ کیسے ہیں؟ میں سنجیوانی ہوں — بتائیے، آج میں آپ کی کیا مدد کر سکتا ہوں؟ 😊"
            else:
                return f"{vocal_opener}Hello {name}! How are you doing today? I'm Sanjeevani. How can I support you today? 😊"

    # ─── CONVERSATION REQUEST (I want to talk) ─────────────────
    if intent == "conversation_request":
        if lang == "hinglish":
            return f"{vocal_opener}Bohot khushi se, {name}! Main yahin hoon bina kisi judgment ke aapki baat sunne ke liye. Chahe mann ki koi tension ho, din kaisa gaya, ya koi aisi baat jo kisi aur se nahi keh sakte — aap khulkar share kar sakte ho. Batao, kahan se shuru karna chahenge?"
        elif lang == "hi":
            return f"{vocal_opener}मैं पूरी तरह आपके साथ हूँ, {name}। आप जो भी साझा करना चाहें, आराम से कहें — यहाँ कोई जल्दबाजी नहीं है। आज आपके मन में क्या चल रहा है?"
        elif lang == "bn":
            return f"{vocal_opener}আমি সম্পূর্ণ আপনার পাশে আছি, {name}। আপনার মনের কথা নির্দ্বিধায় বলুন — আমি মনোযোগ দিয়ে শুনছি। আজ আপনার মন কেমন আছে?"
        elif lang == "mr":
            return f"{vocal_opener}मी पूर्णपणे आपल्यासोबत आहे, {name}। आपल्या मनात जे काही आहे ते अगदी मनमोकळेपणाने सांगा — मी ऐकण्यासाठी तयार आहे."
        elif lang == "te":
            return f"{vocal_opener}నేను మీతోనే ఉన్నాను, {name}। మీ మనసులో ఉన్న భావాలను నిస్సంకోచంగా నాతో పంచుకోండి — నేను వింటున్నాను."
        elif lang == "ta":
            return f"{vocal_opener}நான் உங்களுடன் இருக்கிறேன், {name}। உங்கள் மனதில் உள்ளதை நிம்மதியாகப் பகிர்ந்து கொள்ளுங்கள் — நான் கேட்கிறேன்."
        elif lang == "gu":
            return f"{vocal_opener}હું તમારી સાથે જ છું, {name}। તમારા મનમાં જે કંઈ પણ હોય તે નિઃસંકોચ કહો — હું સાંભળી રહ્યો છું."
        elif lang == "kn":
            return f"{vocal_opener}ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಇದ್ದೇನೆ, {name}। ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿರುವುದನ್ನು ಮುಕ್ತವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ — ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ."
        elif lang == "ml":
            return f"{vocal_opener}ഞാൻ പൂർണ്ണമായും നിങ്ങളുടെ കൂടെയുണ്ട്, {name}। നിങ്ങളുടെ മനസ്സിലുള്ളത് തുറന്നു പറയൂ — ഞാൻ കേൾക്കുന്നുണ്ട്."
        elif lang == "pa":
            return f"{vocal_opener}ਮੈਂ ਪੂਰੀ ਤਰ੍ਹਾਂ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ, {name}। ਆਪਣੇ ਦਿਲ ਦੀ ਗੱਲ ਖੁੱਲ੍ਹ ਕੇ ਦੱਸੋ — ਮੈਂ ਸੁਣਨ ਲਈ ਤਿਆਰ ਹਾਂ।"
        elif lang == "or":
            return f"{vocal_opener}ମୁଁ ସମ୍ପୂର୍ଣ୍ଣ ଆପଣଙ୍କ ସହିତ ଅଛି, {name}। ଆପଣଙ୍କ ମନର କଥା ବିନା ଦ୍ୱିଧାରେ କୁହନ୍ତୁ — ମୁଁ ଶୁଣୁଛି।"
        elif lang == "ur":
            return f"{vocal_opener}میں بالکل آپ کے ساتھ ہوں، {name}۔ آپ جو بھی کہنا چاہیں، اطمینان سے بتائیں — میں توجہ سے سن رہا ہوں۔"
        else:
            options = [
                f"{vocal_opener}I'm right here with you, {name}, and I would love to talk. Whether you want to talk about something heavy that's been weighing on you, reflect on your day, or just chat casually—there's no rush or pressure. What's on your mind right now?",
                f"{vocal_opener}Of course, {name}! You have my full, undivided attention. Take all the time you need—what would you like to talk about today?"
            ]
            return random.choice(options)

    # ─── DEPRESSION / DEEP SADNESS ─────────────────────────────
    if intent == "depression":
        if lang == "hinglish":
            return f"""{vocal_opener}Mujhe sunkar sach mein bohot dukh hua, {name}. Depression aur mann ka itna bhaari hona andar se bohot thaka deta hai — aisa lagta hai jaise kisi cheez mein dil nahi lag raha aur saari energy khatam ho gayi ho.

Aapka yeh express karna bohot badi baat hai. Aap bilkul akele nahi hain, aur aapko yeh sab akele jhelne ki zaroorat nahi hai.

Kya yeh feeling pichle kuch dino ya hafton se chal rahi hai, ya achanak koi aisi baat hui jisne dil tod diya? Agar aap theek samjhein, toh thoda aur bataiye — main dhyan se sun raha hoon. 💛"""
        elif lang == "hi":
            return f"""{vocal_opener}मुझे यह जानकर बहुत दुख हुआ, {name}। अवसाद और गहरे खालीपन की यह भावना बहुत थका देने वाली होती है। ऐसा लगता है जैसे हर काम बहुत मुश्किल हो गया हो।

कृपया याद रखें कि आपकी भावनाएँ पूरी तरह वास्तविक हैं, और आपको इस संघर्ष में अकेला नहीं रहना है। 

क्या यह स्थिति कुछ समय से बनी हुई है, या हाल ही में किसी बात ने आपको बहुत परेशान किया है? आप बिना किसी संकोच के मुझसे साझा कर सकते हैं। 💛"""
        else:
            options = [
                f"""{vocal_opener}I'm really sorry you're carrying feelings of depression right now, {name}. 💛 Depression can be so physically and emotionally exhausting—it feels like a heavy fog that drains your energy and makes even simple moments feel overwhelming.

Please know that you don't have to face this alone. Putting this into words is an important and courageous step.

Has this heavy feeling been building up for a while, or did something specific happen recently that brought it to the surface? Take your time—I'm right here with you.""",
                f"""{vocal_opener}Thank you for being open and sharing this with me, {name}. When depression hits, it's very easy to feel isolated, like nobody truly understands the weight you're holding.

I want you to know that you are heard, and your feelings are completely valid. You don't have to pretend everything is okay here.

If you feel up to talking, what has been feeling like the heaviest part of your day lately? 💛"""
            ]
            return random.choice(options)

    # ─── FAILURE / EXAM SETBACKS ──────────────────────────────
    if intent == "failure":
        if lang == "hinglish":
            return f"""{vocal_opener}Kisi exam ya goal mein setback milne par sach mein bohot bura aur helpless feel hota hai, {name}. Aisa lagta hai jaise mehnat bekaar gayi ya sab khatam ho gaya.

Lekin yeh baat hamesha yaad rakhna: **Ek exam, ek result, ya ek galti aapki worth aur aapke pure future ko define nahi karti.** Zindagi mein har safal insaan kisi na kisi mod par fail hota hai.

Agar aap chahein, toh batao kya hua tha? Saath milkar dekhte hain ki ab agla kadam kya lena hai. Main aapke saath hoon! 🌟"""
        else:
            return f"""{vocal_opener}Going through a failure or a painful setback really hurts, {name}, especially when you cared and put in genuine effort.

Please take this in: **One exam result, one mistake, or one difficult chapter does not define your intelligence, your worth, or your future.** It is simply a snapshot of a single moment, not the final destination.

If you feel comfortable, tell me what happened. We can unpack it together and think through what constructive step to take next. You've got this. 🌟"""

    # ─── LONELINESS / ISOLATION ───────────────────────────────
    if intent == "loneliness":
        if lang == "hinglish":
            return f"""{vocal_opener}Akelapan sach mein dil ko bohot bhaari aur khokhla bana deta hai, {name}. Chahe aas-paas log bhi hon, par jab koi samajhne wala na lage toh bohot takleef hoti hai.

Main aapko batana chahta hoon ki main 24/7 yahan hoon aapki har baat bina kisi judgment ke sunne ke liye. Aapki baatein mere liye important hain.

Aaj aisa kya hua jisne sabse zyada akela feel karwaya? Agar bolna chahein toh zaroor bataiye. 💛"""
        else:
            return f"""{vocal_opener}Feeling lonely can be one of the most painful, quiet burdens to carry, {name}. Even when surrounded by others, feeling disconnected or unseen hurts deeply.

I want you to know that you are not invisible here. Your voice, your thoughts, and your well-being genuinely matter.

What has been making you feel most disconnected or isolated lately? I'm listening closely whenever you're ready to share. 💛"""

    # ─── FAREWELL ─────────────────────────────────────────────
    if intent == "farewell":
        is_sleeping = any(k in text_lower for k in ["so raha", "sone ja", "good night", "goodnight", "shubh ratri"])
        if is_sleeping:
            if lang == "hinglish":
                return f"{vocal_opener}Good night bhai! 🌙 Phone ko thoda side rakhna, saari chintaon ko dimaag se nikaal ke aaraam se sona. Kal ek naya din hoga. Sweet dreams, take care! 😴✨"
            elif lang == "hi":
                return f"{vocal_opener}शुभ रात्रि, {name}! 🌙 आराम से सोइए और सभी चिंताओं को एक तरफ रख दीजिए। कल एक नया दिन होगा। अपना ख्याल रखें! 😴✨"
            else:
                return f"{vocal_opener}Good night, {name}! 🌙 Put away your screens, let go of today's worries, and get some restful, healing sleep. Take care! 😴✨"
        else:
            if lang == "hinglish":
                return f"{vocal_opener}Acha {name}, apna khayal rakhna! 💛 Jab bhi mann kare baat karne ka, main yahan hoon — din ho ya raat. Aap akele nahi ho. Take care bhai! 🤗"
            elif lang == "hi":
                return f"{vocal_opener}अच्छा {name}, अपना ख्याल रखिए! 💛 जब भी मन करे बात करने का, मैं यहाँ हूँ। आप अकेले नहीं हैं। ध्यान रखें! 🤗"
            else:
                return f"{vocal_opener}Take care, {name}! 💛 Remember, I'm here whenever you need me — day or night. You're not alone in this. Wishing you a peaceful time ahead. 🤗"

    # ─── FRIENDSHIP WITH BOT ──────────────────────────────────
    if intent == "friendship":
        if lang == "hinglish":
            return f"{vocal_opener}Bhai bilkul! 🤝 Main aapka aisa dost hoon jo 24/7 bina kisi judgement ke aapki har baat sunega — chahe dukh ho, khushi ho, ya dimaag ki koi tension. Ab se hum pakke dost hain! Batao dost, aaj kaisa feel kar rahe ho?"
        else:
            return f"{vocal_opener}I would love that, {name}! 🤝 Consider me a dedicated friend who is always in your corner — ready to listen without judgment, celebrate your wins, and support you through hard days. What is on your mind today, my friend?"

    # ─── APPRECIATION ─────────────────────────────────────────
    if intent == "appreciation":
        if lang == "hinglish":
            return f"{vocal_opener}Bohot khushi hui yeh sunkar yaar! ❤️ Bas yahi mera maqsad hai — aapka mann halka ho jaye aur cheezein thodi aasan lagein. Jab bhi kabhi mann bhaari ho ya baat karni ho, bas ek message bhej dena, main yahin miloonga. Apna khayal rakhna bhai! 😊"
        else:
            return f"{vocal_opener}Thank you so much, {name}! 🙏 It truly warms my heart to hear that. My only goal is to support you and make things a bit easier. I'm always right here whenever you need a listening ear. Take care! 😊"

    # ─── IDENTITY (Who are you?) ──────────────────────────────
    if intent == "identity":
        return f"{vocal_opener}" + _answer_question("who are you", lang=lang, name=name, counsellor_name=counsellor_name)

    # ─── BREAKUP / HEARTBREAK ─────────────────────────────────
    if intent == "breakup":
        if lang == "hinglish":
            return f"""{vocal_opener}Yaar, breakup ka dard sach mein bohot gehra aur takleefdeh hota hai... 💔 Aisa lagta hai jaise andar kuch toot gaya ho. Lekin yeh baat yaad rakhna:

1. **Rona aaye toh ro lo**: Feelings ko dabana nahi hai. Aansu nikalne se bohot relief milta hai.
2. **Khud ko blame mat karo**: Har rishte ka ant aapki kami ya galti ki wajah se nahi hota.
3. **Purani yaadein mat dhoondho**: Unke social media dekhna ya purane texts baar-baar padhna band kar do, isse ghav hara rehta hai.
4. **Time heals**: Ek din mein sab theek nahi hoga, par dheere dheere dard kam zaroor hoga.

Main yahin hoon tumhare saath bhai. Dil mein jo bhi chal raha hai, bol daalo — main sun raha hoon."""
        else:
            return f"""{vocal_opener}Heartbreak and breakups are among the deepest emotional pains we can experience, {name}. 💔 It feels like the ground has been pulled from beneath you.

Please remember:
1. **Allow yourself to grieve**: Crying and feeling hurt is not weakness; it is how your brain processes loss.
2. **Do not blame yourself**: Relationships end due to incompatibility, timing, or circumstance — not because you are unlovable.
3. **Establish a clean boundary**: Repeatedly checking their profiles keeps the emotional wound open.
4. **Take it day by day**: Healing is not linear, but with time, the intensity of this pain will subside.

I'm right here with you. What part of this feels heaviest right now?"""

    # ─── ANGER & FRUSTRATION ──────────────────────────────────
    if intent == "anger":
        if lang == "hinglish":
            return f"""{vocal_opener}Arre yaar, lagta hai dimaag bohot zyada kharab ho gaya hai... Main samajh sakta hoon, jab cheezein control se bahar hoti hain toh bohot gussa aur irritation aati hai.

Ek kaam karo bhai:
1. 💧 Pehle ek bada glass thanda paani piyo.
2. 🫁 5 deep breaths lo — naak se andar, munh se dheere bahar.
3. 🗣️ Jo bhi baat hui hai, aaram se yahan batao. Gusse ko andar mat dabao, yahan dil halka kar lo. Main sun raha hoon."""
        else:
            return f"""{vocal_opener}I hear how frustrated and angry you are right now, {name}. When situations push us past our limit, anger is our natural defense kicking in.

Before saying or doing anything you might regret:
1. 💧 Drink a glass of cold water to lower the adrenaline spike.
2. 🫁 Take 3 physiological sighs: two quick inhales through your nose, one long slow exhale through your mouth.
3. 🗣️ Tell me what triggered this. Let it all out here in a safe space."""

    # ─── QUESTIONS (DIRECT ANSWER ENGINE) ──────────────────────
    if intent == "question":
        return f"{vocal_opener}" + _answer_question(
            user_text=user_text,
            lang=lang,
            name=name,
            counsellor_name=counsellor_name
        )

    # ─── FEELINGS / EMOTIONAL STATE ───────────────────────────
    if intent == "feeling":
        is_anxiety = any(w in text_lower for w in ["anxious", "anxiety", "scared", "fear", "chinta", "ghabrahat", "bechaini", "dar"])
        is_sadness = any(w in text_lower for w in ["sad", "crying", "tears", "heart hurts", "udaas", "dukhi", "ro raha", "ro rahi", "rona", "dard", "pain", "hurt"])
        is_stress = any(w in text_lower for w in ["stress", "stressed", "exhausted", "burnout", "overwhelmed", "pressure", "bojh", "tension", "tanav"])
        is_positive = sentiment > 0.15 or any(w in text_lower for w in ["happy", "good", "great", "better", "relieved", "fine", "khush", "badhiya", "mast", "theek", "shandar"])

        if is_positive:
            if lang == "hinglish":
                options = [
                    f"{vocal_opener}Sun kar sach mein bohot acha laga, {name}! 😊 Aapki positive energy dekhkar dil khush ho gaya. Bataiye, aaj aisa kya acha hua aapke saath?",
                    f"{vocal_opener}Wah, yeh sunkar mazaa aa gaya {name}! 😊 Acha feel karna bohot zaroori hai. Aaj din mein kya khaas raha?"
                ]
                return random.choice(options)
            elif lang == "hi":
                return f"{vocal_opener}यह सुनकर बहुत अच्छा लगा, {name}! 😊 आपका सकारात्मक महसूस करना बहुत अच्छी बात है। आज क्या विशेष हुआ?"
            else:
                options = [
                    f"{vocal_opener}That is so wonderful to hear, {name}! 😊 It genuinely brings a smile to my face. What went well for you today?",
                    f"{vocal_opener}I'm so glad you're feeling good today, {name}! 😊 It's always great to celebrate the lighter, positive days. What made today a good day?"
                ]
                return random.choice(options)
        elif is_anxiety:
            if lang == "hinglish":
                return f"""{vocal_opener}Anxiety aur ghabrahat jab aati hai toh dimaag mein hazaron vichar ek saath daudne lagte hain, {name}. Aisa lagta hai jaise kuch galat hone wala ho.

Par yeh baat yaad rakhna — aapka dimaag sirf aapko protect karne ki koshish kar raha hai, har dar sach nahi hota. 

Abhi is pal aap bilkul safe hain. Sabse zyada kis baat ki chinta ya darr lag raha hai? Ek-ek karke batao, saath mein sochte hain. 💛"""
            else:
                return f"""{vocal_opener}Anxiety has a way of making everything feel urgent and overwhelming, {name}. When your mind starts spiraling into 'what-ifs', it's hard to catch your breath.

Please remember that a thought is just a thought—it isn't a guaranteed fact, and you are stronger than this wave of anxiety.

What feels like the biggest worry on your mind right now? Let's take it one small step at a time. 💛"""
        elif is_stress:
            if lang == "hinglish":
                return f"""{vocal_opener}Lagta hai aap par bohot saari cheezon ka bojh aur pressure ek saath aa gaya hai, {name}. Jab stress badhta hai toh body aur mind dono thak jaate hain.

Saari problems ek hi din mein solve karne ki zaroorat nahi hai bhai. 

Abhi sabse zyada tension kis cheez ki hai — kaam ki, parivar ki, ya kisi aur baat ki? Yahan thoda dimaag halka kar lo. 💛"""
            else:
                return f"""{vocal_opener}It really sounds like you're carrying an overwhelming amount of pressure on your shoulders right now, {name}. When chronic stress piles up, even simple tasks can feel exhausting.

You don't have to carry everything all at once. 

What is taking the biggest toll on your energy right now? Let's look at it together. 💛"""
        elif is_sadness:
            if lang == "hinglish":
                return f"""{vocal_opener}Mujhe bohot bura lag raha hai ki aap is takleef se guzar rahe ho, {name}. Udaas hona aur mann bhaari hona bilkul natural hai — feelings ko dabane ki zaroorat nahi hai.

Main yahan hoon bina judge kiye aapki baat sunne ke liye. Agar rona aaye toh ro lo, aansu dil ka bojh halka karte hain.

Dil mein jo bhi baat chub rahi hai, khulkar bolo. Main sun raha hoon. 💛"""
            else:
                return f"""{vocal_opener}I'm really sorry you're hurting right now, {name}. 💛 It is completely okay to feel sad, and you don't have to put on a brave face here. 

Crying and feeling down is your mind's natural way of processing pain. Take all the space you need.

Would you like to share a little more about what's causing this sadness? I'm right here with you. 💛"""
        else:
            if lang == "hinglish":
                return f"""{vocal_opener}Main samajh sakta hoon {name}. 💛 Jo aap mehsoos kar rahe ho woh bilkul valid hai. Aise waqt mein mann bohot low ho jata hai aur sab kuch mushkil lagta hai.

Aap akele nahi hain. Dil mein jo bhi chal raha hai, khulkar share karo — main poore dhyan se sun raha hoon."""
            else:
                return f"""{vocal_opener}I hear you, {name}, and whatever you're experiencing right now is completely valid. 💛 You don't have to carry it all by yourself.

Take all the time you need. If you'd like to share what's on your heart or mind, I'm listening closely."""

    # ─── SLEEP ISSUES ─────────────────────────────────────────
    if intent == "sleep":
        return f"{vocal_opener}" + _answer_question("sleep better", lang=lang, name=name, counsellor_name=counsellor_name)

    # ─── PANIC / ANXIETY ──────────────────────────────────────
    if intent == "panic":
        return f"{vocal_opener}" + _answer_question("panic attack", lang=lang, name=name, counsellor_name=counsellor_name)

    # ─── COURT / LEGAL / THREATS ──────────────────────────────
    if intent == "legal":
        return f"{vocal_opener}" + _answer_question("section 15a witness protection", lang=lang, name=name, counsellor_name=counsellor_name)

    # ─── MOTIVATION / STRENGTH ────────────────────────────────
    if intent == "motivation":
        if lang == "hinglish":
            return f"""{vocal_opener}Aapne bilkul sahi jagah baat ki, {name}! 💪

Yeh baat yaad rakhna — aap yahan ho, lad rahe ho, apne haq ke liye khade ho. Bohot log itna nahi kar paate. Aapki himmat aapki sabse badi taaqat hai.

Ek powerful practice hai jo aapko karni chahiye — **"3 Things I Survived"**:
1. Subah uthke 3 cheezein yaad karo jo aapne face ki hain aur survive kiya.
2. Phir 1 chhota goal set karo jo aaj achieve karna hai.
3. Chhoti jeetein badi jeetein banati hain.

Aap pehle se bohot mazboot hain. Main aapke saath hoon bhai! 🌟"""
        else:
            return f"""{vocal_opener}You've got this, {name}! 💪

Remember this — you are here, you are standing up for yourself, and you are facing adversity with tremendous resilience. Your courage is your greatest asset.

Small wins build into big victories. What is one small thing you want to accomplish today? Let's take it step by step! 🌟"""

    # ─── RELATIONSHIPS / FAMILY ───────────────────────────────
    if intent == "relationship":
        if lang == "hinglish":
            return f"""{vocal_opener}Rishton ki baatein aksar sabse zyada sensitive aur emotional hoti hain, {name}. 💛 Parivar ya doston ke saath misunderstandings dil ko bohot dard deti hain.

Sabse zaroori cheez hoti hai — **Clear Boundaries** aur **Open Communication**. Jab hum shanti se apni baat rakhte hain bina blame kiye, toh log behtar samajhte hain.

Kya specific situation hai parivar ya rishte mein? Mujhe bataiye, saath mein sochte hain."""
        else:
            return f"""{vocal_opener}Relationships can bring both our greatest support and our deepest distress, {name}. 💛 When tensions arise with family or loved ones, it can feel draining.

The foundation of navigating relationship challenges is setting healthy boundaries while communicating your needs with calm clarity.

Would you like to share what is specifically happening? I'm here to listen."""

    # ─── FINANCIAL / MONEY ────────────────────────────────────
    if intent == "financial":
        return f"{vocal_opener}" + _answer_question("compensation relief", lang=lang, name=name, counsellor_name=counsellor_name)

    # ─── HEALTH ───────────────────────────────────────────────
    if intent == "health":
        if lang == "hinglish":
            return f"""{vocal_opener}Sehat sabse pehle aati hai, {name}. 💛 Stress aur anxiety sidhe body par asar karte hain — sar dard, pait kharab, ya body pain sab connected hote hain.

Agar koi physical takleef zyada ho rahi hai, toh please doctor ya clinic se consult zaroor karein. Saath hi apne clinician ({counsellor_name}) ko bhi inform karein taaki medical aur mental dono care mil sake.

Kya specific physical problem ho rahi hai aapko?"""
        else:
            return f"""{vocal_opener}Your health is the highest priority, {name}. 💛 Chronic stress directly affects physical wellness — muscle tension, headaches, and fatigue are common.

If you are experiencing severe physical symptoms, please reach out to a local healthcare facility. I can also notify {counsellor_name} to ensure your care plan addresses both your physical and psychological well-being."""

    # ─── GENERAL / CATCH-ALL ──────────────────────────────────
    if lang == "hinglish":
        return f"{vocal_opener}Main samajh raha hoon, {name}. 💛 Aap jo bhi kehna chahein khulkar kahein — koi rush nahi hai. Main aapki baat dhyan se sun raha hoon. Kuch aur details share karna chahenge?"
    elif lang == "hi":
        return f"{vocal_opener}मैं सुन रहा हूँ, {name}। 💛 आप जो भी साझा करना चाहें, बिना किसी झिझक के कह सकते हैं। मैं आपकी पूरी बात ध्यान से सुन रहा हूँ।"
    elif lang == "bn":
        return f"{vocal_opener}আমি আপনার কথা শুনছি, {name}। 💛 আপনার মনের সব কথা নির্দ্বিধায় বলুন — আমি আপনার পাশেই আছি।"
    elif lang == "mr":
        return f"{vocal_opener}मी आपले म्हणणे लक्षपूर्वक ऐकत आहे, {name}। 💛 आपल्या मनात जे काही आहे ते मनमोकळेपणाने सांगा — मी आपल्यासोबत आहे."
    elif lang == "te":
        return f"{vocal_opener}నేను మీ మాటలు శ్రద్ధగా వింటున్నాను, {name}। 💛 మీ మనసులో ఉన్న భావాలను నిస్సంకోచంగా పంచుకోండి — నేను మీతోనే ఉన్నాను."
    elif lang == "ta":
        return f"{vocal_opener}நான் உங்கள் பேச்சைக் கவனமாகக் கேட்கிறேன், {name}। 💛 உங்கள் மனதில் உள்ளதை தயக்கமின்றிப் பகிர்ந்து கொள்ளுங்கள் — நான் உங்களுடன் இருக்கிறேன்."
    elif lang == "gu":
        return f"{vocal_opener}હું તમારી વાત ધ્યાનથી સાંભળી રહ્યો છું, {name}। 💛 તમારા મનમાં જે કંઈ પણ હોય તે નિઃસંકોચ કહો — હું તમારી સાથે છું."
    elif lang == "kn":
        return f"{vocal_opener}ನಾನು ನಿಮ್ಮ ಮಾತನ್ನು ಗಮನವಿಟ್ಟು ಕೇಳುತ್ತಿದ್ದೇನೆ, {name}। 💛 ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿರುವ ಭಾವನೆಗಳನ್ನು ಮುಕ್ತವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ — ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಇದ್ದೇನೆ."
    elif lang == "ml":
        return f"{vocal_opener}ഞാൻ നിങ്ങളുടെ വാക്കുകൾ ശ്രദ്ധയോടെ കേൾക്കുന്നു, {name}। 💛 നിങ്ങളുടെ മനസ്സിലുള്ളത് യാതൊരു മടിയും കൂടാതെ പറയൂ — ഞാൻ നിങ്ങളുടെ കൂടെയുണ്ട്."
    elif lang == "pa":
        return f"{vocal_opener}ਮੈਂ ਤੁਹਾਡੀ ਗੱਲ ਧਿਆਨ ਨਾਲ ਸੁਣ ਰਿਹਾ ਹਾਂ, {name}। 💛 ਆਪਣੇ ਮਨ ਦੀ ਹਰ ਗੱਲ ਖੁੱਲ੍ਹ ਕੇ ਕਹੋ — ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ।"
    elif lang == "or":
        return f"{vocal_opener}ମୁଁ ଆପଣଙ୍କ କଥା ଧ୍ୟାନ ସହକାରେ ଶୁଣୁଛି, {name}। 💛 ଆପଣଙ୍କ ମନର କଥା ବିନା କୌଣସି ଦ୍ୱିଧାରେ କୁହନ୍ତୁ — ମୁଁ ଆପଣଙ୍କ ସାଥିରେ ଅଛି।"
    elif lang == "ur":
        return f"{vocal_opener}میں آپ کی بات پوری توجہ سے سن رہا ہوں، {name}۔ 💛 آپ کے دل میں جو بھی ہو بلا جھجھک کہیں — میں آپ کے ساتھ ہوں۔"
    else:
        return f"{vocal_opener}I'm listening closely, {name}. 💛 Please feel free to take your time and share whatever is on your mind. I'm right here with you."


# ─── Main Entry Point ─────────────────────────────────────────────────────────
def generate_ai_response(
    user_text: str,
    patient_name: str = "there",
    counsellor_name: str = "Dr. Sarah Jenkins",
    language: str = "en",
    vocal_emotion: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    case_context: Optional[Dict[str, Any]] = None
) -> dict:
    """Evaluates user message and generates trauma-informed, conversational response."""

    # Run NLP pipeline for sentiment, emotions, risk
    pipeline_result = run_pipeline(
        user_text,
        checkin_data={"mood_score": 5, "sleep_hours": 7, "appetite": 3, "social_interaction": 3}
    )

    risk_score = round(pipeline_result["risk"]["score"], 1)
    sentiment = pipeline_result["sentiment"]["compound"]
    emotions = pipeline_result["emotions"]
    crisis_override = pipeline_result["risk"].get("crisis_override", False)

    text_lower = user_text.lower()
    has_crisis_kw = any(kw in text_lower for kw in CRISIS_KEYWORDS)
    is_crisis = crisis_override or has_crisis_kw

    # Detect language and intent
    lang = detect_language(user_text, language)
    intent = _detect_intent(user_text)

    # Voice emotion analysis — ONLY use if explicitly provided from voice modal
    vocal_analysis = vocal_emotion  # Do NOT synthesize fake acoustic prosody for text chat!

    grounding_exercise = None
    suggested_actions = []

    # ═══ CRISIS PATH ═══
    if is_crisis:
        if lang in ["hi", "hinglish"]:
            ai_reply = f"""Main samajh sakta hoon ki aap is waqt bohot zyada dard mein hain, {patient_name}. 💛 Aapki zindagi anmol hai aur aapko is mushkil waqt mein akele nahi rehna hai.

Aapki safety sabse pehle hai. Please abhi turant in helplines pe call karein — yeh 24/7 free hain:

📞 **Tele-MANAS**: **14416** ya **1800-891-4416** (Govt of India, sabhi bhashao mein)
📞 **KIRAN Helpline**: **1800-599-0019** (24/7 free)
📞 **NHAA Helpline**: **14566** (24/7 toll-free)
📞 **Vandrevala Foundation**: **9999 666 555** (call/WhatsApp)
🚨 **Emergency**: **112**

Maine {counsellor_name} aur District Nodal Officer ko bhi alert bhej diya hai. Aap akele nahi hain. 💛"""
        else:
            ai_reply = f"""I hear how much unbearable pain you're in right now, {patient_name}. 💛 Your life has immense value, and you don't have to carry this alone.

Your safety is the absolute highest priority. Please reach out to these 24/7 free helplines right now:

📞 **Tele-MANAS**: **14416** or **1800-891-4416** (Govt of India, all languages)
📞 **KIRAN Helpline**: **1800-599-0019** (24/7 toll-free)
📞 **NHAA Helpline**: **14566** (24/7 toll-free)
📞 **Vandrevala Foundation**: **9999 666 555** (call/WhatsApp)
🚨 **Emergency**: **112**

I've also flagged this for your clinician ({counsellor_name}) and the District Nodal Officer. You are not alone. 💛"""

        return {
            "reply": ai_reply,
            "distress_score": 95.0,
            "crisis_flagged": True,
            "grounding_exercise": "Emergency Crisis Safety Protocol",
            "suggested_actions": ["Call 14416 Tele-MANAS", "Call 14566 NHAA", "Call KIRAN 1800-599-0019", f"Message {counsellor_name}"],
            "sentiment": sentiment,
            "emotions": emotions,
            "vocal_emotion_detected": vocal_analysis if vocal_analysis else None
        }

    # ═══ TRY GEMINI API ═══
    llm_reply = generate_response(
        user_text=user_text,
        patient_name=patient_name,
        counsellor_name=counsellor_name,
        language=lang,
        conversation_history=conversation_history or [],
        vocal_emotion=vocal_analysis,
        case_context=case_context
    )

    if llm_reply:
        ai_reply = llm_reply
    else:
        # ═══ COMPOSE RESPONSE VIA PROMPT TEMPLATES & AUTONOMOUS ENGINE ═══
        ai_reply = compose_response(
            intent=intent,
            user_text=user_text,
            lang=lang,
            name=patient_name,
            counsellor_name=counsellor_name,
            vocal_opener=vocal_analysis.get("adaptive_opening", "") + "\n\n" if (vocal_analysis and vocal_analysis.get("adaptive_opening")) else "",
            sentiment=sentiment,
            emotions=emotions,
            vocal_emotion=vocal_analysis,
            conversation_history=conversation_history,
            case_context=case_context
        )

    # Determine grounding exercise and suggested actions based on intent
    text_check = user_text.lower()
    if intent in ["panic"]:
        grounding_exercise = "4-7-8 Breathing"
        suggested_actions = ["Start 4-7-8 Breathing", "5-4-3-2-1 Sensory Grounding", f"Message {counsellor_name}"]
    elif any(k in text_check for k in ["breathing exercise", "guide me to breathe", "help me breathe", "calm me down", "grounding exercise", "breathe with me"]):
        grounding_exercise = "4-7-8 Breathing"
        suggested_actions = ["Start 4-7-8 Breathing", "5-4-3-2-1 Sensory Grounding", f"Message {counsellor_name}"]
    elif intent == "sleep":
        grounding_exercise = "Body Scan Relaxation"
        suggested_actions = ["Try Body Scan", "Worry Journal Technique", f"Message {counsellor_name}"]
    elif intent == "legal":
        grounding_exercise = None
        suggested_actions = ["Check Witness Protection Rights", "Legal Briefing Notes", f"Message {counsellor_name}", "14566 NHAA Helpline"]
    elif intent in ["depression", "feeling", "loneliness", "failure"]:
        grounding_exercise = None
        suggested_actions = ["Tell Me More", "Talk Through It", "Share My Thoughts", f"Message {counsellor_name}"]
    else:
        grounding_exercise = None
        suggested_actions = ["Ask a Question", "Tell Me More", "Talk About My Day", f"Message {counsellor_name}"]

    return {
        "reply": ai_reply,
        "distress_score": risk_score,
        "crisis_flagged": False,
        "grounding_exercise": grounding_exercise,
        "suggested_actions": suggested_actions,
        "sentiment": sentiment,
        "emotions": emotions,
        "vocal_emotion_detected": vocal_analysis.get("primary_emotion") if vocal_analysis else None
    }
