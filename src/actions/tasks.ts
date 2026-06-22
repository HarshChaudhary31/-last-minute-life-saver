"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { updateGamification } from "@/lib/ai/productivity-coach";
import { assessAllTasksRisk } from "@/lib/ai/risk-engine";
import { getFreeHoursToday } from "@/lib/calendar/google-calendar";

export async function completeTask(taskId: string) {
  const user = await requireUser();

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: user.id },
  });

  if (!task) throw new Error("Task not found");

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "COMPLETED" },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tasksCompleted: { increment: 1 },
      streak: { increment: 1 },
    },
  });

  await updateGamification(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function toggleSubTask(subTaskId: string) {
  const user = await requireUser();

  const subTask = await prisma.subTask.findFirst({
    where: { id: subTaskId },
    include: { task: true },
  });

  if (!subTask || subTask.task.userId !== user.id) {
    throw new Error("Subtask not found");
  }

  await prisma.subTask.update({
    where: { id: subTaskId },
    data: { completed: !subTask.completed },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();

  await prisma.task.deleteMany({
    where: { id: taskId, userId: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function recalculateRisk() {
  const user = await requireUser();
  const freeHours = await getFreeHoursToday(user.id);

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: { subTasks: true },
  });

  const assessments = await assessAllTasksRisk(tasks, user, freeHours || 4);

  for (const [id, risk] of assessments) {
    await prisma.task.update({
      where: { id },
      data: { riskScore: risk.score },
    });
  }

  revalidatePath("/dashboard");
}
