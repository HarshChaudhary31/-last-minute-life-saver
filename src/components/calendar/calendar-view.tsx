"use client";

import { motion } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  connected?: boolean;
}

export function CalendarView({ events, connected = false }: CalendarViewProps) {
  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Calendar View
          {!connected && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Not connected
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!connected ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Connect Google Calendar to see events
          </p>
        ) : events.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No events today
          </p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm"
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(event.start)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
