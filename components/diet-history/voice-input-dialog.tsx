"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

//libs
import { cn } from "@/lib/utils";

//components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type VoiceState = "idle" | "listening" | "done" | "unsupported";

interface VoiceInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (text: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any;

const HOLD_THRESHOLD_MS = 300;

const getSpeechRecognition = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
};

export const VoiceInputDialog = ({
  open,
  onOpenChange,
  onApply,
}: VoiceInputDialogProps) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const holdStartTimeRef = useRef<number>(0);
  // tracks latest interim text so onend can salvage it if no isFinal result arrives (mobile quirk)
  const interimRef = useRef("");

  const startListening = () => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setVoiceState("unsupported");
      return;
    }
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pl-PL";
    recognition.interimResults = true;
    recognition.continuous = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        interimRef.current = "";
        setTranscript((prev) => prev + final);
        setInterimTranscript("");
      } else {
        interimRef.current = interim;
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      // on mobile, onend can fire before the final isFinal result — salvage interim if needed
      const salvaged = interimRef.current;
      interimRef.current = "";
      setInterimTranscript("");
      if (salvaged) {
        setTranscript((prev) => prev + salvaged);
      }
      setVoiceState((prev) => (prev === "listening" ? "done" : prev));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setInterimTranscript("");
      if (event.error === "no-speech") {
        setErrorMessage("No speech detected — try again");
        setVoiceState("idle");
      } else if (event.error === "not-allowed") {
        setErrorMessage(
          "Microphone access denied. Allow microphone in browser settings."
        );
        setVoiceState("unsupported");
      } else {
        setVoiceState("idle");
      }
    };

    recognitionRef.current = recognition;
    interimRef.current = "";
    recognition.start();
    setTranscript("");
    setInterimTranscript("");
    setErrorMessage(null);
    setVoiceState("listening");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const handlePointerDown = () => {
    if (voiceState === "listening") {
      stopListening();
      return;
    }
    holdStartTimeRef.current = Date.now();
    startListening();
  };

  const handlePointerUp = () => {
    const elapsed = Date.now() - holdStartTimeRef.current;
    if (elapsed >= HOLD_THRESHOLD_MS && voiceState === "listening") {
      stopListening();
    }
    // short tap: leave recording running (toggle mode — user taps again to stop)
  };

  const handleTryAgain = () => {
    setTranscript("");
    setErrorMessage(null);
    setVoiceState("idle");
  };

  const handleApply = () => {
    onApply(transcript.trim());
    handleOpenChange(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      interimRef.current = "";
      setVoiceState("idle");
      setTranscript("");
      setInterimTranscript("");
      setErrorMessage(null);
    }
    onOpenChange(value);
  };

  useEffect(() => {
    if (open && !getSpeechRecognition()) {
      setVoiceState("unsupported");
    }
  }, [open]);

  const displayText = transcript + interimTranscript;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Voice input</DialogTitle>
        </DialogHeader>

        {voiceState === "unsupported" && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              {errorMessage ??
                "Voice input is not supported in this browser. Try Chrome or Edge."}
            </p>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        )}

        {(voiceState === "idle" || voiceState === "listening") && (
          <div className="flex flex-col items-center gap-4 py-2 select-none">
            {voiceState === "listening" && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-element animate-pulse" />
                <span className="text-sm font-medium text-primary-element">
                  Recording...
                </span>
              </div>
            )}

            <div className="min-h-[60px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
              {displayText ? (
                <span className="text-foreground">{displayText}</span>
              ) : (
                <span className="text-muted-foreground">
                  {voiceState === "listening"
                    ? "Listening…"
                    : "Press and hold or click once…"}
                </span>
              )}
            </div>

            {errorMessage && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}

            <button
              type="button"
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition-all select-none touch-manipulation",
                voiceState === "listening"
                  ? "bg-primary-element shadow-[0_0_0_12px_rgba(153,43,255,0.15),0_0_0_24px_rgba(153,43,255,0.07)]"
                  : "border-2 border-input bg-background hover:border-primary-element"
              )}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Mic
                className={cn(
                  "h-6 w-6",
                  voiceState === "listening"
                    ? "text-white"
                    : "text-muted-foreground"
                )}
              />
            </button>

            <p className="text-xs text-muted-foreground">
              {voiceState === "listening"
                ? "Release or click to stop"
                : "Press and hold or click once"}
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {voiceState === "done" && (
          <div className="flex flex-col gap-3 py-2 select-none">
            <p className="text-xs text-muted-foreground">Correct if needed:</p>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y select-text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <div className="flex items-center justify-center">
              <button
                type="button"
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleTryAgain}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-input hover:border-primary-element transition-colors">
                  <Mic className="h-4 w-4" />
                </span>
                <span className="text-xs">Try again</span>
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleApply}
                disabled={!transcript.trim()}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
