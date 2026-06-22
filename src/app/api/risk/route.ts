import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { assessAllTasksRisk } from "@/lib/ai/risk-engine";
import { getFreeHoursToday } from "@/lib/calendar/google-calendar";
import prisma from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { taskId } = await req.json();

    const freeHours = await getFreeHoursToday(user.id);

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId: user.id },
        include: { subTasks: true },
      });

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      const { assessTaskRisk } = await import("@/lib/ai/risk-engine");
      const risk = await assessTaskRisk(task, user, freeHours || 4);

      await prisma.task.update({
        where: { id: taskId },
        data: { riskScore: risk.score },
      });

      return NextResponse.json({ taskId, risk });
    }

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

    const results = Object.fromEntries(assessments);

    return NextResponse.json({ assessments: results });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to assess risk" }, { status: 500 });
  }
}
