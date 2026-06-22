import type { RiskAssessment } from "@/types";
import { getRiskLevel } from "@/lib/utils";

interface RiskInput {
  deadline: Date | null;
  estimatedHours: number;
  completedSubtaskHours: number;
  totalSubtaskHours: number;
  userProductivityScore: number;
  userStreak: number;
  freeHoursToday: number;
  priority: string;
}

export function calculateRiskScore(input: RiskInput): RiskAssessment {
  const factors: string[] = [];
  let score = 0;

  // Deadline proximity (0-40 points)
  if (input.deadline) {
    const hoursUntilDeadline =
      (input.deadline.getTime() - Date.now()) / (1000 * 60 * 60);
    const remainingHours = Math.max(
      0,
      input.totalSubtaskHours - input.completedSubtaskHours || input.estimatedHours
    );

    if (hoursUntilDeadline <= 0) {
      score += 40;
      factors.push("Deadline has passed");
    } else if (hoursUntilDeadline < remainingHours) {
      score += 35;
      factors.push("Not enough time before deadline");
    } else if (hoursUntilDeadline < remainingHours * 1.5) {
      score += 25;
      factors.push("Tight deadline window");
    } else if (hoursUntilDeadline < 48) {
      score += 15;
      factors.push("Deadline within 48 hours");
    } else if (hoursUntilDeadline < 168) {
      score += 8;
      factors.push("Deadline within a week");
    }
  } else {
    score += 5;
    factors.push("No deadline set");
  }

  // Remaining effort (0-25 points)
  const progress =
    input.totalSubtaskHours > 0
      ? input.completedSubtaskHours / input.totalSubtaskHours
      : 0;
  const effortRemaining = 1 - progress;

  if (effortRemaining > 0.8) {
    score += 20;
    factors.push("Most work still remaining");
  } else if (effortRemaining > 0.5) {
    score += 12;
    factors.push("Significant work remaining");
  } else if (effortRemaining > 0.2) {
    score += 5;
  }

  // User productivity history (0-15 points)
  if (input.userProductivityScore < 40) {
    score += 15;
    factors.push("Low productivity score");
  } else if (input.userProductivityScore < 60) {
    score += 8;
    factors.push("Below-average productivity");
  } else if (input.userStreak >= 7) {
    score -= 5;
    factors.push("Strong consistency streak");
  }

  // Calendar availability (0-15 points)
  const remainingHours = Math.max(
    0,
    input.totalSubtaskHours - input.completedSubtaskHours || input.estimatedHours
  );
  if (input.freeHoursToday < remainingHours * 0.3) {
    score += 15;
    factors.push("Very limited free time today");
  } else if (input.freeHoursToday < remainingHours) {
    score += 10;
    factors.push("Insufficient free calendar slots");
  }

  // Priority boost (0-5 points)
  if (input.priority === "URGENT") {
    score += 5;
    factors.push("Marked as urgent");
  } else if (input.priority === "HIGH") {
    score += 3;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: finalScore,
    level: getRiskLevel(finalScore),
    factors,
  };
}

export async function assessTaskRisk(
  task: {
    deadline: Date | null;
    estimatedHours: number;
    priority: string;
    subTasks: { duration: number; completed: boolean }[];
  },
  user: { productivityScore: number; streak: number },
  freeHoursToday = 4
): Promise<RiskAssessment> {
  const totalSubtaskHours = task.subTasks.reduce((sum, s) => sum + s.duration, 0);
  const completedSubtaskHours = task.subTasks
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.duration, 0);

  return calculateRiskScore({
    deadline: task.deadline,
    estimatedHours: task.estimatedHours,
    completedSubtaskHours,
    totalSubtaskHours,
    userProductivityScore: user.productivityScore,
    userStreak: user.streak,
    freeHoursToday,
    priority: task.priority,
  });
}

export async function assessAllTasksRisk(
  tasks: {
    id: string;
    deadline: Date | null;
    estimatedHours: number;
    priority: string;
    subTasks: { duration: number; completed: boolean }[];
  }[],
  user: { productivityScore: number; streak: number },
  freeHoursToday = 4
): Promise<Map<string, RiskAssessment>> {
  const results = new Map<string, RiskAssessment>();

  for (const task of tasks) {
    const assessment = await assessTaskRisk(task, user, freeHoursToday);
    results.set(task.id, assessment);
  }

  return results;
}
