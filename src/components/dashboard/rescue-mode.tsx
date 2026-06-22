"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Zap, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRiskBgColor, getRiskColor } from "@/lib/utils";
import type { RescuePlan } from "@/types";

interface RescueModeProps {
  taskTitle: string;
  riskScore: number;
  plan: RescuePlan;
  onDismiss?: () => void;
}

export function RescueModePanel({ taskTitle, riskScore, plan, onDismiss }: RescueModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full"
    >
      <Card className={`border-2 ${getRiskBgColor(riskScore)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={`h-5 w-5 ${getRiskColor(riskScore)}`} />
            ⚠ Task At Risk: {taskTitle}
            <span className={`ml-auto text-sm font-normal ${getRiskColor(riskScore)}`}>
              Risk: {riskScore}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-yellow-400" />
              Immediate Next Step
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.immediateNextStep}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Revised Schedule
              </div>
              <div className="space-y-2">
                {plan.revisedSchedule.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <span>{item.task}</span>
                    <span className="text-muted-foreground">{item.time} · {item.duration}h</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4" />
                Focus Sessions
              </div>
              <div className="space-y-2">
                {plan.focusSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <span>{session.task}</span>
                    <span className="text-muted-foreground">{session.startTime} · {session.duration}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Acknowledge & Start Rescue
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
