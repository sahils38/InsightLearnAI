import asyncio
import os
import shutil
import struct
import subprocess
import wave

import edge_tts
from app.config import settings


class TTSService:
    """
    Resilient text-to-speech with graceful fallbacks.

    Order of attempts (each falls through to the next on failure):
    1. Edge-TTS (Microsoft, free, best quality).
    2. macOS `say` + ffmpeg (offline, always works on macOS).
    3. Silent placeholder MP3 (last resort — pipeline still completes).
    """

    EDGE_RETRIES = 2
    EDGE_RETRY_DELAY = 1.5  # seconds

    def __init__(self):
        self.voice = settings.tts_voice
        self.output_dir = settings.output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_audio(self, text: str, task_id: str) -> str:
        output_path = os.path.join(self.output_dir, f"{task_id}_voice.mp3")

        # 1) Edge-TTS with retries
        try:
            await self._edge_tts(text, output_path)
            print(f"TTS: Edge-TTS succeeded -> {output_path}")
            return output_path
        except Exception as e:
            print(f"TTS: Edge-TTS failed ({type(e).__name__}: {e}); falling back to macOS say")

        # 2) macOS say + ffmpeg (works offline)
        try:
            self._mac_say(text, output_path)
            print(f"TTS: macOS say succeeded -> {output_path}")
            return output_path
        except Exception as e:
            print(f"TTS: macOS say failed ({type(e).__name__}: {e}); writing silent placeholder")

        # 3) Silent placeholder — never fail the pipeline on TTS
        self._silent_placeholder(output_path)
        print(f"TTS: silent placeholder written -> {output_path}")
        return output_path

    async def _edge_tts(self, text: str, output_path: str) -> None:
        last_exc: Exception | None = None
        for attempt in range(1, self.EDGE_RETRIES + 1):
            try:
                communicate = edge_tts.Communicate(text, self.voice)
                await communicate.save(output_path)
                return
            except Exception as e:
                last_exc = e
                print(f"TTS: Edge-TTS attempt {attempt} failed: {e}")
                if attempt < self.EDGE_RETRIES:
                    await asyncio.sleep(self.EDGE_RETRY_DELAY)
        assert last_exc is not None
        raise last_exc

    def _mac_say(self, text: str, output_path: str) -> None:
        if not shutil.which("say"):
            raise RuntimeError("macOS `say` not available on this OS")
        if not shutil.which("ffmpeg"):
            raise RuntimeError("ffmpeg not available; install with `brew install ffmpeg`")

        aiff_path = output_path.replace(".mp3", ".aiff")
        try:
            # `say` is fast and produces a clear voice.
            subprocess.run(
                ["say", "-v", "Samantha", "-o", aiff_path, text],
                check=True,
                capture_output=True,
                timeout=60,
            )
            subprocess.run(
                [
                    "ffmpeg", "-y", "-i", aiff_path,
                    "-codec:a", "libmp3lame", "-qscale:a", "4",
                    output_path,
                ],
                check=True,
                capture_output=True,
                timeout=60,
            )
        finally:
            if os.path.exists(aiff_path):
                try:
                    os.remove(aiff_path)
                except OSError:
                    pass

    def _silent_placeholder(self, output_path: str) -> None:
        """3-second silent WAV written with .mp3 extension. Browsers content-sniff and play it."""
        sample_rate = 22050
        n_frames = sample_rate * 3
        with wave.open(output_path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sample_rate)
            w.writeframes(b"".join(struct.pack("<h", 0) for _ in range(n_frames)))

    async def list_voices(self, language: str = "en") -> list:
        """List available Edge-TTS voices for a language."""
        voices = await edge_tts.list_voices()
        return [
            {"name": v["ShortName"], "gender": v["Gender"]}
            for v in voices
            if v["Locale"].startswith(language)
        ]


# Available English voices (Edge-TTS):
# - en-US-AriaNeural (Female, natural)
# - en-US-GuyNeural (Male, natural)
# - en-US-JennyNeural (Female, friendly)
# - en-GB-SoniaNeural (British Female)
# - en-AU-NatashaNeural (Australian Female)
