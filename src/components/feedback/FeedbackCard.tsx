import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { api, FeedbackLabel, FeedbackResponse } from "@/lib/api";
import { toast } from "sonner";

interface FeedbackCardProps {
  taskId?: string;
  onSubmitted?: (result: FeedbackResponse) => void;
}

const LABEL_META: Record<FeedbackLabel, { color: string; icon: typeof ThumbsUp; text: string }> = {
  positive: { color: "bg-green-500/15 text-green-400 border-green-500/30", icon: ThumbsUp, text: "Positive" },
  neutral: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Minus, text: "Neutral" },
  negative: { color: "bg-red-500/15 text-red-400 border-red-500/30", icon: ThumbsDown, text: "Negative" },
};

const scoreColor = (score: number) => {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
};

export const FeedbackCard = ({ taskId, onSubmitted }: FeedbackCardProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResponse | null>(null);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Write a line or two first.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.submitFeedback(trimmed, taskId);
      setResult(response);
      onSubmitted?.(response);
      toast.success(`Scored ${response.score}/10 (${response.label})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to score feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText("");
    setResult(null);
  };

  const labelMeta = result ? LABEL_META[result.label] : null;
  const LabelIcon = labelMeta?.icon;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="w-5 h-5 text-primary" />
          How did we do?
        </CardTitle>
        <CardDescription>
          Drop a quick note about the notes, quiz or audio — our little model will read it and
          give it a 1–10.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Honestly — was it useful? What flopped?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={4}
          disabled={loading}
          className="resize-none"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{text.length} / 1000</span>
          {result && (
            <button onClick={handleReset} className="text-primary hover:underline" type="button">
              Clear and try another
            </button>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={loading || !text.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scoring...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Score it
            </>
          )}
        </Button>

        {result && labelMeta && LabelIcon && (
          <div className="rounded-lg border border-border/60 bg-card/50 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`${labelMeta.color} text-sm`}>
                <LabelIcon className="w-3.5 h-3.5 mr-1" />
                {labelMeta.text}
              </Badge>
              <div className={`text-3xl font-bold ${scoreColor(result.score)}`}>
                {result.score}
                <span className="text-base text-muted-foreground font-normal">/10</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Model confidence</span>
                <span>{Math.round(result.confidence * 100)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {(Object.keys(result.probabilities) as FeedbackLabel[]).map((key) => (
                <div key={key} className="bg-muted/40 rounded p-2 text-center">
                  <div className="text-muted-foreground capitalize">{key}</div>
                  <div className="font-mono font-semibold">
                    {(result.probabilities[key] * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
