"use client";
import React, { useEffect, useRef } from "react";

const BAUHAUS_GLOW_STYLES = `
.bauhaus-glow-card {
  position: relative;
  border-radius: var(--card-radius, 1rem);
  border: var(--card-border-width, 2px) solid transparent;
  --rotation: 4.2rad;
  background-image:
    linear-gradient(var(--card-bg), var(--card-bg)),
    linear-gradient(calc(var(--rotation,4.2rad)), var(--card-accent) 0, transparent 30%, transparent 80%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  transition: all 0.3s ease;
  overflow: hidden;
}

.bauhaus-glow-card::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: inherit;
  background: linear-gradient(calc(var(--rotation,4.2rad)), var(--card-accent) 0, transparent 30%, transparent 80%);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}

.bauhaus-glow-card:hover::before {
  opacity: 0.6;
}

.bauhaus-glow-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.bauhaus-glow-card .card-content {
  position: relative;
  z-index: 1;
  background: var(--card-bg);
  border-radius: inherit;
  height: 100%;
  width: 100%;
}
`;

function injectBauhausGlowStyles() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("bauhaus-glow-styles")) {
    const style = document.createElement("style");
    style.id = "bauhaus-glow-styles";
    style.innerHTML = BAUHAUS_GLOW_STYLES;
    document.head.appendChild(style);
  }
}

interface BauhausGlowCardProps {
  children: React.ReactNode;
  accentColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  className?: string;
  onClick?: () => void;
}

export const BauhausGlowCard: React.FC<BauhausGlowCardProps> = ({
  children,
  accentColor = "var(--bauhaus-card-accent)",
  backgroundColor = "var(--bauhaus-card-bg)",
  borderRadius = "1rem",
  borderWidth = "2px",
  className = "",
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectBauhausGlowStyles();
    const card = cardRef.current;
    
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const angle = Math.atan2(-x, y);
      card.style.setProperty("--rotation", angle + "rad");
    };

    const handleMouseEnter = () => {
      card.style.setProperty("--rotation", "0rad");
    };

    const handleMouseLeave = () => {
      card.style.setProperty("--rotation", "4.2rad");
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`bauhaus-glow-card ${className}`}
      style={{
        '--card-bg': backgroundColor,
        '--card-accent': accentColor,
        '--card-radius': borderRadius,
        '--card-border-width': borderWidth,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}; 