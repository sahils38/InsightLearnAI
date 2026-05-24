"""
Load the trained feedback model and run predictions.

Usage:
    from app.ml.predict import predict
    predict("The notes were really clear")
    # -> {"label": "positive", "score": 9, "confidence": 0.92, "probabilities": {...}}
"""
import os
from functools import lru_cache
from typing import Dict

import joblib

try:
    from .train_model import clean_text
except ImportError:  # allow running as a plain script
    from train_model import clean_text  # type: ignore


HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "feedback_model.pkl")
VECTORIZER_PATH = os.path.join(HERE, "vectorizer.pkl")


class ModelNotTrainedError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _load():
    if not (os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH)):
        raise ModelNotTrainedError(
            "feedback_model.pkl / vectorizer.pkl missing. "
            "Run: python -m ml.train_model (from backend/)"
        )
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    return model, vectorizer


def predict(text: str) -> Dict:
    if not text or not text.strip():
        raise ValueError("text must be a non-empty string")

    model, vectorizer = _load()
    cleaned = clean_text(text)
    vec = vectorizer.transform([cleaned])

    classes = list(model.classes_)
    probs = model.predict_proba(vec)[0]
    prob_map = {cls: float(p) for cls, p in zip(classes, probs)}

    label = max(prob_map, key=prob_map.get)
    confidence = prob_map[label]

    p_pos = prob_map.get("positive", 0.0)
    p_neg = prob_map.get("negative", 0.0)
    raw_score = (p_pos - p_neg + 1) / 2  # map [-1, 1] -> [0, 1]
    score = max(1, min(10, round(raw_score * 10)))

    return {
        "label": label,
        "score": score,
        "confidence": round(confidence, 3),
        "probabilities": {k: round(v, 3) for k, v in prob_map.items()},
    }


if __name__ == "__main__":
    samples = [
        "The notes were really clear and helpful",
        "It is okay nothing special",
        "Worst experience the audio was broken",
    ]
    for s in samples:
        print(s, "->", predict(s))
