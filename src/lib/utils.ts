import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "No deadline";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getDaysUntilDeadline(deadline: Date | string | null): number | null {
  if (!deadline) return null;
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getRiskLevel(score: number): "Low" | "Medium" | "High" | "Critical" {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export function getRiskColor(score: number): string {
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 35) return "text-yellow-400";
  return "text-emerald-400";
}

export function getRiskBgColor(score: number): string {
  if (score >= 80) return "bg-red-500/20 border-red-500/30";
  if (score >= 60) return "bg-orange-500/20 border-orange-500/30";
  if (score >= 35) return "bg-yellow-500/20 border-yellow-500/30";
  return "bg-emerald-500/20 border-emerald-500/30";
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "text-red-400 bg-red-500/10";
    case "HIGH":
      return "text-orange-400 bg-orange-500/10";
    case "MEDIUM":
      return "text-blue-400 bg-blue-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
}

export const BADGES = {
  DEADLINE_HERO: { id: "deadline_hero", name: "Deadline Hero", description: "Complete 10 tasks before deadline" },
  FOCUS_MASTER: { id: "focus_master", name: "Focus Master", description: "Log 20 focus hours" },
  CONSISTENCY_CHAMPION: { id: "consistency_champion", name: "Consistency Champion", description: "Maintain a 7-day streak" },
} as const;
