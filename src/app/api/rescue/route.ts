import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getRescuePlanForTask, activateRescueMode } from "@/lib/ai/rescue-mode";
import prisma from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { taskId, activateAll } = await req.json();

    if (activateAll) {
      const plans = await activateRescueMode(user.id);
      return NextResponse.json({ plans });
    }

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const plan = await getRescuePlanForTask(taskId);
    if (!plan) {
      return NextResponse.json({ error: "Task is not in rescue mode" }, { status: 400 });
    }

    return NextResponse.json({ taskId, taskTitle: task.title, plan, riskScore: task.riskScore });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to get rescue plan" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const { getAtRiskTasks } = await import("@/lib/ai/rescue-mode");
    const atRiskTasks = await getAtRiskTasks(user.id);
    return NextResponse.json({ atRiskTasks });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch at-risk tasks" }, { status: 500 });
  }
}
