import os
import uuid
import asyncio
from typing import Dict
from fastapi import Form
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.config import settings
from app.models import (
    UploadResponse,
    StatusResponse,
    ResultsResponse,
    ProcessingStatus,
    NoteSection,
    QuizQuestion,
    FeedbackIn,
    FeedbackOut,
    FeedbackStats,
    SessionReportIn,
    SessionReportOut,
)
from app.services import (
    VideoProcessor,
    TranscriptionService,
    AIGeneratorService,
    TTSService,
    FeedbackService,
)

router = APIRouter()

# In-memory task storage (use Redis/DB in production)
tasks: Dict[str, dict] = {}

# Service instances
video_processor = VideoProcessor()
transcription_service = TranscriptionService()
ai_generator = AIGeneratorService()
tts_service = TTSService()
feedback_service = FeedbackService()


class _StepFailed(RuntimeError):
    def __init__(self, step: str, cause: Exception):
        super().__init__(f"[{step}] {type(cause).__name__}: {cause}")
        self.step = step
        self.cause = cause


async def _run_step(task_id: str, name: str, label: str, status: ProcessingStatus, progress: int, coro):
    """Run one pipeline step, tagging any failure with the step name."""
    tasks[task_id]["status"] = status
    tasks[task_id]["progress"] = progress
    tasks[task_id]["current_step"] = label
    print(f"STEP {name}: {label}")
    try:
        return await coro
    except Exception as e:
        raise _StepFailed(name, e) from e


async def process_video_task(task_id: str, video_path: str, output_language: str):
    """Background task to process video through the full pipeline."""
    audio_path = None
    try:
        audio_path = await _run_step(
            task_id, "1 / Extract Audio", "Extracting audio from video...",
            ProcessingStatus.EXTRACTING_AUDIO, 10,
            video_processor.extract_audio(video_path, task_id),
        )

        transcript = await _run_step(
            task_id, "2 / Transcribe", "Transcribing speech to text (Whisper)...",
            ProcessingStatus.TRANSCRIBING, 30,
            transcription_service.transcribe(audio_path),
        )

        notes = await _run_step(
            task_id, "3 / Generate Notes", "Generating study notes (Groq LLM)...",
            ProcessingStatus.GENERATING_NOTES, 50,
            ai_generator.generate_notes(transcript[:15000], output_language),
        )
        tasks[task_id]["notes"] = notes

        summary_text = await _run_step(
            task_id, "4a / Summarise for TTS", "Summarising notes for voice narration...",
            ProcessingStatus.CREATING_VOICE, 65,
            ai_generator.summarize_for_tts(notes),
        )
        summary_text = summary_text[:2000]

        voice_path = await _run_step(
            task_id, "4b / Synthesise Voice", "Creating voice summary (Edge-TTS)...",
            ProcessingStatus.CREATING_VOICE, 75,
            tts_service.generate_audio(summary_text, task_id),
        )
        tasks[task_id]["audio_path"] = voice_path

        quiz = await _run_step(
            task_id, "5 / Build Quiz", "Building interactive quiz (Groq LLM)...",
            ProcessingStatus.BUILDING_QUIZ, 90,
            ai_generator.generate_quiz(transcript[:6000], notes, output_language, num_questions=10),
        )
        tasks[task_id]["quiz"] = quiz

        tasks[task_id]["status"] = ProcessingStatus.COMPLETED
        tasks[task_id]["progress"] = 100
        tasks[task_id]["current_step"] = "Processing complete!"

        video_processor.cleanup(video_path, audio_path)

    except _StepFailed as e:
        # Per-step failure: we know which step broke and the original cause.
        print(f"PIPELINE FAILED at {e.step}: {type(e.cause).__name__}: {e.cause}")
        import traceback; traceback.print_exception(type(e.cause), e.cause, e.cause.__traceback__)
        tasks[task_id]["status"] = ProcessingStatus.FAILED
        tasks[task_id]["failed_step"] = e.step
        tasks[task_id]["error"] = f"{type(e.cause).__name__}: {e.cause}"
        tasks[task_id]["current_step"] = f"Failed at step {e.step}"
    except Exception as e:
        print(f"PIPELINE FAILED (unexpected): {type(e).__name__}: {e}")
        import traceback; traceback.print_exc()
        tasks[task_id]["status"] = ProcessingStatus.FAILED
        tasks[task_id]["failed_step"] = "Unknown"
        tasks[task_id]["error"] = f"{type(e).__name__}: {e}"
        tasks[task_id]["current_step"] = "Unexpected pipeline error"


@router.post("/upload", response_model=UploadResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_language: str = Form("English")
):
    """
    Upload a video file for processing.
    Returns a task_id to track progress.
    """
    # Validate file type
    allowed_types = ["video/mp4", "video/avi", "video/mov", "video/x-matroska"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: MP4, AVI, MOV, MKV"
        )

    # Generate task ID
    task_id = str(uuid.uuid4())

    # Save uploaded file
    video_path = os.path.join(settings.upload_dir, f"{task_id}_{file.filename}")
    with open(video_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Check file size
    file_size_mb = len(content) / (1024 * 1024)
    if file_size_mb > settings.max_file_size_mb:
        os.remove(video_path)
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size_mb}MB"
        )

    # Initialize task
    tasks[task_id] = {
        "status": ProcessingStatus.PENDING,
        "progress": 0,
        "current_step": "Queued for processing...",
        "notes": None,
        "quiz": None,
        "audio_path": None,
        "error": None
    }

    # Start background processing
    background_tasks.add_task(
    process_video_task,
    task_id,
    video_path,
    output_language
)

    return UploadResponse(
        task_id=task_id,
        message="Video uploaded successfully. Processing started."
    )


@router.get("/status/{task_id}", response_model=StatusResponse)
async def get_status(task_id: str):
    """Get the current processing status of a task."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = tasks[task_id]
    return StatusResponse(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        current_step=task["current_step"],
        error=task.get("error"),
        failed_step=task.get("failed_step"),
    )


@router.get("/results/{task_id}", response_model=ResultsResponse)
async def get_results(task_id: str):
    """Get the processing results for a completed task."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = tasks[task_id]

    if task["status"] == ProcessingStatus.FAILED:
        raise HTTPException(status_code=500, detail=task["error"])

    if task["status"] != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Task not completed. Current status: {task['status']}"
        )

    return ResultsResponse(
        task_id=task_id,
        notes=task["notes"],
        quiz=task["quiz"],
        audio_url=f"/api/audio/{task_id}"
    )


@router.get("/audio/{task_id}")
async def get_audio(task_id: str):
    """Stream the generated voice summary audio."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = tasks[task_id]
    if not task.get("audio_path") or not os.path.exists(task["audio_path"]):
        raise HTTPException(status_code=404, detail="Audio not found")

    return FileResponse(
        task["audio_path"],
        media_type="audio/mpeg",
        filename=f"insightlearn_voice_{task_id}.mp3"
    )


@router.delete("/task/{task_id}")
async def delete_task(task_id: str):
    """Delete a task and its associated files."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = tasks[task_id]

    # Cleanup files
    if task.get("audio_path"):
        video_processor.cleanup(task["audio_path"])

    del tasks[task_id]

    return {"message": "Task deleted successfully"}


# ---------------- Feedback ML endpoints ----------------

@router.post("/feedback", response_model=FeedbackOut)
async def submit_feedback(payload: FeedbackIn):
    """
    Score user feedback with the trained ML model.
    Returns sentiment label + score (1-10) + confidence, and logs the feedback.
    """
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > 1000:
        raise HTTPException(status_code=400, detail="text must be 1000 characters or fewer")

    try:
        result = feedback_service.submit(text, task_id=payload.task_id)
    except RuntimeError as e:
        # Model not trained yet
        raise HTTPException(status_code=503, detail=str(e))

    return FeedbackOut(**result)


@router.get("/feedback/stats", response_model=FeedbackStats)
async def get_feedback_stats():
    """Aggregate stats over all logged feedback (for the analytics chart)."""
    return FeedbackStats(**feedback_service.stats())


@router.post("/session-report", response_model=SessionReportOut)
async def submit_session_report(payload: SessionReportIn):
    """
    Comprehensive session report: ML sentiment + engagement (time-on-notes / audio)
    + quiz performance. Returns per-axis breakdown and an overall A/B/C/D grade.
    """
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > 1000:
        raise HTTPException(status_code=400, detail="text must be 1000 characters or fewer")

    quiz_dict = None
    if payload.quiz is not None:
        if payload.quiz.total < 0 or payload.quiz.correct < 0:
            raise HTTPException(status_code=400, detail="quiz counts must be non-negative")
        if payload.quiz.correct > payload.quiz.total:
            raise HTTPException(status_code=400, detail="quiz correct cannot exceed total")
        quiz_dict = payload.quiz.model_dump()

    if payload.notes_seconds < 0 or payload.audio_seconds < 0:
        raise HTTPException(status_code=400, detail="seconds must be non-negative")

    try:
        return SessionReportOut(**feedback_service.submit_session(
            text=text,
            notes_seconds=payload.notes_seconds,
            audio_seconds=payload.audio_seconds,
            quiz=quiz_dict,
            task_id=payload.task_id,
        ))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
