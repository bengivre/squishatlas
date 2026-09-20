import localFont from "next/font/local";

export const fredoka = localFont({
  src: [
    { path: "./fonts/Fredoka-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Fredoka-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-fredoka",
  display: "swap",
});

export const nunito = localFont({
  src: [
    { path: "./fonts/Nunito-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Nunito-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Nunito-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
});
