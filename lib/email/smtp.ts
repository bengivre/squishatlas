import nodemailer, { type Transporter } from "nodemailer";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getSmtpSecure(): boolean {
  const raw = process.env.SMTP_SECURE?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export function createSmtpTransporter(): Transporter {
  return nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port: Number(requireEnv("SMTP_PORT")),
    secure: getSmtpSecure(),
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASSWORD"),
    },
  });
}

export function getSmtpFromAddress(): string {
  return requireEnv("SMTP_USER");
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const transporter = createSmtpTransporter();

  await transporter.sendMail({
    from: getSmtpFromAddress(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
