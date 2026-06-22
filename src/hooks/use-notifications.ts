"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function NotificationPermission() {
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            toast.success("Browser notifications enabled");
          }
        });
      }
    }
  }, []);

  return null;
}

export function sendBrowserNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }
}

export function scheduleDeadlineNotification(
  taskTitle: string,
  deadline: Date,
  hoursBefore = 24
) {
  const notifyAt = deadline.getTime() - hoursBefore * 60 * 60 * 1000;
  const delay = notifyAt - Date.now();

  if (delay > 0) {
    setTimeout(() => {
      sendBrowserNotification(
        "Deadline Approaching",
        `"${taskTitle}" is due in ${hoursBefore} hours`
      );
    }, delay);
  }
}
