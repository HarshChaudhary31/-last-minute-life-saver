import { generateRescuePlan } from "@/lib/ai/task-breakdown";
import prisma from "@/lib/prisma/client";
import type { RescuePlan } from "@/types";

const RESCUE_THRESHOLD = 80;

export function isRescueMode(riskScore: number): boolean {
  return riskScore >= RESCUE_THRESHOLD;
}

export async function getRescuePlanForTask(taskId: string): Promise<RescuePlan | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { subTasks: true },
  });

  if (!task || !isRescueMode(task.riskScore)) return null;

  const hoursRemaining = task.deadline
    ? Math.max(0, (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60))
    : 24;

  return generateRescuePlan(
    task.title,
    task.subTasks.map((s) => ({
      title: s.title,
      completed: s.completed,
      duration: s.duration,
    })),
    hoursRemaining
  );
}

export async function getAtRiskTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      riskScore: { gte: RESCUE_THRESHOLD },
    },
    include: { subTasks: true },
    orderBy: { riskScore: "desc" },
  });
}

export async function activateRescueMode(userId: string) {
  const atRiskTasks = await getAtRiskTasks(userId);
  const plans: { taskId: string; taskTitle: string; plan: RescuePlan }[] = [];

  for (const task of atRiskTasks) {
    const plan = await getRescuePlanForTask(task.id);
    if (plan) {
      plans.push({ taskId: task.id, taskTitle: task.title, plan });

      await prisma.task.update({
        where: { id: task.id },
        data: { status: "IN_PROGRESS" },
      });
    }
  }

  return plans;
}

export { RESCUE_THRESHOLD };
