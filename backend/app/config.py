from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App settings
    app_name: str = "InsightLearn Backend"
    debug: bool = True

    # API Keys (optional for free tier usage)
    groq_api_key: Optional[str] = None
    google_api_key: Optional[str] = None  # For Gemini (alternative)

    # File settings
    upload_dir: str = "uploads"
    output_dir: str = "outputs"
    max_file_size_mb: int = 500

    # Whisper settings (local)
    whisper_model: str = "base"  # tiny, base, small, medium, large

    # TTS settings
    tts_voice: str = "en-US-AriaNeural"  # Edge TTS voice

    class Config:
        env_file = ".env"


settings = Settings()

# Create directories if they don't exist
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.output_dir, exist_ok=True)
