import { Resend } from "resend";

/**
 * Email helper. Uses Resend if RESEND_API_KEY is set, otherwise logs the
 * payload so an admin can recover the link from Vercel function logs.
 *
 * For Resend with `onboarding@resend.dev`, you can only send to the email
 * registered with your Resend account. To send to anyone, verify a domain
 * at https://resend.com/domains and update RESEND_FROM accordingly.
 */

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const FROM = process.env.RESEND_FROM ?? "Gym Membership <onboarding@resend.dev>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  if (!resend) {
    // Email not configured — log so the gym owner can find the link in
    // Vercel function logs while still in setup.
    console.log("[email:not-configured]", {
      to,
      subject,
      preview: text.split("\n").slice(0, 6).join(" | "),
    });
    return { ok: true, delivered: false };
  }

  const result = await resend.emails.send({ from: FROM, to, subject, html, text });
  if (result.error) {
    console.error("[email:resend-error]", result.error);
    return { ok: false, delivered: false, error: result.error.message };
  }
  return { ok: true, delivered: true };
}

interface PasswordResetInput {
  to: string;
  resetUrl: string;
  gymName?: string | null;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  gymName,
}: PasswordResetInput) {
  const subject = "Reset your password";
  const text = [
    `Hi${gymName ? " from " + gymName : ""},`,
    ``,
    `You (or someone using your email) requested a password reset.`,
    ``,
    `Use this link to set a new password — it expires in 1 hour:`,
    resetUrl,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; padding: 32px; color: #e2e8f0;">
    <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
      <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #65a30d, #bef264); border-radius: 14px; margin-bottom: 20px;"></div>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #f1f5f9;">Reset your password</h1>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px;">
        You (or someone using your email) requested a password reset${gymName ? ` for <strong style="color:#bef264">${gymName}</strong>` : ""}.
        Click the button below to set a new password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: #bef264; color: #0f172a; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 10px; font-size: 14px;">
        Reset Password
      </a>
      <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 24px 0 0;">
        If you didn't request this, you can safely ignore this email — your password will stay the same.
      </p>
      <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 12px 0 0; word-break: break-all;">
        Or copy this link into your browser:<br/>
        <a href="${resetUrl}" style="color: #bef264;">${resetUrl}</a>
      </p>
    </div>
  </body>
</html>`.trim();

  return sendEmail({ to, subject, html, text });
}
