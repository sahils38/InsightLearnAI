import { Upload, Cpu, FileCheck, GraduationCap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <Upload className="w-6 h-6" />,
    title: "Upload Video",
    description: "Drag and drop your lecture video or browse to select. We support MP4, AVI, MOV and more.",
  },
  {
    number: "02",
    icon: <Cpu className="w-6 h-6" />,
    title: "AI Processing",
    description: "Our AI transcribes, analyzes, and extracts key information from your lecture content.",
  },
  {
    number: "03",
    icon: <FileCheck className="w-6 h-6" />,
    title: "Get Results",
    description: "Receive structured notes, voice summaries, and interactive quizzes in minutes.",
  },
  {
    number: "04",
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Study & Excel",
    description: "Use your personalized study materials to learn effectively and ace your exams.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your lectures into study materials in four simple steps.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent hidden lg:block" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Step number badge */}
                <div className="absolute -top-3 left-6 px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow-md">
                  Step {step.number}
                </div>

                <div className="bg-card rounded-2xl border border-border/50 p-6 pt-8 h-full shadow-sm group-hover:shadow-lg group-hover:border-accent/30 transition-all duration-300">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors duration-300">
                    <span className="text-accent">{step.icon}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="absolute top-1/2 -right-4 hidden lg:block">
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                      <div className="w-0 h-0 border-l-4 border-l-accent border-y-4 border-y-transparent" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
