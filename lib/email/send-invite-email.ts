import { escapeHtml } from "./escape-html";
import { emailParagraph, renderEmailLayout } from "./layout";
import { sendMail } from "./smtp";

export async function sendTenantInviteEmail(options: {
  to: string;
  inviteUrl: string;
  tenantDisplayName: string;
}): Promise<void> {
  const shelfName = escapeHtml(options.tenantDisplayName);
  const subject = `You're invited to ${options.tenantDisplayName} on Squishatlas`;
  const text = [
    `You've been invited to manage ${options.tenantDisplayName} on Squishatlas.`,
    "",
    "Set your password and join your collection:",
    options.inviteUrl,
    "",
    "This link expires in 7 days and can only be used once.",
  ].join("\n");

  const html = renderEmailLayout({
    preheader: `Come join ${options.tenantDisplayName} on Squishatlas!`,
    title: "You're invited!",
    bodyHtml: [
      emailParagraph(
        `A cozy spot on the shelf is waiting — you've been invited to manage <strong style="color:#ffc96b;">${shelfName}</strong> on Squishatlas.`,
      ),
      emailParagraph(
        "Tap the button below to set your password and open your collection under the night sky.",
      ),
    ].join(""),
    ctaLabel: "Join your collection",
    ctaUrl: options.inviteUrl,
    footerNote: "This link expires in 7 days and can only be used once.",
  });

  await sendMail({
    to: options.to,
    subject,
    text,
    html,
  });
}
