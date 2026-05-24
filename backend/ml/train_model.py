"""
Train the feedback sentiment classifier.

Pipeline: text -> clean -> TF-IDF (1-2 grams) -> Logistic Regression -> {positive, neutral, negative}
Run:  python -m backend.ml.train_model
      (or)  cd backend && python -m ml.train_model
"""
import os
import re
import string
import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


HERE = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(HERE, "dataset.csv")
MODEL_PATH = os.path.join(HERE, "feedback_model.pkl")
VECTORIZER_PATH = os.path.join(HERE, "vectorizer.pkl")

STOPWORDS = {
    "a", "an", "the", "is", "it", "this", "that", "to", "of", "in", "on", "for",
    "and", "or", "but", "i", "we", "you", "they", "my", "our", "your", "their",
    "was", "were", "be", "been", "am", "are", "have", "has", "had", "do", "does",
    "did", "so", "as", "at", "by", "with", "from", "me",
}


def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(rf"[{re.escape(string.punctuation)}]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = [t for t in text.split() if t not in STOPWORDS and len(t) > 1]
    return " ".join(tokens)


def main():
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"dataset.csv not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    df = df.dropna(subset=["text", "label"]).reset_index(drop=True)
    df["text_clean"] = df["text"].apply(clean_text)

    print(f"Loaded {len(df)} rows")
    print("Label distribution:")
    print(df["label"].value_counts(), "\n")

    X_train, X_test, y_train, y_test = train_test_split(
        df["text_clean"], df["label"],
        test_size=0.2,
        random_state=42,
        stratify=df["label"],
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=3000,
        min_df=1,
        sublinear_tf=True,
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        C=1.0,
    )
    model.fit(X_train_vec, y_train)

    y_pred = model.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)

    print(f"Test accuracy: {acc:.3f}\n")
    print("Classification report:")
    print(classification_report(y_test, y_pred))
    print("Confusion matrix (rows = true, cols = predicted):")
    print("Labels:", list(model.classes_))
    print(confusion_matrix(y_test, y_pred, labels=list(model.classes_)))

    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    print(f"\nSaved model      -> {MODEL_PATH}")
    print(f"Saved vectorizer -> {VECTORIZER_PATH}")


if __name__ == "__main__":
    main()
