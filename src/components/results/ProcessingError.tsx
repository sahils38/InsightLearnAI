import { AlertCircle, RotateCcw, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProcessingErrorProps {
  failedStep?: string | null;
  error?: string | null;
  onTryAgain: () => void;
  onUseDemo: () => void;
}

interface Hint {
  match: RegExp;
  cause: string;
  fix: string;
}

const HINTS: Hint[] = [
  {
    match: /groq api key not configured|GROQ_API_KEY|api[_ ]?key/i,
    cause: "The Groq API key is missing or invalid.",
    fix: "Get a free key at console.groq.com, then set GROQ_API_KEY=gsk_... in backend/.env and restart `python main.py`.",
  },
  {
    match: /openai-whisper is not installed|No module named 'whisper'/i,
    cause: "Whisper (speech-to-text) is not installed in your Python environment.",
    fix: "Activate the venv and run:  pip install setuptools wheel && pip install --no-build-isolation openai-whisper==20231117",
  },
  {
    match: /ffmpeg|No such file or directory.*ffmpeg/i,
    cause: "FFmpeg is missing or not on your PATH.",
    fix: "Install FFmpeg:  macOS → `brew install ffmpeg`  |  Ubuntu → `sudo apt install ffmpeg`",
  },
  {
    match: /403|WSServerHandshakeError|edge[_ ]?tts/i,
    cause: "Edge-TTS (Microsoft voice service) refused the request — usually a temporary 403 from their endpoint.",
    fix: "Wait a minute and retry, or use the demo session for a deterministic playback.",
  },
  {
    match: /401|unauthorized|authentication/i,
    cause: "The Groq API rejected the key as unauthorized.",
    fix: "Generate a fresh key at console.groq.com and paste it into backend/.env, then restart the backend.",
  },
  {
    match: /429|rate limit|quota/i,
    cause: "Groq rate limit hit (free tier is generous but not infinite).",
    fix: "Wait ~30 seconds and retry, or upload a shorter video.",
  },
  {
    match: /timeout|timed out|ReadTimeout/i,
    cause: "A network call timed out — typically the LLM or model download.",
    fix: "Try again with a stable connection. The first transcription downloads the Whisper model (~140 MB).",
  },
  {
    match: /JSONDecodeError|json parsing failed|invalid response format/i,
    cause: "The LLM returned text that wasn't valid JSON.",
    fix: "Retry; this is usually transient. If it persists, the lecture may be very long or non-English.",
  },
];

const matchHint = (raw: string | null | undefined): Hint | null => {
  if (!raw) return null;
  return HINTS.find((h) => h.match.test(raw)) ?? null;
};

export const ProcessingError = ({ failedStep, error, onTryAgain, onUseDemo }: ProcessingErrorProps) => {
  const hint = matchHint(error);

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-red-500/30 overflow-hidden">
        <CardHeader className="border-b border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-foreground">Processing Failed</CardTitle>
              {failedStep && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Broke at step <span className="font-medium text-foreground">{failedStep}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Raw error from backend
            </div>
            <pre className="text-xs bg-secondary/40 border border-border/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words text-foreground">
              {error || "No error message returned. Check the backend terminal for a Python traceback."}
            </pre>
          </div>

          {hint && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-amber-400">Likely cause</span>
                    <p className="text-foreground mt-0.5">{hint.cause}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-amber-400">Suggested fix</span>
                    <p className="text-foreground mt-0.5 break-words">{hint.fix}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={onTryAgain} variant="hero" className="flex-1">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              onClick={onUseDemo}
              variant="outline"
              className="flex-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <Sparkles className="w-4 h-4" />
              Use Demo Instead
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Tip: the full Python traceback is in the terminal where `python main.py` is running.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
