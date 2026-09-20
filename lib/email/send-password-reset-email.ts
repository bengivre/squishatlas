import { emailParagraph, renderEmailLayout } from "./layout";
import { sendMail } from "./smtp";

export async function sendPasswordResetEmail(options: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const subject = "Reset your Squishatlas password";
  const text = [
    "We received a request to reset your Squishatlas password.",
    "",
    "Choose a new password here:",
    options.resetUrl,
    "",
    "If you did not ask for this, you can ignore this email.",
    "This link expires in one hour.",
  ].join("\n");

  const html = renderEmailLayout({
    preheader: "Reset your Squishatlas password — link inside.",
    title: "Password reset",
    bodyHtml: [
      emailParagraph(
        "We received a request to reset your Squishatlas password — no worries, it only takes a moment.",
      ),
      emailParagraph(
        "Tap the button below to choose a new password and get back to your squish shelf.",
      ),
    ].join(""),
    ctaLabel: "Choose a new password",
    ctaUrl: options.resetUrl,
    footerNote:
      "If you did not ask for this, you can ignore this email. This link expires in one hour.",
  });

  await sendMail({
    to: options.to,
    subject,
    text,
    html,
  });
}
