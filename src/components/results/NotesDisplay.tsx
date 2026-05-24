import { FileText, Download, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useTimeOnTab } from "@/hooks/useTimeOnTab";

interface NotesDisplayProps {
  notes: {
    title: string;
    summary: string;
    sections: {
      heading: string;
      content: string[];
    }[];
    keyPoints: string[];
  };
  onTimeUpdate?: (totalSeconds: number) => void;
}

export const NotesDisplay = ({ notes, onTimeUpdate }: NotesDisplayProps) => {
  const [copied, setCopied] = useState(false);

  // Tracks active wall-clock seconds while this component is mounted, visible, focused.
  useTimeOnTab(true, (total) => onTimeUpdate?.(total));

  const handleCopy = () => {
    const textContent = `${notes.title}\n\n${notes.summary}\n\n${notes.sections
      .map((s) => `${s.heading}\n${s.content.map((c) => `• ${c}`).join("\n")}`)
      .join("\n\n")}\n\nKey Points:\n${notes.keyPoints.map((k) => `• ${k}`).join("\n")}`;

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success("Copied — paste them wherever you study.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textContent = `${notes.title}\n\n${notes.summary}\n\n${notes.sections
      .map((s) => `${s.heading}\n${s.content.map((c) => `• ${c}`).join("\n")}`)
      .join("\n\n")}\n\nKey Points:\n${notes.keyPoints.map((k) => `• ${k}`).join("\n")}`;

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecture-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Saved to your downloads.");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-gradient-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <CardTitle>Text Notes</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <CheckCheck className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 max-h-[500px] overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">{notes.title}</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">{notes.summary}</p>

        {notes.sections.map((section, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {section.heading}
            </h3>
            <ul className="space-y-2 ml-4">
              {section.content.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="text-muted-foreground text-sm leading-relaxed flex items-start gap-2"
                >
                  <span className="text-accent mt-1.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-8 p-4 rounded-xl bg-accent/5 border border-accent/20">
          <h3 className="text-lg font-semibold text-foreground mb-3">🔑 Key Takeaways</h3>
          <ul className="space-y-2">
            {notes.keyPoints.map((point, index) => (
              <li key={index} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-accent font-bold">{index + 1}.</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
