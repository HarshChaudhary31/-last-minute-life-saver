"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Clock, TrendingUp } from "lucide-react";
import type { DailyPlan } from "@/types";

interface DailyPlanPanelProps {
  plan: DailyPlan;
}

export function DailyPlanPanel({ plan }: DailyPlanPanelProps) {
  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          Today&apos;s Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2">
          {plan.focus.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                {i + 1}
              </span>
              {item}
            </motion.li>
          ))}
        </ol>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Workload
            </div>
            <p className="mt-1 text-lg font-semibold">{plan.estimatedWorkload}h</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Completion
            </div>
            <p className="mt-1 text-lg font-semibold">{plan.completionProbability}%</p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">Completion Probability</span>
            <span>{plan.completionProbability}%</span>
          </div>
          <Progress value={plan.completionProbability} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
