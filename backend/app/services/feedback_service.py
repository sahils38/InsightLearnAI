"""
Feedback service: thin wrapper around the ML model + append-only CSV log.

Stores feedback in backend/data/feedback_log.csv as:
    timestamp,task_id,text,label,score,confidence
"""
import csv
import os
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from ml.predict import predict as ml_predict


HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA_DIR = os.path.join(BACKEND_ROOT, "data")
LOG_PATH = os.path.join(DATA_DIR, "feedback_log.csv")
SESSION_LOG_PATH = os.path.join(DATA_DIR, "session_log.csv")

_FIELDS = ["timestamp", "task_id", "text", "label", "score", "confidence"]
_SESSION_FIELDS = [
    "timestamp", "task_id", "text", "label", "sentiment_score", "confidence",
    "notes_seconds", "audio_seconds",
    "quiz_correct", "quiz_total", "quiz_seconds",
    "engagement", "quiz_pct", "overall", "grade",
]
_lock = threading.Lock()

# Tuning constants — calibrated to realistic usage of the AI-generated content.
# Notes are short bullet-point summaries; audio TTS summary caps at ~300 words (~90s).
TARGET_NOTES_SECONDS = 60.0    # 1 min of reading short notes = full credit
TARGET_AUDIO_SECONDS = 90.0    # 1.5 min listening (full summary length) = full credit
W_SENTIMENT = 0.30
W_QUIZ = 0.30
W_ENGAGEMENT = 0.40


def _ensure_log():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(LOG_PATH):
        with open(LOG_PATH, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(_FIELDS)


def _ensure_session_log():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(SESSION_LOG_PATH):
        with open(SESSION_LOG_PATH, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(_SESSION_FIELDS)


def _grade(score_0_1: float) -> str:
    if score_0_1 >= 0.85:
        return "A"
    if score_0_1 >= 0.70:
        return "B"
    if score_0_1 >= 0.55:
        return "C"
    return "D"


class FeedbackService:
    def submit(self, text: str, task_id: Optional[str] = None) -> Dict:
        result = ml_predict(text)
        row = {
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "task_id": task_id or "",
            "text": text.replace("\n", " ").strip(),
            "label": result["label"],
            "score": result["score"],
            "confidence": result["confidence"],
        }
        _ensure_log()
        with _lock, open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=_FIELDS).writerow(row)
        return result

    def stats(self, recent_n: int = 10) -> Dict:
        if not os.path.exists(LOG_PATH):
            return {"total": 0, "avg_score": 0.0, "label_counts": {}, "recent": []}

        with open(LOG_PATH, "r", encoding="utf-8") as f:
            rows: List[dict] = list(csv.DictReader(f))

        if not rows:
            return {"total": 0, "avg_score": 0.0, "label_counts": {}, "recent": []}

        scores = [int(r["score"]) for r in rows if r.get("score")]
        label_counts: Dict[str, int] = {}
        for r in rows:
            label_counts[r["label"]] = label_counts.get(r["label"], 0) + 1

        recent = [
            {
                "text": r["text"],
                "label": r["label"],
                "score": int(r["score"]),
                "timestamp": r["timestamp"],
            }
            for r in rows[-recent_n:][::-1]
        ]

        return {
            "total": len(rows),
            "avg_score": round(sum(scores) / len(scores), 2),
            "label_counts": label_counts,
            "recent": recent,
        }

    def submit_session(
        self,
        text: str,
        notes_seconds: float,
        audio_seconds: float,
        quiz: Optional[Dict] = None,
        task_id: Optional[str] = None,
    ) -> Dict:
        ml = ml_predict(text)

        # Engagement: how much they used the learning material
        notes_part = min(1.0, max(0.0, notes_seconds / TARGET_NOTES_SECONDS))
        audio_part = min(1.0, max(0.0, audio_seconds / TARGET_AUDIO_SECONDS))
        engagement = 0.5 * notes_part + 0.5 * audio_part

        # Quiz: correct / total (or 0 if no quiz submitted)
        if quiz and quiz.get("total", 0) > 0:
            quiz_pct = quiz["correct"] / quiz["total"]
        else:
            quiz_pct = 0.0

        sentiment = ml["score"] / 10.0  # already 1..10
        overall = (
            W_SENTIMENT * sentiment
            + W_QUIZ * quiz_pct
            + W_ENGAGEMENT * engagement
        )
        grade = _grade(overall)

        row = {
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "task_id": task_id or "",
            "text": text.replace("\n", " ").strip(),
            "label": ml["label"],
            "sentiment_score": ml["score"],
            "confidence": ml["confidence"],
            "notes_seconds": round(notes_seconds, 2),
            "audio_seconds": round(audio_seconds, 2),
            "quiz_correct": quiz["correct"] if quiz else "",
            "quiz_total": quiz["total"] if quiz else "",
            "quiz_seconds": round(quiz["seconds"], 2) if quiz else "",
            "engagement": round(engagement, 3),
            "quiz_pct": round(quiz_pct, 3),
            "overall": round(overall, 3),
            "grade": grade,
        }
        _ensure_session_log()
        with _lock, open(SESSION_LOG_PATH, "a", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=_SESSION_FIELDS).writerow(row)

        return {
            "label": ml["label"],
            "sentiment_score": ml["score"],
            "confidence": ml["confidence"],
            "probabilities": ml["probabilities"],
            "notes_seconds": round(notes_seconds, 2),
            "audio_seconds": round(audio_seconds, 2),
            "quiz": quiz,
            "breakdown": {
                "sentiment": round(sentiment, 3),
                "engagement": round(engagement, 3),
                "quiz": round(quiz_pct, 3),
                "overall": round(overall, 3),
            },
            "overall_grade": grade,
        }
