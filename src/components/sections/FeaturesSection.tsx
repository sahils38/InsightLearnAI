import { FileText, Headphones, Brain, Sparkles, Clock, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Smart Text Notes",
    description: "AI extracts key concepts, creates structured summaries with headings and bullet points.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Headphones className="w-6 h-6" />,
    title: "Voice Summaries",
    description: "Convert notes to natural-sounding audio for on-the-go learning and revision.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Interactive Quizzes",
    description: "Auto-generated questions with multiple choice and short answers to test your knowledge.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Powered",
    description: "Advanced language models ensure accurate transcription and intelligent summarization.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Save Hours",
    description: "Process hour-long lectures in minutes. Focus on learning, not note-taking.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "Export Anywhere",
    description: "Download notes as PDF, voice summaries as MP3, and share with classmates.",
    color: "from-indigo-500 to-violet-500",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The bits that
            <span className="text-gradient"> actually help</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We pull notes, a voice version and a quiz out of your lecture so you don't have to sit through it twice.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-white">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
