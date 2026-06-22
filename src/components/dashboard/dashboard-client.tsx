"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TaskCreator } from "@/components/tasks/task-creator";
import { TaskList } from "@/components/dashboard/task-list";
import { DailyPlanPanel } from "@/components/dashboard/daily-plan";
import { WeeklyProgressChart } from "@/components/dashboard/weekly-progress";
import { GamificationPanel } from "@/components/dashboard/gamification-panel";
import { RescueModePanel } from "@/components/dashboard/rescue-mode";
import { NotificationPermission } from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { TaskWithRelations, DailyPlan, WeeklyProgress, GamificationStats, RescuePlan } from "@/types";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

interface DashboardClientProps {
  userName: string;
  todayTasks: TaskWithRelations[];
  upcomingTasks: TaskWithRelations[];
  atRiskTasks: TaskWithRelations[];
  dailyPlan: DailyPlan;
  weeklyData: WeeklyProgress[];
  recommendations: string[];
  rescueData: { taskTitle: string; riskScore: number; plan: RescuePlan } | null;
  gamificationStats: GamificationStats;
  calendarEvents: CalendarEvent[];
  calendarConnected: boolean;
}

export function DashboardClient({
  userName,
  todayTasks,
  upcomingTasks,
  atRiskTasks,
  dailyPlan,
  weeklyData,
  recommendations,
  rescueData,
  gamificationStats,
  calendarEvents,
  calendarConnected,
}: DashboardClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <NotificationPermission />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Good {getGreeting()}, {userName.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {todayTasks.length} tasks need your attention today
          {atRiskTasks.length > 0 && (
            <span className="text-red-400"> · {atRiskTasks.length} at risk</span>
          )}
        </p>
      </motion.div>

      {rescueData && (
        <RescueModePanel
          taskTitle={rescueData.taskTitle}
          riskScore={rescueData.riskScore}
          plan={rescueData.plan}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TaskCreator onTaskCreated={() => setRefreshKey((k) => k + 1)} key={refreshKey} />

          <div className="grid gap-6 md:grid-cols-2">
            <TaskList
              tasks={todayTasks}
              title="Today's Tasks"
              showRisk
              emptyMessage="No tasks for today — add one above!"
            />
            <TaskList
              tasks={upcomingTasks}
              title="Upcoming Deadlines"
              showRisk
              emptyMessage="No upcoming deadlines"
            />
          </div>

          <WeeklyProgressChart data={weeklyData} />
          <CalendarView events={calendarEvents} connected={calendarConnected} />
        </div>

        <div className="space-y-6">
          <DailyPlanPanel plan={dailyPlan} />
          <GamificationPanel stats={gamificationStats} />

          {atRiskTasks.length > 0 && !rescueData && (
            <Card className="glass border-orange-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {atRiskTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="rounded-lg bg-orange-500/10 px-3 py-2 text-sm">
                    <span className="font-medium">{task.title}</span>
                    <span className="ml-2 text-orange-400">Risk: {task.riskScore}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations.map((rec, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    • {rec}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
