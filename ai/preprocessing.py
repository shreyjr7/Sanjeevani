"""
Text Preprocessing Module
==========================
Cleans and normalizes input text for NLP pipeline processing.

Operations:
  1. PII anonymization (emails, phone numbers)
  2. Contraction expansion ("can't" → "can not")
  3. URL removal
  4. Preserve emotional punctuation and emojis
  5. Normalize whitespace

NOTE: Emotional markers (!, ?, emojis) are preserved as they carry
important sentiment/distress signals for downstream analysis.
"""

import re
from typing import Optional


# Common contractions for expansion
CONTRACTIONS = {
    "can't": "can not", "cant": "can not",
    "won't": "will not", "wont": "will not",
    "don't": "do not", "dont": "do not",
    "doesn't": "does not", "doesnt": "does not",
    "didn't": "did not", "didnt": "did not",
    "isn't": "is not", "isnt": "is not",
    "aren't": "are not", "arent": "are not",
    "wasn't": "was not", "wasnt": "was not",
    "weren't": "were not", "werent": "were not",
    "hasn't": "has not", "hasnt": "has not",
    "haven't": "have not", "havent": "have not",
    "hadn't": "had not", "hadnt": "had not",
    "wouldn't": "would not", "wouldnt": "would not",
    "shouldn't": "should not", "shouldnt": "should not",
    "couldn't": "could not", "couldnt": "could not",
    "i'm": "i am", "im": "i am",
    "i've": "i have", "ive": "i have",
    "i'll": "i will", "ill": "i will",
    "i'd": "i would", "id": "i would",
    "it's": "it is", "its": "it is",
    "that's": "that is", "thats": "that is",
    "there's": "there is", "theres": "there is",
    "they're": "they are", "theyre": "they are",
    "we're": "we are", "were": "we are",
    "you're": "you are", "youre": "you are",
    "let's": "let us", "lets": "let us",
    "what's": "what is", "whats": "what is",
}


def clean_text(text: str) -> str:
    """
    Clean and normalize text while preserving emotional signals.
    
    Args:
        text: Raw input text from check-in form
    
    Returns:
        Cleaned, normalized text ready for NLP analysis
    """
    if not text or not text.strip():
        return ""
    
    cleaned = text
    
    # Step 1: Mask PII — emails
    cleaned = re.sub(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        '[EMAIL]', cleaned
    )
    
    # Step 2: Mask PII — phone numbers (various formats)
    cleaned = re.sub(
        r'\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
        '[PHONE]', cleaned
    )
    
    # Step 3: Remove URLs
    cleaned = re.sub(r'https?://\S+|www\.\S+', '', cleaned)
    
    # Step 4: Lowercase
    cleaned = cleaned.lower()
    
    # Step 5: Expand contractions (preserves negation meaning)
    words = cleaned.split()
    expanded = []
    for word in words:
        # Strip trailing punctuation for lookup, but preserve it
        stripped = word.rstrip('.,!?;:')
        trailing = word[len(stripped):]
        if stripped in CONTRACTIONS:
            expanded.append(CONTRACTIONS[stripped] + trailing)
        else:
            expanded.append(word)
    cleaned = ' '.join(expanded)
    
    # Step 6: Remove special characters but preserve emotional punctuation (! ?)
    # Keep letters, numbers, spaces, and emotional markers
    cleaned = re.sub(r'[^\w\s!?.,\'-]', ' ', cleaned)
    
    # Step 7: Normalize whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned
