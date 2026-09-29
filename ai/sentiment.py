from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text: str) -> dict:
    scores = analyzer.polarity_scores(text)
    return {
        "compound": scores["compound"],
        "pos": scores["pos"],
        "neg": scores["neg"],
        "neu": scores["neu"]
    }
