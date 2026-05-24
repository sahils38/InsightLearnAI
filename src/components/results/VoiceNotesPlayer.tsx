import { useState, useRef, useEffect } from "react";
import { Headphones, Play, Pause, SkipBack, SkipForward, Volume2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface VoiceNotesPlayerProps {
  audioUrl: string;
  onListenUpdate?: (totalSeconds: number) => void;
}

export const VoiceNotesPlayer = ({ audioUrl, onListenUpdate }: VoiceNotesPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  // Actual listen time = wall-clock seconds spent playing (handles pauses + seeks).
  const playStartRef = useRef<number | null>(null);
  const listenTotalRef = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const accumulate = () => {
      if (playStartRef.current != null) {
        listenTotalRef.current += (Date.now() - playStartRef.current) / 1000;
        playStartRef.current = null;
        onListenUpdate?.(listenTotalRef.current);
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handlePlay = () => {
      playStartRef.current = Date.now();
    };
    const handlePause = () => {
      accumulate();
    };
    const handleEnded = () => {
      accumulate();
      setIsPlaying(false);
    };
    const handleSeeking = () => {
      // pause the listen counter during seeks; resume on play
      accumulate();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("seeking", handleSeeking);

    return () => {
      accumulate();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("seeking", handleSeeking);
    };
  }, [onListenUpdate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleSkipBack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "cramAI_voice_notes.mp3";  
    link.click();
    toast.success("Saved — listen on the way to class.");
  };

  // Generate waveform bars
  const waveformBars = Array.from({ length: 50 }, () => Math.random() * 100);

  return (
    <Card className="overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <CardHeader className="border-b border-border/50 bg-gradient-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-purple-500" />
            </div>
            <CardTitle>Voice Notes</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download MP3
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Waveform visualization */}
        <div className="h-20 flex items-center gap-0.5 mb-6 px-2">
          {waveformBars.map((height, index) => {
            const isActive = duration > 0 && (index / waveformBars.length) * duration <= currentTime;
            return (
              <div
                key={index}
                className="flex-1 rounded-full transition-all duration-150"
                style={{
                  height: `${Math.max(20, height)}%`,
                  backgroundColor: isActive
                    ? "hsl(var(--accent))"
                    : "hsl(var(--muted))",
                }}
              />
            );
          })}
        </div>

        {/* Progress slider */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleSkipBack}>
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            variant="hero"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleSkipForward}>
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(v) => setVolume(v[0])}
            className="w-32"
          />
          <span className="text-xs text-muted-foreground w-8">{volume}%</span>
        </div>
      </CardContent>
    </Card>
  );
};
