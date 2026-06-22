"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          onTranscript(transcript);
          toast.success("Voice captured!");
          setListening(false);
        };

        rec.onerror = () => {
          toast.error("Voice recognition failed");
          setListening(false);
        };

        rec.onend = () => setListening(false);
        setRecognition(rec);
      }
    }
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
      toast.info("Listening...");
    }
  }, [recognition, listening]);

  if (!supported) {
    return (
      <Button type="button" variant="outline" size="icon" disabled title="Voice not supported">
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={listening ? "default" : "outline"}
      size="icon"
      onClick={toggleListening}
      className={listening ? "animate-pulse" : ""}
    >
      {listening ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
