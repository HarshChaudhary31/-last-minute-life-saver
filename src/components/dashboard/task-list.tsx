"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, AlertCircle } from "lucide-react";
import { formatDate, getRiskColor, getPriorityColor } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

interface TaskListProps {
  tasks: TaskWithRelations[];
  title?: string;
  showRisk?: boolean;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  title = "Tasks",
  showRisk = false,
  emptyMessage = "No tasks yet",
}: TaskListProps) {
  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/tasks?id=${task.id}`}>
                  <div className="group flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3 transition-colors hover:bg-white/10">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(task.deadline)}</span>
                        <span className={`rounded px-1.5 py-0.5 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    {showRisk && task.riskScore > 0 && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${getRiskColor(task.riskScore)}`}>
                        {task.riskScore >= 80 && <AlertCircle className="h-3 w-3" />}
                        {task.riskScore}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
