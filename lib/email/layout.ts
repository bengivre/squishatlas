import { escapeHtml } from "./escape-html";

const COLORS = {
  nightDeep: "#14102b",
  nightPlum: "#241a47",
  lamplight: "#fff4e2",
  moonGold: "#ffc96b",
  aurora: "#6fe3d0",
  starDim: "#8b84b8",
} as const;

export function renderEmailLayout(options: {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}): string {
  const preheader = escapeHtml(options.preheader);
  const title = escapeHtml(options.title);
  const ctaLabel = escapeHtml(options.ctaLabel);
  const ctaUrl = escapeHtml(options.ctaUrl);
  const footerNote = escapeHtml(options.footerNote);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.nightDeep};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.nightDeep};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:${COLORS.nightPlum};border-radius:24px;overflow:hidden;border:1px solid rgba(255,201,107,0.22);">
          <tr>
            <td style="background:linear-gradient(165deg,${COLORS.moonGold} 0%,#ffb84d 55%,${COLORS.aurora} 100%);padding:22px 28px;text-align:center;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.nightDeep};font-weight:700;">
                Squishatlas
              </p>
              <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.15;color:${COLORS.nightDeep};font-weight:700;">
                ${title}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:Verdana,Geneva,sans-serif;font-size:16px;line-height:1.55;color:${COLORS.lamplight};">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 28px 28px;">
              <a href="${ctaUrl}" style="display:inline-block;background-color:${COLORS.moonGold};color:${COLORS.nightDeep};font-family:Verdana,Geneva,sans-serif;font-size:15px;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:16px;">
                ${ctaLabel}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-family:Verdana,Geneva,sans-serif;font-size:13px;line-height:1.5;color:${COLORS.starDim};text-align:center;">
              ${footerNote}
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-family:Verdana,Geneva,sans-serif;font-size:12px;color:${COLORS.starDim};text-align:center;">
          A cozy night-sky home for every Squishmallow
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Verdana,Geneva,sans-serif;font-size:16px;line-height:1.55;color:${COLORS.lamplight};">${html}</p>`;
}
