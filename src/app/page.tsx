import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Shield, Calendar, Brain, Mic } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-50 w-full border-b border-white/5 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">Last-Minute Life Saver</span>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            AI-Powered Productivity Companion
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            Never miss a{" "}
            <span className="gradient-text">deadline</span> again
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Last-Minute Life Saver goes beyond reminders. It plans, prioritizes, schedules,
            predicts risk, and rescues you when deadlines are at stake.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="gap-2">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-6xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Brain, title: "AI Task Creation", desc: "Describe tasks naturally — AI extracts deadlines, priority, and effort." },
            { icon: Shield, title: "Risk Prediction", desc: "Real-time risk scoring based on deadlines, effort, and calendar availability." },
            { icon: Calendar, title: "Smart Scheduler", desc: "Auto-schedule focus sessions in your Google Calendar free slots." },
            { icon: Mic, title: "Voice Assistant", desc: "Create tasks hands-free with voice input." },
          ].map((feature) => (
            <div key={feature.title} className="glass rounded-2xl p-6 transition-transform hover:scale-[1.02]">
              <feature.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
