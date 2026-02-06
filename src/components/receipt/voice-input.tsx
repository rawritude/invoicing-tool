"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  currentFields: Record<string, unknown>;
  onFieldsUpdated: (fields: Record<string, unknown>) => void;
}

export function VoiceInput({ currentFields, onFieldsUpdated }: VoiceInputProps) {
  const { isRecording, startRecording, stopRecording, error } = useAudioRecorder();
  const [processing, setProcessing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  async function handleToggle() {
    if (isRecording) {
      const result = await stopRecording();
      if (!result) return;

      setProcessing(true);
      setLastMessage(null);
      try {
        const res = await fetch("/api/ai/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: result.base64,
            mimeType: result.mimeType,
            currentFields,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.updatedFields && Object.keys(data.updatedFields).length > 0) {
            onFieldsUpdated(data.updatedFields);
            const fieldNames = Object.keys(data.updatedFields).join(", ");
            setLastMessage(`Updated: ${fieldNames}`);
          } else {
            setLastMessage("No changes detected");
          }
        } else {
          const data = await res.json();
          setLastMessage(data.error || "Voice processing failed");
        }
      } catch {
        setLastMessage("Voice processing failed");
      } finally {
        setProcessing(false);
      }
    } else {
      await startRecording();
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="lg"
        onClick={handleToggle}
        disabled={processing}
        className={cn(
          "gap-2",
          isRecording && "animate-pulse"
        )}
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <MicOff className="h-5 w-5" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            Voice Input
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {lastMessage && <p className="text-sm text-muted-foreground">{lastMessage}</p>}
    </div>
  );
}
