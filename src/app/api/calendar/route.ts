import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCalendarEvents, isCalendarConnected } from "@/lib/calendar/google-calendar";

export async function GET() {
  try {
    const user = await requireUser();
    const connected = await isCalendarConnected(user.id);

    if (!connected) {
      return NextResponse.json({ connected: false, events: [] });
    }

    const events = await getCalendarEvents(user.id);
    return NextResponse.json({
      connected: true,
      events: events.map((e) => ({
        ...e,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
