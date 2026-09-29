import pytest
from ai.chat_engine import (
    generate_ai_response,
    compose_response,
    PROMPT_TEMPLATES,
    _detect_intent,
    _answer_question
)

def test_prompt_templates_defined():
    assert 'greeting' in PROMPT_TEMPLATES
    assert 'conversation_request' in PROMPT_TEMPLATES
    assert 'friendship' in PROMPT_TEMPLATES
    assert 'appreciation' in PROMPT_TEMPLATES
    assert 'general' in PROMPT_TEMPLATES

def test_greeting_intent():
    res = generate_ai_response('hi', patient_name='Aarav', language='en')
    assert 'reply' in res
    assert 'Aarav' in res['reply']
    assert any(w in res['reply'].lower() for w in ['hello', 'hi', 'how are you'])

def test_greeting_hinglish():
    res = generate_ai_response('hi', patient_name='Pooja', language='hinglish')
    assert 'Pooja' in res['reply']
    assert 'kaise ho' in res['reply'].lower() or 'sanjeevani' in res['reply'].lower()

def test_question_answering_anxiety():
    res = generate_ai_response('what is anxiety?', patient_name='Rahul', language='en')
    assert 'reply' in res
    assert 'Anxiety' in res['reply']
    assert 'Symptoms' in res['reply'] or 'response to' in res['reply'].lower()

def test_question_answering_hinglish():
    res = generate_ai_response('anxiety kya hoti hai?', patient_name='Rahul', language='hinglish')
    assert 'Anxiety' in res['reply']
    assert 'Rahul' in res['reply']
    assert '4-7-8' in res['reply'] or 'Symptoms' in res['reply']

def test_conversation_request():
    res = generate_ai_response('can we talk?', patient_name='Elena', language='en')
    assert 'Elena' in res['reply']
    assert any(phrase in res['reply'].lower() for phrase in ['listen', 'talk', 'mind', 'attention'])

def test_legal_witness_protection_question():
    res = generate_ai_response('what is section 15a?', patient_name='Ravi', language='en')
    assert '15A' in res['reply'] or 'Section' in res['reply']
    assert 'Protection' in res['reply']

def test_crisis_handling():
    res = generate_ai_response('I want to kill myself', patient_name='TestUser', language='en')
    assert res['crisis_flagged'] is True
    assert '14416' in res['reply']
    assert '14566' in res['reply']

def test_compose_response_custom_call():
    text = compose_response(
        intent='friendship',
        user_text='friend banoge?',
        lang='hinglish',
        name='Kabir'
    )
    assert 'Kabir' in text
    assert 'dost' in text.lower()
