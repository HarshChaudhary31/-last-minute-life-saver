import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  scheduleTaskSessions,
  rescheduleMissedSessions,
  findFreeSlots,
} from "@/lib/calendar/google-calendar";
import prisma from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { taskId, action } = await req.json();

    if (action === "reschedule") {
      const rescheduled = await rescheduleMissedSessions(user.id);
      return NextResponse.json({ rescheduled });
    }

    if (action === "free-slots") {
      const slots = await findFreeSlots(user.id);
      return NextResponse.json({
        slots: slots.map((s) => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
        })),
      });
    }

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
      include: { subTasks: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const remainingHours = task.subTasks.length > 0
      ? task.subTasks.filter((s) => !s.completed).reduce((sum, s) => sum + s.duration, 0)
      : task.estimatedHours;

    const schedules = await scheduleTaskSessions(user.id, taskId, remainingHours);

    return NextResponse.json({ schedules });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const slots = await findFreeSlots(user.id);
    return NextResponse.json({
      slots: slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to get schedule" }, { status: 500 });
  }
}
