import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        ...(status ? { status: status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" } : {}),
      },
      include: {
        subTasks: { orderBy: { order: "asc" } },
        schedules: { orderBy: { startTime: "asc" } },
      },
      orderBy: [{ riskScore: "desc" }, { deadline: "asc" }],
      take: limit,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
