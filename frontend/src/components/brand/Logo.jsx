import React from "react";

export function Logo({ size = 32, variant = "mark", className = "" }) {
  const s = typeof size === "number" ? `${size}px` : size;

  if (variant === "wordmark") {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <Logo size={size} variant="mark" />
        <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Invenzaa
        </span>
      </span>
    );
  }

  // Meaningful mark: inventory "shelves" + verified medicine flow.
  // The three horizontal bars imply stock levels/shelves; the check implies accuracy & compliance.
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Invenzaa"
      role="img"
      className={className}
      style={{ flex: "0 0 auto" }}
    >
      <defs>
        <linearGradient id="invz_grad" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.55" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="36" height="36" rx="10" fill="url(#invz_grad)" />
      {/* shelves / stock levels */}
      <rect x="14" y="16" width="20" height="3.2" rx="1.6" fill="white" fillOpacity="0.92" />
      <rect x="14" y="22.4" width="16" height="3.2" rx="1.6" fill="white" fillOpacity="0.88" />
      <rect x="14" y="28.8" width="18" height="3.2" rx="1.6" fill="white" fillOpacity="0.84" />

      {/* verification check */}
      <path
        d="M19.2 34.2l2.8 2.8 6.8-7"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
    </svg>
  );
}

