import os
import torch
import pickle
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

# ---------------- DEVICE ----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------- PATHS ----------------
MODEL_DIR = "category_model"
ENCODER_FILE = "label_encoder.pkl"

# ---------------- LOAD CATEGORY MODEL ----------------
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, use_fast=False)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.to(device)
model.eval()

with open(ENCODER_FILE, "rb") as f:
    label_encoder = pickle.load(f)

# ---------------- LOAD SENTIMENT MODEL ----------------
SENTIMENT_MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

sentiment_tokenizer = AutoTokenizer.from_pretrained(SENTIMENT_MODEL, use_fast=False)

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model=SENTIMENT_MODEL,
    tokenizer=sentiment_tokenizer,
    device=0 if torch.cuda.is_available() else -1
)

# ---------------- LABEL FIX (IMPORTANT) ----------------
LABEL_MAP = {
    "LABEL_0": "Negative",
    "LABEL_1": "Neutral",
    "LABEL_2": "Positive"
}

# ---------------- URGENCY FUNCTIONS ----------------
def sentiment_to_urgency(label):
    return {
        "Negative": 1.0,
        "Neutral": 0.5,
        "Positive": 0.2
    }.get(label, 0.5)

def keyword_urgency_boost(text):
    keywords = [
        "dangerous", "critical", "urgent", "emergency",
        "risk", "accident", "collapse", "unsafe", "severe",
        "death", "injury", "hospital", "heavy", "difficult"
    ]
    boost = sum(0.2 for k in keywords if k in text.lower())
    return min(boost, 0.5)

# ---------------- MAIN PREDICT FUNCTION ----------------
def classify_text(text):

    # CATEGORY
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    pred = torch.argmax(outputs.logits, dim=1).item()
    category = label_encoder.inverse_transform([pred])[0]

    # SENTIMENT
    raw_sentiment = sentiment_pipeline(text)[0]
    sentiment = LABEL_MAP.get(raw_sentiment["label"], raw_sentiment["label"])

    # URGENCY
    urgency = min(
        sentiment_to_urgency(sentiment) +
        keyword_urgency_boost(text),
        1.0
    )

    return {
        "category": category,
        "sentiment": sentiment,
        "sentiment_confidence": round(float(raw_sentiment["score"]), 2),
        "severity_score": round(float(urgency), 2)
    }
