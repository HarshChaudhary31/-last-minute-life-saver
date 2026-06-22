"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TaskCreator } from "@/components/tasks/task-creator";
import { TaskList } from "@/components/dashboard/task-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import type { TaskWithRelations } from "@/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const pending = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const atRisk = pending.filter((t) => t.riskScore >= 60);

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
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          Manage and track all your tasks
        </p>
      </motion.div>

      <TaskCreator onTaskCreated={fetchTasks} />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({pending.length})</TabsTrigger>
          <TabsTrigger value="at-risk">At Risk ({atRisk.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <TaskList tasks={pending} showRisk emptyMessage="No active tasks" />
        </TabsContent>
        <TabsContent value="at-risk" className="mt-4">
          <TaskList tasks={atRisk} showRisk emptyMessage="No at-risk tasks — great job!" />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <TaskList tasks={completed} emptyMessage="No completed tasks yet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
