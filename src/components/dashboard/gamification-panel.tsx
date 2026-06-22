"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Clock, CheckCircle2 } from "lucide-react";
import { BADGES } from "@/lib/utils";
import type { GamificationStats } from "@/types";

interface GamificationPanelProps {
  stats: GamificationStats;
}

export function GamificationPanel({ stats }: GamificationPanelProps) {
  const badgeList = Object.values(BADGES);

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-400" />
              Streak
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.streak}<span className="text-sm font-normal text-muted-foreground"> days</span></p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 text-blue-400" />
              Focus Hours
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.focusHours.toFixed(1)}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Completed
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.tasksCompleted}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-xs text-muted-foreground">Score</div>
            <p className="mt-1 text-2xl font-bold">{stats.productivityScore}</p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">Productivity Score</span>
            <span>{stats.productivityScore}/100</span>
          </div>
          <Progress value={stats.productivityScore} className="h-2" />
        </div>

        <div>
          <p className="mb-2 text-xs text-muted-foreground">Badges</p>
          <div className="flex flex-wrap gap-2">
            {badgeList.map((badge) => {
              const earned = stats.badges.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    earned
                      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                      : "border-white/10 bg-white/5 text-muted-foreground opacity-50"
                  }`}
                  title={badge.description}
                >
                  {badge.name}
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
