"use client";
import { motion } from "framer-motion";

export default function Glow({ className = "" }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      initial={{opacity:0.25, filter:"blur(40px)" }}
      animate={{opacity:0.45}}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(40% 40% at 70% 30%, var(--neon)/0.25 0%, transparent 60%),
                     radial-gradient(30% 30% at 30% 70%, var(--neon-alt)/0.25 0%, transparent 60%)`
      }}
    />
  );
}


