import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Headphones, FileText, Brain, Sparkles, Loader2, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { api, FeedbackLabel, SessionReportResponse } from "@/lib/api";
import { toast } from "sonner";

interface SessionReportProps {
  taskId?: string;
  notesSeconds: number;
  audioSeconds: number;
  quizResult?: { correct: number; total: number; seconds: number };
}

const formatDuration = (s: number) => {
  if (s < 1) return "0s";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
};

const labelMeta: Record<FeedbackLabel, { icon: typeof ThumbsUp; text: string; color: string }> = {
  positive: { icon: ThumbsUp, text: "Positive", color: "text-green-400 border-green-500/30 bg-green-500/10" },
  neutral: { icon: Minus, text: "Neutral", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  negative: { icon: ThumbsDown, text: "Negative", color: "text-red-400 border-red-500/30 bg-red-500/10" },
};

const gradeColor: Record<string, string> = {
  A: "text-amber-400",
  B: "text-amber-300",
  C: "text-amber-200",
  D: "text-red-400",
};

// Circular progress ring (0..1)
const Gauge = ({
  value,
  size = 96,
  label,
  display,
  Icon,
}: {
  value: number;
  size?: number;
  label: string;
  display: string;
  Icon: typeof Trophy;
}) => {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, value));
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            fill="none"
            opacity={0.3}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--accent))"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${c - dash}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <Icon className="w-4 h-4 text-amber-500 mb-0.5" />
          <span className="text-sm font-bold text-foreground leading-tight">{display}</span>
        </div>
      </div>
      <span className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
};

export const SessionReport = ({ taskId, notesSeconds, audioSeconds, quizResult }: SessionReportProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SessionReportResponse | null>(null);

  // Display-only fallbacks; the authoritative scores come from result.breakdown after submit.

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Just a quick line first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.submitSessionReport({
        text: trimmed,
        task_id: taskId,
        notes_seconds: notesSeconds,
        audio_seconds: audioSeconds,
        quiz: quizResult,
      });
      setResult(res);
      toast.success(`You got a ${res.overall_grade} overall.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const LabelIcon = result ? labelMeta[result.label].icon : null;

  return (
    <Card className="overflow-hidden border-amber-500/20">
      <CardHeader className="border-b border-border/50 bg-gradient-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-2xl">How did this session go?</CardTitle>
            <CardDescription>
              Mixes how long you actually engaged, how the quiz went, and what you wrote below
              into one honest grade.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Engagement strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-secondary/40 border border-border/50 p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Reading the notes</div>
              <div className="font-semibold text-foreground">{formatDuration(notesSeconds)}</div>
            </div>
          </div>
          <div className="rounded-xl bg-secondary/40 border border-border/50 p-4 flex items-center gap-3">
            <Headphones className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Listening</div>
              <div className="font-semibold text-foreground">{formatDuration(audioSeconds)}</div>
            </div>
          </div>
          <div className="rounded-xl bg-secondary/40 border border-border/50 p-4 flex items-center gap-3">
            <Brain className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Quiz</div>
              <div className="font-semibold text-foreground">
                {quizResult
                  ? `${quizResult.correct} of ${quizResult.total} in ${formatDuration(quizResult.seconds)}`
                  : "Skipped"}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            One last thing — how was it?
          </label>
          <Textarea
            placeholder="What worked, what didn't — be blunt."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={3}
            disabled={loading}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length} / 1000</span>
            <Button onClick={handleSubmit} disabled={loading || !text.trim()} variant="hero">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scoring...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  Show me the report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && LabelIcon && (
          <div className="space-y-6 pt-6 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Final grade</div>
                <div className={`text-7xl font-extrabold leading-none ${gradeColor[result.overall_grade] ?? "text-amber-400"}`}>
                  {result.overall_grade}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {Math.round(result.breakdown.overall * 100)}% composite score
                </div>
              </div>
              <Badge variant="outline" className={`text-sm ${labelMeta[result.label].color}`}>
                <LabelIcon className="w-3.5 h-3.5 mr-1" />
                {labelMeta[result.label].text} feedback
                <span className="ml-2 opacity-70">{result.sentiment_score}/10</span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Gauge
                value={result.breakdown.sentiment}
                label="Sentiment"
                display={`${result.sentiment_score}/10`}
                Icon={Sparkles}
              />
              <Gauge
                value={result.breakdown.quiz}
                label="Quiz"
                display={
                  quizResult
                    ? `${Math.round(result.breakdown.quiz * 100)}%`
                    : "—"
                }
                Icon={Brain}
              />
              <Gauge
                value={result.breakdown.engagement}
                label="Engagement"
                display={`${Math.round(result.breakdown.engagement * 100)}%`}
                Icon={Clock}
              />
              <Gauge
                value={result.breakdown.overall}
                label="Overall"
                display={`${Math.round(result.breakdown.overall * 100)}%`}
                Icon={Trophy}
              />
            </div>

            <div className="rounded-lg bg-secondary/30 border border-border/50 p-4 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">How we got there:</span> 30% from your written feedback,
                30% from the quiz, 40% from time spent actually engaging. Reading/listening tops out at ~1 minute
                each — the notes aren't long enough to need more.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
