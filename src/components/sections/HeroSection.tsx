import { ArrowRight, Play, FileText, Headphones, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />

      {/* Animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border/50 mb-8 animate-slide-up opacity-0">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              AI-Powered Learning Assistant
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up opacity-0 stagger-1">
            Transform Lectures into
            <span className="block text-gradient mt-2">Study-Ready Content</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up opacity-0 stagger-2">
            Upload any video lecture and instantly get comprehensive notes, voice summaries, and
            interactive quizzes. Study smarter, not harder.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up opacity-0 stagger-3">
            <Link to="/app">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="w-full sm:w-auto">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up opacity-0 stagger-4">
            <FeaturePill icon={<FileText className="w-4 h-4" />} text="Smart Notes" />
            <FeaturePill icon={<Headphones className="w-4 h-4" />} text="Voice Summaries" />
            <FeaturePill icon={<Brain className="w-4 h-4" />} text="AI Quizzes" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-accent" />
        </div>
      </div>
    </section>
  );
};

const FeaturePill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-sm">
    <span className="text-accent">{icon}</span>
    <span className="text-sm font-medium text-foreground">{text}</span>
  </div>
);
