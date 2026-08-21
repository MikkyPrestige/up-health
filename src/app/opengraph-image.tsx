import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated at request time via next/og rather than a static file, so it
// stays a single source of truth with the app's actual design tokens
// (ink/panel/vital) instead of a hand-exported image that can drift out of
// sync with the real palette in globals.css.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0d1210",
          backgroundImage:
            "linear-gradient(rgba(79, 216, 176, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 216, 176, 0.14) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        {/* Vitals waveform mark, echoing icon.png */}
        <svg width="72" height="72" viewBox="0 0 512 512" fill="none">
          <path
            d="M160 256h64l32 96 64-192 32 96h64"
            stroke="#4fd8b0"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          style={{
            marginTop: 40,
            fontSize: 96,
            fontWeight: 700,
            color: "#edefea",
            display: "flex",
          }}
        >
          UP <span style={{ color: "#4fd8b0", marginLeft: 24 }}>Health</span>
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            color: "#a9b3ad",
            display: "flex",
            maxWidth: 980,
          }}
        >
          See exactly who can do what to your Universal Profile, and
          whether anything&apos;s worth a closer look.
        </div>

        <div
          style={{
            marginTop: 56,
            fontSize: 26,
            color: "#4fd8b0",
            fontFamily: "monospace",
            display: "flex",
          }}
        >
          up-health.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
