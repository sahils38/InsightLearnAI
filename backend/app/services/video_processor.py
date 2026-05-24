import os
import subprocess
from pathlib import Path
from app.config import settings


class VideoProcessor:
    """Handles video to audio extraction using FFmpeg."""

    def __init__(self):
        self.output_dir = settings.output_dir

    async def extract_audio(self, video_path: str, task_id: str) -> str:
        """
        Extract audio from video file.

        Args:
            video_path: Path to the video file
            task_id: Unique task identifier

        Returns:
            Path to the extracted audio file
        """
        audio_path = os.path.join(self.output_dir, f"{task_id}_audio.wav")

        try:
            # Use FFmpeg to extract audio
            command = [
                "ffmpeg",
                "-i", video_path,
                "-vn",  # No video
                "-acodec", "pcm_s16le",
                "-ab", "128k",
                "-ar", "16000",  # 16kHz for Whisper
                "-y",  # Overwrite output
                audio_path
            ]

            process = subprocess.run(
                command,
                capture_output=True,
                text=True
            )

            if process.returncode != 0:
                raise Exception(f"FFmpeg error: {process.stderr}")

            return audio_path

        except FileNotFoundError:
            raise Exception(
                "FFmpeg not found. Please install FFmpeg: "
                "brew install ffmpeg (Mac) or apt install ffmpeg (Linux)"
            )

    async def get_video_duration(self, video_path: str) -> float:
        """Get video duration in seconds."""
        command = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]

        process = subprocess.run(command, capture_output=True, text=True)
        return float(process.stdout.strip())

    def cleanup(self, *file_paths: str):
        """Remove temporary files."""
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
