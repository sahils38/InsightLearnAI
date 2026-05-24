const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface NoteSection {
  title: string;
  content: string[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  correct_answer: string;
  explanation: string;
}

export interface UploadResponse {
  task_id: string;
  message: string;
}

export interface StatusResponse {
  task_id: string;
  status: string;
  progress: number;
  current_step: string;
  error?: string | null;
  failed_step?: string | null;
}

export interface ResultsResponse {
  task_id: string;
  notes: NoteSection[];
  quiz: QuizQuestion[];
  audio_url: string;
}

export type FeedbackLabel = "positive" | "neutral" | "negative";

export interface FeedbackResponse {
  label: FeedbackLabel;
  score: number; // 1..10
  confidence: number; // 0..1
  probabilities: Record<FeedbackLabel, number>;
}

export interface FeedbackStatsItem {
  text: string;
  label: FeedbackLabel;
  score: number;
  timestamp: string;
}

export interface FeedbackStats {
  total: number;
  avg_score: number;
  label_counts: Partial<Record<FeedbackLabel, number>>;
  recent: FeedbackStatsItem[];
}

export interface SessionQuizPayload {
  correct: number;
  total: number;
  seconds: number;
}

export interface SessionReportPayload {
  text: string;
  task_id?: string;
  notes_seconds: number;
  audio_seconds: number;
  quiz?: SessionQuizPayload;
}

export interface SessionReportResponse {
  label: FeedbackLabel;
  sentiment_score: number;
  confidence: number;
  probabilities: Record<FeedbackLabel, number>;
  notes_seconds: number;
  audio_seconds: number;
  quiz?: SessionQuizPayload | null;
  breakdown: {
    sentiment: number;
    engagement: number;
    quiz: number;
    overall: number;
  };
  overall_grade: "A" | "B" | "C" | "D";
}

export const api = {
  async uploadVideo(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Upload failed");
    }

    return response.json();
  },

  async getStatus(taskId: string): Promise<StatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/status/${taskId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get status");
    }

    return response.json();
  },

  async getResults(taskId: string): Promise<ResultsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/results/${taskId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get results");
    }

    return response.json();
  },

  getAudioUrl(taskId: string): string {
    return `${API_BASE_URL}/api/audio/${taskId}`;
  },

  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/task/${taskId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete task");
    }
  },

  async submitFeedback(text: string, taskId?: string): Promise<FeedbackResponse> {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, task_id: taskId ?? null }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to score feedback");
    }

    return response.json();
  },

  async getFeedbackStats(): Promise<FeedbackStats> {
    const response = await fetch(`${API_BASE_URL}/api/feedback/stats`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to load feedback stats");
    }

    return response.json();
  },

  async submitSessionReport(payload: SessionReportPayload): Promise<SessionReportResponse> {
    const response = await fetch(`${API_BASE_URL}/api/session-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to submit session report");
    }

    return response.json();
  },
};
