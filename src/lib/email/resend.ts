import { Resend } from 'resend';

const FROM_ADDRESS = process.env.REMINDER_EMAIL_FROM ?? 'Personal Purchase Vault <reminders@updates.example.com>';

// Constructed lazily (not at module load) so builds and routes that never
// send email don't require RESEND_API_KEY to be set.
function getResendClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendReminderEmail(params: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
}) {
  const resend = getResendClient();
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 12px;">${params.heading}</h2>
        <p style="color: #333; line-height: 1.5;">${params.body}</p>
        <a href="${params.ctaUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">${params.ctaLabel}</a>
      </div>
    `,
  });
}
