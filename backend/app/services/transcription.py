from app.config import settings


class TranscriptionService:
    """
    Handles speech-to-text transcription.

    Uses local Whisper model. The `whisper` package is imported lazily so the
    server can start even when whisper isn't installed (the feedback ML
    endpoints don't need it).
    """

    def __init__(self):
        self._model = None

    @property
    def model(self):
        """Lazy load Whisper model."""
        if self._model is None:
            try:
                import whisper  # local import so missing pkg doesn't break startup
            except ImportError as e:
                raise RuntimeError(
                    "openai-whisper is not installed. Install it with:\n"
                    "  pip install setuptools wheel\n"
                    "  pip install --no-build-isolation openai-whisper==20231117"
                ) from e
            print(f"Loading Whisper model: {settings.whisper_model}")
            self._model = whisper.load_model(settings.whisper_model)
        return self._model

    async def transcribe(self, audio_path: str) -> str:
        """
        Transcribe audio file to text.
        """

        result = self.model.transcribe(
            audio_path,
            language="en",
            task="transcribe"
        )

        return result["text"]

    async def transcribe_with_timestamps(self, audio_path: str) -> dict:
        """
        Transcribe with timestamps.
        """

        result = self.model.transcribe(
            audio_path,
            language="en",
            task="transcribe",
            word_timestamps=True
        )

        return {
            "text": result["text"],
            "segments": result["segments"]
        }

# For future production use:
#
# class ReplicateTranscriptionService(TranscriptionService):
#     """Use Replicate API for Whisper (cheap, scalable)."""
#
#     async def transcribe(self, audio_path: str) -> str:
#         import replicate
#         output = replicate.run(
#             "openai/whisper:large-v3",
#             input={"audio": open(audio_path, "rb")}
#         )
#         return output["transcription"]
