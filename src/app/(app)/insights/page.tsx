"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Brain, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyProgressChart } from "@/components/dashboard/weekly-progress";
import { GamificationPanel } from "@/components/dashboard/gamification-panel";
import { toast } from "sonner";
import type { WeeklyProgress, GamificationStats } from "@/types";

interface Insight {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

interface ProductivityInsight {
  bestWorkingHours: string;
  procrastinationPatterns: string[];
  completionTrends: string;
  weeklyScore: number;
  recommendations: string[];
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [productivity, setProductivity] = useState<ProductivityInsight | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyProgress[]>([]);
  const [stats, setStats] = useState<GamificationStats>({
    productivityScore: 50,
    streak: 0,
    focusHours: 0,
    tasksCompleted: 0,
    badges: [],
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadInsights() {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      setInsights(data.insights ?? []);
      setWeeklyData(data.weeklyData ?? []);
      if (data.user) {
        setStats({
          productivityScore: data.user.productivityScore,
          streak: data.user.streak,
          focusHours: data.user.focusHours,
          tasksCompleted: data.user.tasksCompleted,
          badges: data.user.badges,
        });
      }
    } catch {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }

  async function generateInsights() {
    setGenerating(true);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();
      setProductivity(data.insights);
      setWeeklyData(data.weeklyData ?? []);
      toast.success("Insights generated!");
      loadInsights();
    } catch {
      toast.error("Failed to generate insights");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered productivity coaching and analytics
          </p>
        </div>
        <Button onClick={generateInsights} disabled={generating} className="gap-2">
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generate Insights
        </Button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {productivity && (
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-400" />
                  Productivity Coach
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white/5 p-4">
                    <p className="text-xs text-muted-foreground">Best Working Hours</p>
                    <p className="mt-1 font-semibold">{productivity.bestWorkingHours}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4">
                    <p className="text-xs text-muted-foreground">Weekly Score</p>
                    <p className="mt-1 font-semibold">{productivity.weeklyScore}/100</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Completion Trends</p>
                  <p className="text-sm text-muted-foreground">{productivity.completionTrends}</p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Procrastination Patterns</p>
                  <ul className="space-y-1">
                    {productivity.procrastinationPatterns.map((p, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {p}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <WeeklyProgressChart data={weeklyData} />

          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Recent Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No insights yet — click Generate Insights above
                </p>
              ) : (
                <div className="space-y-2">
                  {insights.map((insight) => (
                    <div key={insight.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary mr-2">
                        {insight.type}
                      </span>
                      {insight.content}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <GamificationPanel stats={stats} />
      </div>
    </div>
  );
}
