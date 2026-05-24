import { useState } from "react";
import { FeedbackCard } from "./FeedbackCard";
import { FeedbackAnalytics } from "./FeedbackAnalytics";

interface FeedbackSectionProps {
  taskId?: string;
}

export const FeedbackSection = ({ taskId }: FeedbackSectionProps) => {
  // bump this on every successful submission to refetch analytics
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Rate Your <span className="text-gradient">Experience</span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          <FeedbackCard taskId={taskId} onSubmitted={() => setRefreshKey((k) => k + 1)} />
          <FeedbackAnalytics refreshKey={refreshKey} />
        </div>
      </div>
    </section>
  );
};
