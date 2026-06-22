"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInput } from "@/components/voice/voice-input";
import { toast } from "sonner";

interface TaskCreatorProps {
  onTaskCreated?: () => void;
}

export function TaskCreator({ onTaskCreated }: TaskCreatorProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      const data = await res.json();
      toast.success(`Task created: ${data.task.title}`);
      setInput("");
      router.refresh();
      onTaskCreated?.();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  function handleVoiceTranscript(text: string) {
    setInput(text);
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Task with AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder='Try: "Submit internship application next Friday" or "Pay electricity bill before the 10th"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading || !input.trim()} className="flex-1">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Task
                </>
              )}
            </Button>
            <VoiceInput onTranscript={handleVoiceTranscript} />
          </div>
        </form>

        <AnimatePresence>
          {input && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 text-xs text-muted-foreground"
            >
              AI will extract title, deadline, priority, effort, and category automatically.
            </motion.p>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
