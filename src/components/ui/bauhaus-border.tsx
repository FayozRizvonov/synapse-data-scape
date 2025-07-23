import React, { useRef, useEffect } from "react";

const BAUHAUS_BORDER_STYLES = `
.bauhaus-border {
  position: relative;
  z-index: 1;
  border-radius: var(--bauhaus-border-radius, 1.25em);
  border: var(--bauhaus-border-width, 2px) solid transparent;
  --bauhaus-rotation: 4.2rad;
  background-image:
    linear-gradient(var(--bauhaus-border-bg), var(--bauhaus-border-bg)),
    linear-gradient(calc(var(--bauhaus-rotation,4.2rad)), var(--bauhaus-border-accent) 0, var(--bauhaus-border-bg) 30%, transparent 80%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  transition: box-shadow 0.3s, transform 0.3s;
}
.bauhaus-border:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}
`;

export interface BauhausBorderProps {
  children: React.ReactNode;
  borderRadius?: string;
  borderWidth?: string;
  accentColor?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const BauhausBorder: React.FC<BauhausBorderProps> = ({
  children,
  borderRadius = "1.25em",
  borderWidth = "2px",
  accentColor = "var(--bauhaus-border-accent)",
  backgroundColor = "var(--bauhaus-border-bg)",
  style = {},
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("bauhaus-border-styles")) {
      const style = document.createElement("style");
      style.id = "bauhaus-border-styles";
      style.innerHTML = BAUHAUS_BORDER_STYLES;
      document.head.appendChild(style);
    }
    const el = ref.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const angle = Math.atan2(y, x);
        el.style.setProperty("--bauhaus-rotation", angle + "rad");
      }
    };
    const handleMouseLeave = () => {
      if (el) {
        el.style.setProperty("--bauhaus-rotation", "4.2rad");
      }
    };
    if (el) {
      el.addEventListener("mousemove", handleMouseMove);
      el.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (el) {
        el.removeEventListener("mousemove", handleMouseMove);
        el.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`bauhaus-border ${className}`}
      style={{
        '--bauhaus-border-radius': borderRadius,
        '--bauhaus-border-width': borderWidth,
        '--bauhaus-border-accent': accentColor,
        '--bauhaus-border-bg': backgroundColor,
        ...style,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}; 