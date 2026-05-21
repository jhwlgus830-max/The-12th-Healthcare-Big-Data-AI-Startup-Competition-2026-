"use client";

import React from "react";

interface OwlLogoProps {
  className?: string;
  size?: number;
  withMoon?: boolean;
  variant?: "night" | "ivory";
}

export default function OwlLogo({
  className = "",
  size = 48,
  withMoon = false,
  variant = "night",
}: OwlLogoProps) {
  const isNight = variant === "night";

  // Design system colors based on variant
  const bgFill = isNight ? "#1E293B" : "#FAF8F5";
  const bgStroke = isNight ? "rgba(245, 158, 11, 0.15)" : "#EAE5D9";
  const owlFill = isNight ? "#E2E8F0" : "#3E3A35"; // Muted light gray for night, charcoal for ivory
  const chestFill = isNight ? "#0F172A" : "#FAF8F5";
  const eyeBg = "#FFFFFF";
  const pupilColor = isNight ? "#0F172A" : "#2C2A29";
  const beakColor = "#F59E0B";
  const heartColor = "#EF4444";
  const moonColor = "#FCD34D";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer border & subtle container background */}
      <circle
        cx="50"
        cy="50"
        r="47"
        fill={bgFill}
        stroke={bgStroke}
        strokeWidth="2"
      />

      {/* Optional Crescent Moon */}
      {withMoon && (
        <path
          d="M72 32C72 44.5 61 55 48 55C44.5 55 41.2 54.2 38.3 52.8C42 57.5 47.8 60.5 54.5 60.5C65.5 60.5 74.5 51.5 74.5 40.5C74.5 33.8 71.3 28 66.4 24.2C69.6 26.2 72 29.5 72 32Z"
          fill={moonColor}
          opacity="0.85"
        />
      )}

      {/* Owl Figure Group */}
      <g>
        {/* Head/Ears Horns (Minimalist Vector Shape) */}
        <path
          d="M32 36L44 41H56L68 36L64 47H36L32 36Z"
          fill={owlFill}
        />

        {/* Wings */}
        <path
          d="M29 48C29 48 24 57 32 70C34 73 37.5 75 37.5 75L32.5 58L29 48Z"
          fill={owlFill}
          opacity="0.85"
        />
        <path
          d="M71 48C71 48 76 57 68 70C66 73 62.5 75 62.5 75L67.5 58L71 48Z"
          fill={owlFill}
          opacity="0.85"
        />

        {/* Main Body Shield */}
        <rect
          x="35"
          y="45"
          width="30"
          height="32"
          rx="15"
          fill={owlFill}
        />

        {/* Chest Plate (Subtle highlight area) */}
        <path
          d="M39 55C39 48.5 61 48.5 61 55C61 63 39 63 39 55Z"
          fill={chestFill}
          opacity="0.25"
        />

        {/* Flat Heart for Emotional Protection */}
        <path
          d="M50 67C50 67 44 61.5 44 57.5C44 55 46 53 48.5 53C49.9 53 50.8 53.8 51.5 54.5L50 56L48.5 54.5C49.2 53.8 50.1 53 51.5 53C54 53 56 55 56 57.5C56 61.5 50 67 50 67Z"
          fill={heartColor}
        />

        {/* Watching Eyes (Flat minimalist layout, open watching expression) */}
        {/* Left Eye */}
        <circle cx="42" cy="43" r="7.5" fill={eyeBg} />
        <circle cx="42" cy="43" r="3.2" fill={pupilColor} />
        <circle cx="43.5" cy="41.5" r="0.9" fill="#FFFFFF" />

        {/* Right Eye */}
        <circle cx="58" cy="43" r="7.5" fill={eyeBg} />
        <circle cx="58" cy="43" r="3.2" fill={pupilColor} />
        <circle cx="59.5" cy="41.5" r="0.9" fill="#FFFFFF" />

        {/* Beak */}
        <path d="M47.5 48.5H52.5L50 53L47.5 48.5Z" fill={beakColor} />

        {/* Feet */}
        <circle cx="45" cy="78" r="2.2" fill={beakColor} />
        <circle cx="55" cy="78" r="2.2" fill={beakColor} />
      </g>
    </svg>
  );
}
