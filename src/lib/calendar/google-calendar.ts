import { google } from "googleapis";
import prisma from "@/lib/prisma/client";
import type { CalendarSlot } from "@/types";
import { addHours, startOfDay, endOfDay, isBefore, isAfter } from "date-fns";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function handleOAuthCallback(code: string, userId: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token ?? null,
      googleRefreshToken: tokens.refresh_token ?? undefined,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });

  return tokens;
}

async function getAuthenticatedClient(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.googleAccessToken) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    }
  });

  return oauth2Client;
}

export async function getCalendarEvents(userId: string, date = new Date()) {
  const auth = await getAuthenticatedClient(userId);
  if (!auth) return [];

  const calendar = google.calendar({ version: "v3", auth });
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.data.items ?? []).map((event) => ({
      id: event.id ?? "",
      title: event.summary ?? "Busy",
      start: new Date(event.start?.dateTime ?? event.start?.date ?? ""),
      end: new Date(event.end?.dateTime ?? event.end?.date ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function findFreeSlots(
  userId: string,
  date = new Date(),
  slotDurationHours = 1
): Promise<CalendarSlot[]> {
  const events = await getCalendarEvents(userId, date);
  const dayStart = startOfDay(date);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = startOfDay(date);
  dayEnd.setHours(20, 0, 0, 0);

  const busySlots = events.map((e) => ({ start: e.start, end: e.end }));
  const freeSlots: CalendarSlot[] = [];
  let cursor = dayStart;

  while (isBefore(cursor, dayEnd)) {
    const slotEnd = addHours(cursor, slotDurationHours);
    const hasConflict = busySlots.some(
      (busy) =>
        isBefore(cursor, busy.end) && isAfter(slotEnd, busy.start)
    );

    if (!hasConflict && isBefore(slotEnd, dayEnd)) {
      freeSlots.push({ start: new Date(cursor), end: slotEnd });
    }

    cursor = addHours(cursor, 0.5);
  }

  return freeSlots;
}

export async function scheduleTaskSessions(
  userId: string,
  taskId: string,
  hoursNeeded: number
) {
  const freeSlots = await findFreeSlots(userId);
  const schedules = [];
  let hoursScheduled = 0;

  for (const slot of freeSlots) {
    if (hoursScheduled >= hoursNeeded) break;

    const duration =
      (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
    const scheduleHours = Math.min(duration, hoursNeeded - hoursScheduled);

    const schedule = await prisma.schedule.create({
      data: {
        taskId,
        startTime: slot.start,
        endTime: addHours(slot.start, scheduleHours),
        status: "SCHEDULED",
      },
    });

    schedules.push(schedule);
    hoursScheduled += scheduleHours;
  }

  return schedules;
}

export async function rescheduleMissedSessions(userId: string) {
  const missed = await prisma.schedule.findMany({
    where: {
      status: "MISSED",
      task: { userId },
    },
    include: { task: true },
  });

  const rescheduled = [];

  for (const session of missed) {
    const freeSlots = await findFreeSlots(userId);
    const slot = freeSlots[0];
    if (!slot) continue;

    const duration =
      (session.endTime.getTime() - session.startTime.getTime()) /
      (1000 * 60 * 60);

    await prisma.schedule.update({
      where: { id: session.id },
      data: { status: "RESCHEDULED" },
    });

    const newSchedule = await prisma.schedule.create({
      data: {
        taskId: session.taskId,
        startTime: slot.start,
        endTime: addHours(slot.start, duration),
        status: "SCHEDULED",
      },
    });

    rescheduled.push(newSchedule);
  }

  return rescheduled;
}

export async function getFreeHoursToday(userId: string): Promise<number> {
  const freeSlots = await findFreeSlots(userId);
  return freeSlots.reduce((total, slot) => {
    const hours =
      (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);
}

export async function isCalendarConnected(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return !!user?.googleAccessToken;
}
