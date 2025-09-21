"use client"

import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

interface AnimatedRadialChartProps {
  value?: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabels?: boolean
  duration?: number
  baseline?: number
  percentMode?: "value" | "delta"
}

export function AnimatedRadialChart({ 
  value = 74, 
  size = 310,
  strokeWidth: customStrokeWidth,
  className,
  showLabels = true,
  duration = 2,
  baseline = 47,
  percentMode = "value"
}: AnimatedRadialChartProps) {
  // Dynamic stroke width based on size if not provided
  const strokeWidth = customStrokeWidth ?? Math.max(12, size * 0.06)
  const radius = size * 0.35
  const center = size / 2
  const circumference = Math.PI * radius

  // Calculate inner line radius (4px inside the main arc)
  const innerLineRadius = radius - strokeWidth - 4

  // Motion values for animation
  const animatedValue = useMotionValue(0)
  const offset = useTransform(animatedValue, [0, 100], [circumference, 0])

  // Calculate animated positions
  const progressAngle = useTransform(animatedValue, [0, 100], [-Math.PI, 0])
  const innerRadius = radius - strokeWidth / 2

  // Animate to the target value on mount or when value changes
  useEffect(() => {
    const controls = animate(animatedValue, value, {
      duration,
      ease: "easeOut",
    })

    return controls.stop
  }, [value, animatedValue, duration])

  // Calculate responsive font size
  const fontSize = Math.max(10, size * 0.13)
  const percentFontSize = Math.max(12, size * 0.07)
  const labelFontSize = Math.max(10, size * 0.04)

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} className="overflow-visible">
        <defs>
          {/* Base track gradient - light gray */}
          <linearGradient id={`baseGradient-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--border-secondary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--border-primary)" stopOpacity="0.7" />
          </linearGradient>

          {/* Progress gradient - cyan/blue */}
          <linearGradient id={`progressGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--chart-primary)" />
            <stop offset="100%" stopColor="var(--chart-senary)" />
          </linearGradient>

          {/* Text gradient - white to gray */}
          <linearGradient id={`textGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--text-inverse)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--text-secondary)" stopOpacity="0.5" />
          </linearGradient>

          {/* Drop shadow filter */}
          <filter id={`dropshadow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--text-primary)" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Inner thin line (1px cyan) */}
        <path
          d={`M ${center - innerLineRadius} ${center} A ${innerLineRadius} ${innerLineRadius} 0 0 1 ${center + innerLineRadius} ${center}`}
          fill="none"
          stroke="var(--chart-primary)"
          strokeWidth="1"
          strokeLinecap="butt"
          opacity="0.7"
        />

        {/* Base track */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={`url(#baseGradient-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          filter={`url(#dropshadow-${size})`}
        />

        {/* Animated Progress track */}
        <motion.path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={`url(#progressGradient-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#dropshadow-${size})`}
        />

        {/* Animated extending line */}
        <motion.line
          x1={useTransform(progressAngle, (angle) => center + Math.cos(angle) * innerRadius)}
          y1={useTransform(progressAngle, (angle) => center + Math.sin(angle) * innerRadius)}
          x2={useTransform(progressAngle, (angle) => center + Math.cos(angle) * innerRadius - Math.cos(angle) * 30)}
          y2={useTransform(progressAngle, (angle) => center + Math.sin(angle) * innerRadius - Math.sin(angle) * 30)}
          stroke={`url(#textGradient-${size})`}
          strokeWidth="1"
          strokeLinecap="butt"
        />
      </svg>

      {/* Animated center number display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="font-bold tracking-tight mt-10"
          style={{ fontSize: `${fontSize}px` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: duration * 0.75 }}
        >
          <span
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <motion.span>{useTransform(animatedValue, (latest) => Math.round(latest))}</motion.span>
          </span>
        </motion.div>
        {/* Percent below number */}
        <motion.div
          className="font-semibold mt-1"
          style={{ fontSize: `${percentFontSize}px`, color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: duration * 0.85 }}
        >
          {useTransform(animatedValue, (latest) => {
            if (percentMode === "delta") {
              const delta = baseline === 0 ? 0 : ((latest - baseline) / baseline) * 100
              const signed = delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`
              return signed
            }
            return `${(latest/100).toFixed(1)}%`
          })}
        </motion.div>
      </div>

      {/* 0% and 100% labels */}
      {showLabels && (
        <>
          <motion.div
            className="absolute text-gray-400 font-medium"
            style={{
              fontSize: `${labelFontSize}px`,
              left: center - radius - 5,
              top: center + strokeWidth / 2,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: duration * 0.25 }}
          >
            0%
          </motion.div>
          <motion.div
            className="absolute text-gray-400 font-medium"
            style={{
              fontSize: `${labelFontSize}px`,
              left: center + radius - 20,
              top: center + strokeWidth / 2,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: duration * 0.25 }}
          >
            100%
          </motion.div>
        </>
      )}
    </div>
  )
} 