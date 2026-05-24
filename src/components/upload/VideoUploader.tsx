import { useState, useCallback } from "react";
import { Upload, Video, X, FileVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface VideoUploaderProps {
  onUploadComplete: (taskId: string) => void;
  isProcessing: boolean;
}

export const VideoUploader = ({ onUploadComplete, isProcessing }: VideoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("That one's a bit big — keep it under 500 MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10 + 5;
      });
    }, 200);

    try {
      const response = await api.uploadVideo(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadedFile(file);

      toast.success("Got it. Working on it now…");

      // Start processing immediately
      onUploadComplete(response.task_id);

    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(`Upload error: ${message}`);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      {!uploadedFile && !isUploading ? (
        <Card
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed transition-all duration-300 cursor-pointer",
                isDragging
                  ? "border-accent bg-accent/5 scale-[1.02]"
                  : "border-border hover:border-accent/50 hover:bg-card/50"
              )}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary mx-auto mb-6 flex items-center justify-center">
                  <Upload className={cn(
                    "w-10 h-10 transition-all duration-300",
                    isDragging ? "text-accent scale-110" : "text-muted-foreground"
                  )} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {isDragging ? "Yep, right here" : "Drop your lecture in"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click anywhere to pick a file
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Video className="w-4 h-4" />
                  <span>MP4, AVI, MOV or MKV — up to 500 MB</span>
                </div>
              </div>
            </Card>
          ) : isUploading ? (
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileVideo className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Uploading…</p>
                  <p className="text-sm text-muted-foreground">Hang tight a sec</p>
                </div>
              </div>
              <Progress value={Math.min(uploadProgress, 100)} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-right">
                {Math.min(Math.round(uploadProgress), 100)}%
              </p>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileVideo className="w-7 h-7 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {uploadedFile?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile?.size || 0)} • on it
                  </p>
                </div>
                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Crunching through your lecture…</span>
                </div>
              )}
            </Card>
      )}
    </div>
  );
};
