import { getOrCreateUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { generateDailyPlan } from "@/lib/ai/task-breakdown";
import { getWeeklyProductivityData } from "@/lib/ai/productivity-coach";
import { getRescuePlanForTask, isRescueMode } from "@/lib/ai/rescue-mode";
import { getCalendarEvents, isCalendarConnected } from "@/lib/calendar/google-calendar";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await getOrCreateUser();

  if (!user) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    include: {
      subTasks: { orderBy: { order: "asc" } },
      schedules: { orderBy: { startTime: "asc" } },
    },
    orderBy: [{ riskScore: "desc" }, { deadline: "asc" }],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = tasks.filter(
    (t) =>
      t.status !== "COMPLETED" &&
      t.status !== "CANCELLED" &&
      (!t.deadline || t.deadline <= tomorrow)
  );

  const upcomingTasks = tasks
    .filter((t) => t.status !== "COMPLETED" && t.deadline && t.deadline > tomorrow)
    .slice(0, 5);

  const atRiskTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && isRescueMode(t.riskScore)
  );

  const dailyPlan = await generateDailyPlan(
    tasks
      .filter((t) => t.status !== "COMPLETED")
      .map((t) => ({
        title: t.title,
        deadline: t.deadline,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
      }))
  );

  const weeklyData = await getWeeklyProductivityData(user.id);

  const insights = await prisma.insight.findMany({
    where: { userId: user.id, type: "RECOMMENDATION" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  let rescueData = null;
  if (atRiskTasks.length > 0) {
    const plan = await getRescuePlanForTask(atRiskTasks[0].id);
    if (plan) {
      rescueData = {
        taskTitle: atRiskTasks[0].title,
        riskScore: atRiskTasks[0].riskScore,
        plan,
      };
    }
  }

  const gamificationStats = {
    productivityScore: user.productivityScore,
    streak: user.streak,
    focusHours: user.focusHours,
    tasksCompleted: user.tasksCompleted,
    badges: user.badges,
  };

  const calendarConnected = await isCalendarConnected(user.id);
  const calendarEvents = calendarConnected
    ? (await getCalendarEvents(user.id)).map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
      }))
    : [];

  return (
    <DashboardClient
      userName={user.name ?? "there"}
      todayTasks={todayTasks}
      upcomingTasks={upcomingTasks}
      atRiskTasks={atRiskTasks}
      dailyPlan={dailyPlan}
      weeklyData={weeklyData}
      recommendations={insights.map((i) => i.content)}
      rescueData={rescueData}
      gamificationStats={gamificationStats}
      calendarEvents={calendarEvents}
      calendarConnected={calendarConnected}
    />
  );
}
