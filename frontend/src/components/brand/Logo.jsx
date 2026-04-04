import React from "react";

/**
 * Invenzaa brand mark
 */
export function Logo({ size = 32, variant = "mark", className = "" }) {
  const s = typeof size === "number" ? `${size}px` : size;

  if (variant === "wordmark") {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" alt="Invenzaa" width={size} height={size} style={{ width: s, height: s, flex: "0 0 auto", objectFit: 'contain', transform: 'scale(1.3)' }} />
        <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Invenzaa
        </span>
      </span>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Invenzaa" 
      className={className}
      width={size} 
      height={size}
      style={{ width: s, height: s, flex: "0 0 auto", objectFit: 'contain', transform: 'scale(1.3)' }}
    />
  );
}
