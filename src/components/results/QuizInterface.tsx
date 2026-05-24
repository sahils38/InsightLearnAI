import { useState, useRef, useEffect } from "react";
import { Brain, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizResult {
  correct: number;
  total: number;
  seconds: number;
}

interface QuizInterfaceProps {
  questions: Question[];
  onComplete?: (result: QuizResult) => void;
}

export const QuizInterface = ({ questions, onComplete }: QuizInterfaceProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const startRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  const current = questions[currentQuestion];

  const handleSelectAnswer = (index: number) => {
    if (showResult || answeredQuestions.has(currentQuestion)) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);
    setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion));

    if (selectedAnswer === current.correctAnswer) {
      setScore((prev) => prev + 1);
      toast.success("Nailed it.");
    } else {
      toast.error("Close — peek at the explanation below.");
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      elapsedRef.current = (Date.now() - startRef.current) / 1000;
      setQuizComplete(true);
      onComplete?.({
        correct: score,
        total: questions.length,
        seconds: elapsedRef.current,
      });
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setAnsweredQuestions(new Set());
    startRef.current = Date.now();
    elapsedRef.current = 0;
  };

  const percentage = Math.round((score / questions.length) * 100);
  const formatDuration = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`;
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}m ${sec}s`;
  };

  if (quizComplete) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-amber-500" />
            </div>
            <CardTitle>Quiz Complete!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-accent mx-auto mb-6 flex items-center justify-center shadow-glow">
            <Trophy className="w-12 h-12 text-accent-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good Job!" : "Keep Practicing!"}
          </h2>
          <p className="text-4xl font-bold text-gradient mb-4">
            {score}/{questions.length}
          </p>
          <p className="text-muted-foreground mb-2">
            You scored {percentage}% on this quiz
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Clock className="w-4 h-4 text-amber-500" />
            Time taken: <span className="font-medium text-foreground">{formatDuration(elapsedRef.current)}</span>
          </div>
          <div>
            <Button variant="hero" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-gradient-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-amber-500" />
            </div>
            <CardTitle>Knowledge Quiz</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Progress bar */}
        <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-accent transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <h3 className="text-lg font-semibold text-foreground mb-6">
          {current.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {current.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = showResult && index === current.correctAnswer;
            const isWrong = showResult && isSelected && index !== current.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3",
                  !showResult && isSelected && "border-accent bg-accent/5",
                  !showResult && !isSelected && "border-border hover:border-accent/50 hover:bg-secondary/50",
                  isCorrect && "border-green-500 bg-green-500/10",
                  isWrong && "border-red-500 bg-red-500/10"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                    !showResult && isSelected && "bg-accent text-accent-foreground",
                    !showResult && !isSelected && "bg-secondary text-muted-foreground",
                    isCorrect && "bg-green-500 text-white",
                    isWrong && "bg-red-500 text-white"
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isWrong ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>
                <span className={cn(
                  "flex-1",
                  isCorrect && "text-green-700 font-medium",
                  isWrong && "text-red-700"
                )}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && (
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 mb-6 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Explanation: </span>
              {current.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!showResult ? (
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </Button>
          ) : (
            <Button variant="hero" onClick={handleNext}>
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                "See Results"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
