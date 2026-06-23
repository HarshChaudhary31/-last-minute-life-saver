import OpenAI from "openai";
import type { ParsedTask, ParsedSubTask, DailyPlan, RescuePlan, ProductivityInsight } from "@/types";
import type { Priority } from "@prisma/client";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

function parseJsonResponse<T>(content: string): T {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function parseNaturalLanguageTask(input: string): Promise<ParsedTask> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackParseTask(input);
  }

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You extract structured task data from natural language. Return JSON only with fields:
          title, description, deadline (ISO 8601 or null), priority (LOW|MEDIUM|HIGH|URGENT),
          estimatedHours (number), category (string or null).
          Today is ${new Date().toISOString().split("T")[0]}.`,
        },
        { role: "user", content: input },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    return parseJsonResponse<ParsedTask>(content);
  } catch {
    return fallbackParseTask(input);
  }
}

function fallbackParseTask(input: string): ParsedTask {
  const lower = input.toLowerCase();
  let priority: Priority = "MEDIUM";
  if (lower.includes("urgent") || lower.includes("asap")) priority = "URGENT";
  else if (lower.includes("important")) priority = "HIGH";

  let estimatedHours = 1;
  if (lower.includes("prepare") || lower.includes("interview")) estimatedHours = 4;
  if (lower.includes("application")) estimatedHours = 2;

  let category = "General";
  if (lower.includes("bill") || lower.includes("pay")) category = "Finance";
  if (lower.includes("interview")) category = "Career";
  if (lower.includes("internship")) category = "Career";

  return {
    title: input.length > 80 ? input.slice(0, 77) + "..." : input,
    description: input,
    deadline: extractDeadlineFromText(input),
    priority,
    estimatedHours,
    category,
  };
}

function extractDeadlineFromText(input: string): string | undefined {
  const lower = input.toLowerCase();
  const now = new Date();

  if (lower.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    return d.toISOString();
  }
  if (lower.includes("next friday")) {
    const d = new Date(now);
    const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilFriday);
    d.setHours(17, 0, 0, 0);
    return d.toISOString();
  }
  if (lower.includes("monday")) {
    const d = new Date(now);
    const daysUntilMonday = (1 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(17, 0, 0, 0);
    return d.toISOString();
  }
  const beforeMatch = lower.match(/before the (\d+)/);
  if (beforeMatch) {
    const day = parseInt(beforeMatch[1], 10);
    const d = new Date(now.getFullYear(), now.getMonth(), day, 17, 0, 0);
    if (d < now) d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }
  return undefined;
}

export async function breakdownTask(title: string, description?: string): Promise<ParsedSubTask[]> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackBreakdown(title);
  }

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Break down the task into 3-6 actionable subtasks. Return JSON: { "subtasks": [{ "title": string, "duration": number (hours), "priority": "LOW"|"MEDIUM"|"HIGH"|"URGENT" }] }`,
        },
        { role: "user", content: `Task: ${title}\n${description ?? ""}` },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    const parsed = parseJsonResponse<{ subtasks: ParsedSubTask[] }>(content);
    return parsed.subtasks;
  } catch {
    return fallbackBreakdown(title);
  }
}

function fallbackBreakdown(title: string): ParsedSubTask[] {
  const lower = title.toLowerCase();
  if (lower.includes("interview")) {
    return [
      { title: "Research company", duration: 1, priority: "HIGH" },
      { title: "Review resume", duration: 0.5, priority: "HIGH" },
      { title: "Practice behavioral questions", duration: 1.5, priority: "MEDIUM" },
      { title: "Mock interview", duration: 1, priority: "MEDIUM" },
      { title: "Review notes", duration: 0.5, priority: "LOW" },
    ];
  }
  return [
    { title: "Gather requirements", duration: 0.5, priority: "MEDIUM" },
    { title: "Execute main work", duration: 1, priority: "HIGH" },
    { title: "Review and finalize", duration: 0.5, priority: "MEDIUM" },
  ];
}

export async function generateDailyPlan(
  tasks: { title: string; deadline: Date | null; priority: string; estimatedHours: number }[]
): Promise<DailyPlan> {
  const pending = tasks.filter((t) => t.deadline);
  const sorted = [...pending].sort((a, b) => {
    if (!a.deadline || !b.deadline) return 0;
    return a.deadline.getTime() - b.deadline.getTime();
  });

  const focus = sorted.slice(0, 3).map((t) => t.title);
  const estimatedWorkload = sorted.slice(0, 5).reduce((sum, t) => sum + t.estimatedHours, 0);

  const urgencyFactor = sorted.filter((t) => {
    if (!t.deadline) return false;
    const days = (t.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days <= 2;
  }).length;

  const completionProbability = Math.max(50, Math.min(95, 90 - urgencyFactor * 5));

  return {
    focus,
    estimatedWorkload: Math.round(estimatedWorkload * 10) / 10,
    completionProbability,
    recommendations: [
      "Start with your highest-risk task first",
      "Block 25-minute focus sessions with 5-minute breaks",
      "Review progress at midday and adjust priorities",
    ],
  };
}

export async function generateRescuePlan(
  taskTitle: string,
  subtasks: { title: string; completed: boolean; duration: number }[],
  hoursRemaining: number
): Promise<RescuePlan> {
  const incomplete = subtasks.filter((s) => !s.completed);
  const immediateNextStep = incomplete[0]?.title ?? `Start working on: ${taskTitle}`;

  const now = new Date();
  const revisedSchedule = incomplete.slice(0, 4).map((s, i) => {
    const start = new Date(now);
    start.setHours(now.getHours() + i * 2, 0, 0, 0);
    return {
      task: s.title,
      time: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      duration: s.duration,
    };
  });

  const focusSessions = incomplete.slice(0, 3).map((s, i) => {
    const start = new Date(now);
    start.setMinutes(start.getMinutes() + i * 45);
    return {
      task: s.title,
      duration: Math.min(s.duration, 1),
      startTime: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
  });

  const timeBlocks = [
    { start: "Now", end: "+30 min", activity: immediateNextStep },
    { start: "+30 min", end: "+90 min", activity: "Deep focus session" },
    { start: "+90 min", end: "+2 hrs", activity: "Complete remaining subtasks" },
  ];

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate an emergency rescue plan for an at-risk task. Return JSON with immediateNextStep, revisedSchedule (array of {task, time, duration}), focusSessions (array of {task, duration, startTime}), timeBlocks (array of {start, end, activity}). Hours remaining: ${hoursRemaining}`,
          },
          { role: "user", content: `Task: ${taskTitle}\nIncomplete subtasks: ${incomplete.map((s) => s.title).join(", ")}` },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message?.content;
      if (content) return parseJsonResponse<RescuePlan>(content);
    } catch {
      // fall through to default
    }
  }

  return { immediateNextStep, revisedSchedule, focusSessions, timeBlocks };
}

export async function generateProductivityInsights(
  completedTasks: number,
  avgCompletionTime: number,
  streak: number,
  focusHours: number
): Promise<ProductivityInsight> {
  const weeklyScore = Math.min(100, Math.round(completedTasks * 10 + streak * 5 + focusHours * 2));

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analyze productivity data and return JSON with bestWorkingHours, procrastinationPatterns (array), completionTrends (string), weeklyScore (number), recommendations (array).`,
          },
          {
            role: "user",
            content: `Completed tasks: ${completedTasks}, avg completion time: ${avgCompletionTime}h, streak: ${streak}, focus hours: ${focusHours}`,
          },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message?.content;
      if (content) return parseJsonResponse<ProductivityInsight>(content);
    } catch {
      // fall through
    }
  }

  return {
    bestWorkingHours: "9 AM – 12 PM",
    procrastinationPatterns: [
      "Tasks without deadlines tend to be delayed",
      "Afternoon sessions show lower completion rates",
    ],
    completionTrends: `${completedTasks} tasks completed recently with ${streak}-day streak`,
    weeklyScore,
    recommendations: [
      "Schedule important tasks in the morning",
      "Set micro-deadlines for large projects",
      "Use focus sessions to maintain momentum",
    ],
  };
}
