import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analyzeProductivity, getWeeklyProductivityData } from "@/lib/ai/productivity-coach";
import prisma from "@/lib/prisma/client";

export async function POST() {
  try {
    const user = await requireUser();
    const insights = await analyzeProductivity(user.id);
    const weeklyData = await getWeeklyProductivityData(user.id);

    return NextResponse.json({ insights, weeklyData });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();

    const insights = await prisma.insight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const weeklyData = await getWeeklyProductivityData(user.id);

    return NextResponse.json({
      insights,
      weeklyData,
      user: {
        productivityScore: user.productivityScore,
        streak: user.streak,
        focusHours: user.focusHours,
        tasksCompleted: user.tasksCompleted,
        badges: user.badges,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}
