import { NotesDisplay } from "./NotesDisplay";
import { VoiceNotesPlayer } from "./VoiceNotesPlayer";
import { QuizInterface, QuizResult } from "./QuizInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Headphones, Brain, RotateCcw } from "lucide-react";
import { NoteSection, QuizQuestion } from "@/lib/api";

interface ResultsSectionProps {
  notes: NoteSection[];
  quiz: QuizQuestion[];
  audioUrl: string;
  onStartOver: () => void;
  onNotesTimeUpdate?: (seconds: number) => void;
  onAudioListenUpdate?: (seconds: number) => void;
  onQuizComplete?: (result: QuizResult) => void;
}

export const ResultsSection = ({
  notes,
  quiz,
  audioUrl,
  onStartOver,
  onNotesTimeUpdate,
  onAudioListenUpdate,
  onQuizComplete,
}: ResultsSectionProps) => {
  // Transform notes from API format to component format
  const transformedNotes = {
    title: notes[0]?.title || "Lecture Notes",
    summary: notes[0]?.content.join(" ") || "",
    sections: notes.slice(1, -1).map((section) => ({
      heading: section.title,
      content: section.content,
    })),
    keyPoints: notes[notes.length - 1]?.content || [],
  };

  // Transform quiz from API format to component format
  const transformedQuiz = quiz.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options.map((opt) => opt.text),
    correctAnswer: q.options.findIndex((opt) => opt.id === q.correct_answer),
    explanation: q.explanation,
  }));

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Here's your <span className="text-gradient">study pack</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Read the notes, pop in headphones for the voice version, then take the quiz to see what stuck.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-14">
              <TabsTrigger value="notes" className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Text Notes</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2 text-base">
                <Headphones className="w-4 h-4" />
                <span className="hidden sm:inline">Voice Notes</span>
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center gap-2 text-base">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Quiz</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="animate-fade-in">
              <NotesDisplay notes={transformedNotes} onTimeUpdate={onNotesTimeUpdate} />
            </TabsContent>

            <TabsContent value="voice" className="animate-fade-in">
              <VoiceNotesPlayer audioUrl={audioUrl} onListenUpdate={onAudioListenUpdate} />
            </TabsContent>

            <TabsContent value="quiz" className="animate-fade-in">
              <QuizInterface questions={transformedQuiz} onComplete={onQuizComplete} />
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={onStartOver}>
              <RotateCcw className="w-4 h-4" />
              Try another lecture
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
