import { emailParagraph, renderEmailLayout } from "./layout";
import { sendMail } from "./smtp";

export async function sendVerificationEmail(options: {
  to: string;
  verifyUrl: string;
}): Promise<void> {
  const subject = "Verify your Squishatlas email";
  const text = [
    "Welcome to Squishatlas — confirm your email to open your shelf.",
    "",
    "Verify your email here:",
    options.verifyUrl,
    "",
    "If you did not create an account, you can ignore this email.",
    "This link expires in one hour.",
  ].join("\n");

  const html = renderEmailLayout({
    preheader: "Confirm your email to open your Squishatlas shelf.",
    title: "Verify your email",
    bodyHtml: [
      emailParagraph(
        "Your shelf is almost ready — tap below to confirm your email, then sign in.",
      ),
      emailParagraph(
        "Once verified, you can manage your collection and share the gallery and family tree.",
      ),
    ].join(""),
    ctaLabel: "Verify email",
    ctaUrl: options.verifyUrl,
    footerNote:
      "If you did not create an account, you can ignore this email. This link expires in one hour.",
  });

  await sendMail({
    to: options.to,
    subject,
    text,
    html,
  });
}
