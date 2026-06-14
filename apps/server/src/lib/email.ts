import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not set. Email delivery is disabled.");
}

// Initialize Resend client only when configured
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 * @see https://resend.com/docs/send-with-nodejs
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, react, from, replyTo } = options;

  const fromAddress = from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!resend) {
    const errorMessage = "Email provider is not configured. Set RESEND_API_KEY to enable email delivery.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      react,
      replyTo,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

/**
 * Get the Resend client instance for advanced usage
 */
export function getResendClient() {
  return resend;
}

export { resend };
