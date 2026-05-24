import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, FeedbackLabel, FeedbackStats } from "@/lib/api";

interface FeedbackAnalyticsProps {
  refreshKey?: number;
}

const labelColor: Record<FeedbackLabel, string> = {
  positive: "#22c55e",
  neutral: "#eab308",
  negative: "#ef4444",
};

const scoreColor = (score: number) => {
  if (score >= 8) return labelColor.positive;
  if (score >= 5) return labelColor.neutral;
  return labelColor.negative;
};

export const FeedbackAnalytics = ({ refreshKey = 0 }: FeedbackAnalyticsProps) => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFeedbackStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const chartData =
    stats?.recent
      .slice()
      .reverse() // chronological order: oldest first
      .map((item, idx) => ({
        idx: idx + 1,
        score: item.score,
        label: item.label,
        text: item.text.length > 40 ? item.text.slice(0, 40) + "…" : item.text,
      })) ?? [];

  const totalForPct = stats?.total ?? 0;
  const pct = (n?: number) => (totalForPct === 0 ? 0 : Math.round(((n ?? 0) / totalForPct) * 100));

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-5 h-5 text-primary" />
            Feedback Analytics
          </CardTitle>
          <CardDescription>
            Live stats from the trained sentiment model — refreshes after every submission.
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !stats || stats.total === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No feedback yet. Submit one above to see analytics.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <div className="text-xs text-muted-foreground">Avg score</div>
                <div className="text-2xl font-bold" style={{ color: scoreColor(stats.avg_score) }}>
                  {stats.avg_score.toFixed(1)}
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <div className="text-xs text-muted-foreground">Positive</div>
                <div className="text-2xl font-bold" style={{ color: labelColor.positive }}>
                  {pct(stats.label_counts.positive)}%
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <div className="text-xs text-muted-foreground">Negative</div>
                <div className="text-2xl font-bold" style={{ color: labelColor.negative }}>
                  {pct(stats.label_counts.negative)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2 text-muted-foreground">
                Last {chartData.length} feedback score{chartData.length === 1 ? "" : "s"}
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                    <XAxis dataKey="idx" tick={{ fontSize: 11 }} stroke="#888" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="#888" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(label) => `#${label}`}
                      formatter={(value: number, _name, props) => [
                        `${value}/10 (${props.payload.label})`,
                        props.payload.text,
                      ]}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={scoreColor(d.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2 text-muted-foreground">Most recent</div>
              <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {stats.recent.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm bg-muted/30 rounded px-3 py-2"
                  >
                    <span
                      className="font-mono font-semibold w-8 text-right"
                      style={{ color: scoreColor(item.score) }}
                    >
                      {item.score}
                    </span>
                    <span className="flex-1 truncate text-muted-foreground">{item.text}</span>
                    <span
                      className="text-xs uppercase tracking-wider"
                      style={{ color: labelColor[item.label] }}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
