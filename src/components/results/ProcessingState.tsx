import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "complete";
}

interface ProcessingStateProps {
  steps: ProcessingStep[];
  currentStep: number;
}

export const ProcessingState = ({ steps, currentStep }: ProcessingStateProps) => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <div className="bg-gradient-hero p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur mx-auto mb-4 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Processing Your Lecture
              </h2>
              <p className="text-white/70">
                This may take a few minutes depending on the video length
              </p>
            </div>

            <CardContent className="p-6">
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                      step.status === "processing" && "bg-accent/5 border border-accent/20",
                      step.status === "complete" && "bg-secondary/50"
                    )}
                  >
                    <div className="mt-0.5">
                      {step.status === "complete" ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : step.status === "processing" ? (
                        <Loader2 className="w-6 h-6 text-accent animate-spin" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-medium transition-colors duration-300",
                        step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
