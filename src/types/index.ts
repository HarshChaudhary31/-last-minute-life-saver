import type {
  Priority,
  TaskStatus,
  ScheduleStatus,
  InsightType,
  Task,
  SubTask,
  Schedule,
  User,
  Insight,
} from "@prisma/client";

export type { Priority, TaskStatus, ScheduleStatus, InsightType };

export type TaskWithRelations = Task & {
  subTasks: SubTask[];
  schedules: Schedule[];
};

export type UserWithStats = User & {
  tasks?: TaskWithRelations[];
  insights?: Insight[];
};

export interface ParsedTask {
  title: string;
  description?: string;
  deadline?: string;
  priority: Priority;
  estimatedHours: number;
  category?: string;
}

export interface ParsedSubTask {
  title: string;
  duration: number;
  priority: Priority;
}

export interface RiskAssessment {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
  factors: string[];
}

export interface DailyPlan {
  focus: string[];
  estimatedWorkload: number;
  completionProbability: number;
  recommendations: string[];
}

export interface RescuePlan {
  immediateNextStep: string;
  revisedSchedule: { task: string; time: string; duration: number }[];
  focusSessions: { task: string; duration: number; startTime: string }[];
  timeBlocks: { start: string; end: string; activity: string }[];
}

export interface ProductivityInsight {
  bestWorkingHours: string;
  procrastinationPatterns: string[];
  completionTrends: string;
  weeklyScore: number;
  recommendations: string[];
}

export interface CalendarSlot {
  start: Date;
  end: Date;
}

export interface WeeklyProgress {
  day: string;
  completed: number;
  planned: number;
}

export interface GamificationStats {
  productivityScore: number;
  streak: number;
  focusHours: number;
  tasksCompleted: number;
  badges: string[];
}
