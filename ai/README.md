# Sanjeevani AI Conversational Engine (i/)

This directory powers the Sanjeevani AI Companion for the NovaFlow mental health & NHAA legal EHR platform.

## Architecture

1. **Intent & Language Detection**:
   - detect_language(text, fallback_lang): Identifies Indic languages (Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu), Hinglish, or English.
   - _detect_intent(text): Semantically classifies user inputs into specific intents (greeting, conversation_request, question, riendship, ppreciation, depression, panic, sleep, legal, inancial, health, general, etc.).

2. **Modular Prompt Templates & Response Composition**:
   - PROMPT_TEMPLATES: A centralized dictionary storing conversational prompt templates organized by intent and language (hinglish, hi, en).
   - compose_response(intent, user_text, lang, name, counsellor_name, vocal_opener, **kwargs):
     - Directly routes question intents to _answer_question for comprehensive, direct answers (covering clinical concepts, coping exercises, legal procedures under PoA Section 15A, FIRs, bail, compensation, and helplines).
     - Resolves template-backed intents (greeting, conversation_request, riendship, ppreciation, general).
     - Delegates rich emotional and clinical scenarios to the autonomous conversational engine (_generate_autonomous_response).

3. **Multi-turn LLM & Fallback**:
   - Tries configured LLM providers (Gemini / OpenAI) via ackend.app.llm.generate_response.
   - If offline or unconfigured, seamlessly falls back to compose_response, guaranteeing prompt responsiveness without downtime or canned repetitive loops.

4. **Testing**:
   - Run unit tests with:
     `ash
     python -m unittest tests/test_chat_engine.py
     `
