interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailNotification({ to, subject, body }: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Last-Minute Life Saver <noreply@lifesaver.app>";

  if (!apiKey) {
    console.log("[Email] Skipped (no RESEND_API_KEY):", { to, subject });
    return { success: false, reason: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html: body }),
    });

    if (!res.ok) {
      throw new Error(`Email failed: ${res.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Failed:", error);
    return { success: false, reason: "send_failed" };
  }
}

export async function sendDeadlineReminder(
  email: string,
  taskTitle: string,
  deadline: Date,
  hoursRemaining: number
) {
  return sendEmailNotification({
    to: email,
    subject: `⚠ Deadline approaching: ${taskTitle}`,
    body: `
      <h2>Deadline Reminder</h2>
      <p>Your task <strong>${taskTitle}</strong> is due in approximately ${hoursRemaining} hours.</p>
      <p>Deadline: ${deadline.toLocaleString()}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open Dashboard</a></p>
    `,
  });
}

export async function sendRescueModeAlert(
  email: string,
  taskTitle: string,
  riskScore: number,
  nextStep: string
) {
  return sendEmailNotification({
    to: email,
    subject: `🚨 Rescue Mode: ${taskTitle} is at critical risk`,
    body: `
      <h2>Task At Risk</h2>
      <p><strong>${taskTitle}</strong> has a risk score of ${riskScore}/100.</p>
      <p>Immediate next step: ${nextStep}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Rescue Plan</a></p>
    `,
  });
}
