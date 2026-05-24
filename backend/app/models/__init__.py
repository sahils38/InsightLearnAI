from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    EXTRACTING_AUDIO = "extracting_audio"
    TRANSCRIBING = "transcribing"
    GENERATING_NOTES = "generating_notes"
    CREATING_VOICE = "creating_voice"
    BUILDING_QUIZ = "building_quiz"
    COMPLETED = "completed"
    FAILED = "failed"


class NoteSection(BaseModel):
    title: str
    content: List[str]


class QuizOption(BaseModel):
    id: str
    text: str


class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[QuizOption]
    correct_answer: str
    explanation: str


class ProcessingResult(BaseModel):
    status: ProcessingStatus
    progress: int  # 0-100
    current_step: str
    notes: Optional[List[NoteSection]] = None
    quiz: Optional[List[QuizQuestion]] = None
    audio_url: Optional[str] = None
    error: Optional[str] = None


class UploadResponse(BaseModel):
    task_id: str
    message: str


class StatusResponse(BaseModel):
    task_id: str
    status: ProcessingStatus
    progress: int
    current_step: str
    error: Optional[str] = None
    failed_step: Optional[str] = None


class ResultsResponse(BaseModel):
    task_id: str
    notes: List[NoteSection]
    quiz: List[QuizQuestion]
    audio_url: str


# ---------------- Feedback ML ----------------

class FeedbackIn(BaseModel):
    text: str
    task_id: Optional[str] = None  # optional: link feedback to a processed video


class FeedbackOut(BaseModel):
    label: str            # positive | neutral | negative
    score: int            # 1..10
    confidence: float     # 0..1
    probabilities: dict   # {label: prob}


class FeedbackStatsItem(BaseModel):
    text: str
    label: str
    score: int
    timestamp: str


class FeedbackStats(BaseModel):
    total: int
    avg_score: float
    label_counts: dict
    recent: List[FeedbackStatsItem]


# ---------------- Session report (engagement + quiz + feedback) ----------------

class QuizResult(BaseModel):
    correct: int
    total: int
    seconds: float = 0.0


class SessionReportIn(BaseModel):
    text: str
    task_id: Optional[str] = None
    notes_seconds: float = 0.0      # active time on the Notes tab
    audio_seconds: float = 0.0      # actual audio playback time
    quiz: Optional[QuizResult] = None


class ScoreBreakdown(BaseModel):
    sentiment: float       # 0..1
    engagement: float      # 0..1
    quiz: float            # 0..1
    overall: float         # 0..1


class SessionReportOut(BaseModel):
    label: str
    sentiment_score: int           # 1..10 from ML model
    confidence: float
    probabilities: dict
    notes_seconds: float
    audio_seconds: float
    quiz: Optional[QuizResult] = None
    breakdown: ScoreBreakdown
    overall_grade: str             # 'A', 'B', 'C', 'D'
