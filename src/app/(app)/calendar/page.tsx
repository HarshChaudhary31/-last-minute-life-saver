"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Link2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

interface FreeSlot {
  start: string;
  end: string;
}

export default function CalendarPage() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [calRes, slotsRes] = await Promise.all([
          fetch("/api/calendar"),
          fetch("/api/schedule"),
        ]);
        const calData = await calRes.json();
        const slotsData = await slotsRes.json();

        setConnected(calData.connected);
        setEvents(calData.events ?? []);
        setFreeSlots(slotsData.slots ?? []);
      } catch {
        toast.error("Failed to load calendar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function connectCalendar() {
    window.location.href = "/api/calendar/callback";
  }

  async function autoSchedule() {
    try {
      const tasksRes = await fetch("/api/tasks?status=PENDING");
      const { tasks } = await tasksRes.json();
      if (!tasks?.length) {
        toast.info("No pending tasks to schedule");
        return;
      }

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: tasks[0].id }),
      });

      if (res.ok) {
        toast.success("Task scheduled in free calendar slots!");
      }
    } catch {
      toast.error("Failed to schedule");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="mt-1 text-muted-foreground">
          Smart scheduling with Google Calendar integration
        </p>
      </motion.div>

      {!connected ? (
        <Card className="glass border-white/10">
          <CardContent className="flex flex-col items-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">Connect Google Calendar</h3>
            <p className="mb-6 text-center text-sm text-muted-foreground max-w-md">
              Connect your calendar to enable smart scheduling, free slot detection,
              and automatic task session planning.
            </p>
            <Button onClick={connectCalendar} className="gap-2">
              <Link2 className="h-4 w-4" />
              Connect Google Calendar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today&apos;s Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No events today</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.start)} – {formatDateTime(event.end)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  Free Slots
                </CardTitle>
                <Button size="sm" variant="outline" onClick={autoSchedule}>
                  Auto-Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {freeSlots.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No free slots detected</p>
              ) : (
                <div className="space-y-2">
                  {freeSlots.slice(0, 8).map((slot, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-sm">
                      <span className="text-emerald-400">Available</span>
                      <span className="text-muted-foreground">
                        {formatDateTime(slot.start)} – {formatDateTime(slot.end)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
