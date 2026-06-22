import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { parseNaturalLanguageTask, breakdownTask } from "@/lib/ai/task-breakdown";
import { assessTaskRisk } from "@/lib/ai/risk-engine";
import { getFreeHoursToday } from "@/lib/calendar/google-calendar";
import { sendRescueModeAlert } from "@/lib/notifications/email";
import prisma from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { input } = await req.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    const parsed = await parseNaturalLanguageTask(input);
    const subtasks = await breakdownTask(parsed.title, parsed.description);

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: parsed.title,
        description: parsed.description,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
        priority: parsed.priority,
        estimatedHours: parsed.estimatedHours,
        category: parsed.category,
        status: "PENDING",
        subTasks: {
          create: subtasks.map((st, i) => ({
            title: st.title,
            duration: st.duration,
            priority: st.priority,
            order: i,
          })),
        },
      },
      include: { subTasks: true },
    });

    const freeHours = await getFreeHoursToday(user.id);
    const risk = await assessTaskRisk(
      {
        deadline: task.deadline,
        estimatedHours: task.estimatedHours,
        priority: task.priority,
        subTasks: task.subTasks,
      },
      user,
      freeHours || 4
    );

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { riskScore: risk.score },
      include: { subTasks: true, schedules: true },
    });

    if (risk.score >= 80) {
      const { generateRescuePlan } = await import("@/lib/ai/task-breakdown");
      const plan = await generateRescuePlan(
        task.title,
        task.subTasks.map((s) => ({ title: s.title, completed: s.completed, duration: s.duration })),
        task.deadline ? Math.max(0, (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60)) : 24
      );
      await sendRescueModeAlert(user.email, task.title, risk.score, plan.immediateNextStep);
    }

    return NextResponse.json({ task: updatedTask, risk }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
