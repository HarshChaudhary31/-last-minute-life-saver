import { generateProductivityInsights } from "@/lib/ai/task-breakdown";
import prisma from "@/lib/prisma/client";
import type { ProductivityInsight } from "@/types";
import type { InsightType } from "@prisma/client";

export async function analyzeProductivity(userId: string): Promise<ProductivityInsight> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: {
        where: { status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        take: 30,
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const completedTasks = user.tasks.length;
  const avgCompletionTime =
    completedTasks > 0
      ? user.tasks.reduce((sum, t) => sum + t.estimatedHours, 0) / completedTasks
      : 1;

  const insights = await generateProductivityInsights(
    completedTasks,
    avgCompletionTime,
    user.streak,
    user.focusHours
  );

  await saveInsights(userId, insights);

  return insights;
}

async function saveInsights(userId: string, insights: ProductivityInsight) {
  const entries: { content: string; type: InsightType }[] = [
    { content: `Best working hours: ${insights.bestWorkingHours}`, type: "PRODUCTIVITY" },
    { content: insights.completionTrends, type: "COMPLETION" },
    ...insights.procrastinationPatterns.map((p) => ({
      content: p,
      type: "PROCRASTINATION" as InsightType,
    })),
    ...insights.recommendations.map((r) => ({
      content: r,
      type: "RECOMMENDATION" as InsightType,
    })),
  ];

  await prisma.insight.createMany({
    data: entries.map((e) => ({ userId, ...e })),
  });

  await prisma.user.update({
    where: { id: userId },
    data: { productivityScore: insights.weeklyScore },
  });
}

export async function getWeeklyProductivityData(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      updatedAt: { gte: weekAgo },
    },
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const data = days.map((day) => {
    const dayIndex = days.indexOf(day);
    const completed = tasks.filter((t) => {
      if (t.status !== "COMPLETED") return false;
      return t.updatedAt.getDay() === dayIndex;
    }).length;
    const planned = tasks.filter((t) => t.createdAt.getDay() === dayIndex).length;
    return { day, completed, planned: Math.max(planned, completed) };
  });

  return data;
}

export async function updateGamification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: { where: { status: "COMPLETED" } },
    },
  });

  if (!user) return;

  const badges = [...user.badges];
  const tasksCompleted = user.tasks.length;

  if (tasksCompleted >= 10 && !badges.includes("deadline_hero")) {
    badges.push("deadline_hero");
  }
  if (user.focusHours >= 20 && !badges.includes("focus_master")) {
    badges.push("focus_master");
  }
  if (user.streak >= 7 && !badges.includes("consistency_champion")) {
    badges.push("consistency_champion");
  }

  const productivityScore = Math.min(
    100,
    Math.round(tasksCompleted * 3 + user.streak * 5 + user.focusHours * 2)
  );

  await prisma.user.update({
    where: { id: userId },
    data: { badges, productivityScore, tasksCompleted },
  });
}
