import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { VideoUploader } from "@/components/upload/VideoUploader";
import { ProcessingState } from "@/components/results/ProcessingState";
import { ResultsSection } from "@/components/results/ResultsSection";
import { ProcessingError } from "@/components/results/ProcessingError";
import { FeedbackSection } from "@/components/feedback/FeedbackSection";
import { SessionReport } from "@/components/feedback/SessionReport";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { demoAudioUrl, demoNotes, demoQuiz, demoTaskId } from "@/lib/demoSession";
import type { QuizResult } from "@/components/results/QuizInterface";
import { api, NoteSection, QuizQuestion } from "@/lib/api";
import { toast } from "sonner";

type AppState = "idle" | "processing" | "complete" | "error";

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "complete";
}

const initialProcessingSteps: ProcessingStep[] = [
  {
    id: "extract",
    title: "Extracting Audio",
    description: "Separating audio track from video file",
    status: "pending",
  },
  {
    id: "transcribe",
    title: "Transcribing Speech",
    description: "Converting speech to text using AI",
    status: "pending",
  },
  {
    id: "summarize",
    title: "Generating Notes",
    description: "Creating structured summaries and key points",
    status: "pending",
  },
  {
    id: "voice",
    title: "Creating Voice Notes",
    description: "Converting notes to natural speech audio",
    status: "pending",
  },
  {
    id: "quiz",
    title: "Building Quiz",
    description: "Generating questions based on lecture content",
    status: "pending",
  },
];

// Map backend status to step index
const statusToStepIndex: Record<string, number> = {
  pending: -1,
  extracting_audio: 0,
  transcribing: 1,
  generating_notes: 2,
  creating_voice: 3,
  building_quiz: 4,
  completed: 5,
  failed: -1,
};

interface Results {
  notes: NoteSection[];
  quiz: QuizQuestion[];
  audioUrl: string;
}

const AppPage = () => {
  const [appState, setAppState] = useState<AppState>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>(initialProcessingSteps);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Session engagement signals (live during the "complete" state)
  const [notesSeconds, setNotesSeconds] = useState(0);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | undefined>(undefined);

  // Failure details (live during the "error" state)
  const [errorInfo, setErrorInfo] = useState<{ failedStep?: string | null; error?: string | null }>({});

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleUploadComplete = (newTaskId: string) => {
    setTaskId(newTaskId);
    setAppState("processing");
    setCurrentStep(0);
    setSteps(initialProcessingSteps.map((s) => ({ ...s, status: "pending" })));

    // Start polling for status
    startPolling(newTaskId);
  };

  const startPolling = (taskIdToCheck: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const pollStatus = async () => {
      try {
        const status = await api.getStatus(taskIdToCheck);

        const stepIndex = statusToStepIndex[status.status] ?? -1;

        // Update steps based on current status
        setSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i < stepIndex ? "complete" : i === stepIndex ? "processing" : "pending",
          }))
        );
        setCurrentStep(Math.max(0, stepIndex));

        // Check if completed
        if (status.status === "completed") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Mark all steps as complete
          setSteps((prev) => prev.map((s) => ({ ...s, status: "complete" })));

          // Fetch results
          const resultsData = await api.getResults(taskIdToCheck);
          setResults({
            notes: resultsData.notes,
            quiz: resultsData.quiz,
            audioUrl: api.getAudioUrl(taskIdToCheck),
          });

          setAppState("complete");
          toast.success("All set — your notes, audio and quiz are ready below.");
        }

        // Check if failed
        if (status.status === "failed") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setErrorInfo({ failedStep: status.failed_step, error: status.error });
          const shortMsg = status.failed_step
            ? `Failed at step ${status.failed_step}`
            : "Processing failed";
          toast.error(shortMsg, { description: status.error ?? undefined });
          setAppState("error");
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Don't show error toast for every poll failure - server might be busy processing
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 2 seconds
    pollingRef.current = setInterval(pollStatus, 2000);
  };

  const handleStartOver = () => {
    // Cleanup old task (skip for demo since there's no backend task)
    if (taskId && taskId !== demoTaskId) {
      api.deleteTask(taskId).catch(console.error);
    }

    setAppState("idle");
    setTaskId(null);
    setResults(null);
    setSteps(initialProcessingSteps.map((s) => ({ ...s, status: "pending" })));
    setNotesSeconds(0);
    setAudioSeconds(0);
    setQuizResult(undefined);
  };

  const handleTryAgain = () => {
    if (taskId && taskId !== demoTaskId) {
      api.deleteTask(taskId).catch(console.error);
    }
    setTaskId(null);
    setErrorInfo({});
    setSteps(initialProcessingSteps.map((s) => ({ ...s, status: "pending" })));
    setAppState("idle");
  };

  const handleLoadDemo = () => {
    setTaskId(demoTaskId);
    setResults({
      notes: demoNotes,
      quiz: demoQuiz,
      audioUrl: demoAudioUrl,
    });
    setNotesSeconds(0);
    setAudioSeconds(0);
    setQuizResult(undefined);
    setAppState("complete");
    toast.success("Demo loaded. Have a click around — quiz, audio, then the report at the bottom.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {appState === "idle" && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Turn that <span className="text-gradient">2-hour lecture</span> into 10 minutes
                </h1>
                <p className="text-lg text-muted-foreground">
                  Drop a recording in. Walk away with notes you can actually study from,
                  a voice version for the commute, and a quiz to test if any of it stuck.
                </p>
              </div>
              <VideoUploader onUploadComplete={handleUploadComplete} isProcessing={false} />
              <div className="mt-6 flex flex-col items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  No lecture handy?
                </span>
                <Button
                  variant="outline"
                  onClick={handleLoadDemo}
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  <Sparkles className="w-4 h-4" />
                  Take a quick tour
                </Button>
                <span className="text-xs text-muted-foreground">
                  Loads a sample so you can poke around without uploading anything.
                </span>
              </div>
            </div>
          )}

          {appState === "processing" && (
            <ProcessingState steps={steps} currentStep={currentStep} />
          )}

          {appState === "error" && (
            <ProcessingError
              failedStep={errorInfo.failedStep}
              error={errorInfo.error}
              onTryAgain={handleTryAgain}
              onUseDemo={handleLoadDemo}
            />
          )}

          {appState === "complete" && results && (
            <>
              <ResultsSection
                notes={results.notes}
                quiz={results.quiz}
                audioUrl={results.audioUrl}
                onStartOver={handleStartOver}
                onNotesTimeUpdate={setNotesSeconds}
                onAudioListenUpdate={setAudioSeconds}
                onQuizComplete={setQuizResult}
              />
              <div className="max-w-4xl mx-auto mt-12">
                <SessionReport
                  taskId={taskId ?? undefined}
                  notesSeconds={notesSeconds}
                  audioSeconds={audioSeconds}
                  quizResult={quizResult}
                />
              </div>
            </>
          )}
        </div>

        {appState === "idle" && (
          <FeedbackSection taskId={taskId ?? undefined} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AppPage;
