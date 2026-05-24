# InsightLearn Backend

FastAPI backend for processing video lectures into study materials.

## Quick Start

### 1. Prerequisites

- Python 3.9+
- FFmpeg (required for audio extraction)

**Install FFmpeg:**
```bash
# Mac
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### 2. Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Groq API key
# Get free key at: https://console.groq.com
```

### 4. Run

```bash
python main.py
```

Server runs at `http://localhost:8000`

- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload video file |
| GET | `/api/status/{task_id}` | Check processing status |
| GET | `/api/results/{task_id}` | Get notes, quiz, audio URL |
| GET | `/api/audio/{task_id}` | Stream voice summary |
| DELETE | `/api/task/{task_id}` | Delete task and files |
| POST | `/api/feedback` | Score user feedback with the ML model |
| GET | `/api/feedback/stats` | Aggregate stats over all logged feedback |

## Free Services Used

- **Whisper** (local) - Speech-to-text transcription
- **Groq** (free tier) - AI notes/quiz generation with Llama 3
- **Edge-TTS** (free) - Text-to-speech with Microsoft voices

---

## Feedback ML Model

A custom **3-class sentiment classifier** that scores user feedback on the generated
notes / quiz / audio. Returns a label (positive / neutral / negative), a 1–10 score,
and the model's confidence.

### Pipeline

```
raw text
   │
   ▼  clean_text() : lowercase, strip punctuation, drop stopwords
cleaned text
   │
   ▼  TfidfVectorizer (ngram 1-2, max_features=3000, sublinear_tf)
sparse feature matrix
   │
   ▼  LogisticRegression (class_weight="balanced", max_iter=1000)
class probabilities  ──►  label  = argmax
                          score  = round(((P(pos) - P(neg) + 1) / 2) * 10)
```

### Dataset & training

- `backend/ml/dataset.csv` — **548 labeled feedback sentences**
  (≈ 171 positive, 180 neutral, 197 negative) covering notes, quiz, audio, and UX.
- 80 / 20 stratified split (110-row test set).
- Current test accuracy: **0.83** (macro F1 **0.83**; per-class precision 0.78–0.86).

Retrain after editing the dataset:

```bash
cd backend
python -m ml.train_model      # writes feedback_model.pkl + vectorizer.pkl
python -m ml.predict          # quick sanity check on 3 sample sentences
```

### Files

| Path | What it does |
|---|---|
| `ml/dataset.csv` | Labeled training data — `text,label` |
| `ml/train_model.py` | Training script, prints metrics, saves `.pkl` artifacts |
| `ml/predict.py` | `predict(text)` → `{label, score, confidence, probabilities}` |
| `ml/feedback_model.pkl` | Trained Logistic Regression classifier |
| `ml/vectorizer.pkl` | Fitted TF-IDF vectorizer |
| `app/services/feedback_service.py` | Wraps `predict()`, appends to `data/feedback_log.csv` |
| `app/api/routes.py` | `POST /api/feedback`, `GET /api/feedback/stats` |
| `data/feedback_log.csv` | Append-only log: `timestamp, task_id, text, label, score, confidence` |

### API contract

```http
POST /api/feedback
Content-Type: application/json
{ "text": "The notes were really clear", "task_id": "optional-uuid" }

200 OK
{
  "label": "positive",
  "score": 9,
  "confidence": 0.92,
  "probabilities": { "positive": 0.92, "neutral": 0.05, "negative": 0.03 }
}
```

```http
GET /api/feedback/stats

200 OK
{
  "total": 12,
  "avg_score": 7.4,
  "label_counts": { "positive": 8, "neutral": 3, "negative": 1 },
  "recent": [ { "text": "...", "label": "...", "score": 8, "timestamp": "..." }, ... ]
}
```

### Composite session score (engagement + quiz + sentiment)

`POST /api/session-report` returns a 0–100 composite score and A/B/C/D grade
combining three axes (also exposed as a per-axis breakdown):

```
engagement  = 0.5 * min(1, notes_sec / 60) + 0.5 * min(1, audio_sec / 90)
quiz_pct    = correct / total
sentiment   = ML_score / 10
overall     = 0.30 · sentiment + 0.30 · quiz + 0.40 · engagement
grade       = A (≥85%) | B (≥70%) | C (≥55%) | D (else)
```

Thresholds (`TARGET_NOTES_SECONDS=60`, `TARGET_AUDIO_SECONDS=90`) are calibrated
to realistic usage: the AI notes are short bullet summaries (~1 min read) and
the TTS audio summary is capped at ~300 words (~90s playback). Each row is
logged to `data/session_log.csv`.

### Design decisions (viva talking points)

- **Why TF-IDF + Logistic Regression** (not a transformer)? — small hand-labeled
  dataset, interpretable coefficients, sub-millisecond inference, no GPU needed.
- **Why 3 classes** (not 5-star)? — fewer classes mean cleaner training data and
  fewer ambiguous boundaries; the 1–10 score gives finer-grained output anyway.
- **Score formula**: `round(((P(positive) - P(negative) + 1) / 2) * 10)`, clamped
  to `[1, 10]`. This produces a smooth 1–10 even when the predicted label is
  neutral — pure-class output would lose that nuance.
- **`class_weight="balanced"`** on LogReg keeps the model honest as the dataset
  grows unevenly with real feedback.
- **CSV-as-database** is intentional for the demo — single file, easy to
  inspect during the viva. Production would migrate to SQLite or Postgres.

### Possible improvements (when asked "what next?")

1. Larger dataset (5–10×) including sarcasm & mixed-tone examples.
2. Character n-grams to catch typos and informal spellings.
3. Compare against `MultinomialNB` and a small DistilBERT fine-tune.
4. Active learning: surface low-confidence predictions for re-labeling.
