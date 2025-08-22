import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				'host-grotesk': ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				brand: {
					bg: 'var(--bg)',
					card: 'var(--card)',
					fg: 'var(--fg)',
					neon: 'var(--neon)',
					neonAlt: 'var(--neon-alt)',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				cyan: {
					400: 'hsl(var(--cyan-400))',
					500: 'hsl(var(--cyan-500))',
				},
				blue: {
					500: 'hsl(var(--blue-500))',
				},
				indigo: {
					500: 'hsl(var(--indigo-500))',
				},
				purple: {
					500: 'hsl(var(--purple-500))',
				},
				pink: {
					500: 'hsl(var(--pink-500))',
				},
				green: {
					500: 'hsl(var(--green-500))',
				},
				teal: {
					500: 'hsl(var(--teal-500))',
				},
				yellow: {
					500: 'hsl(var(--yellow-500))',
				},
				orange: {
					500: 'hsl(var(--orange-500))',
				},
				/* -------------------------------------------------- */
				/* Новые токены, ссылающиеся на CSS-переменные темы  */
				/* -------------------------------------------------- */
				// Статусы
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-light))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-light))',
				},
				error: {
					DEFAULT: 'hsl(var(--error))',
					foreground: 'hsl(var(--error-light))',
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-light))',
				},

				// Палитра графиков
				'chart-primary': 'hsl(var(--chart-primary))',
				'chart-secondary': 'hsl(var(--chart-secondary))',
				'chart-tertiary': 'hsl(var(--chart-tertiary))',
				'chart-quaternary': 'hsl(var(--chart-quaternary))',
				'chart-quinary': 'hsl(var(--chart-quinary))',
				'chart-senary': 'hsl(var(--chart-senary))',

				// Специальные
				'metric-key': 'hsl(var(--metric-key))',
			},
			boxShadow: {
				// Глубокая карточная тень, совпадающая с прежним дизайном
				card: 'var(--shadow-card, 1px 12px 25px rgba(0,0,0,0.78))',
				holo: 'var(--shadow-holo, 0 0 20px var(--holo-shadow-strong))',
				glow: '0 0 24px rgba(0, 255, 170, 0.35)',
				glowBlue: '0 0 24px rgba(0, 170, 255, 0.35)',
			},
			backgroundImage: {
				'gradient-cyan': 'var(--gradient-cyan)',
				'gradient-blue': 'var(--gradient-blue)',
				'gradient-purple': 'var(--gradient-purple)',
				'gradient-green': 'var(--gradient-green)',
				'gradient-yellow': 'var(--gradient-yellow)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'holographic-pulse': {
					'0%, 100%': {
						borderColor: 'var(--holo-border)',
						boxShadow: 'var(--holo-shadow)'
					},
					'50%': {
						borderColor: 'var(--holo-border-strong)',
						boxShadow: 'var(--holo-shadow-strong)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px) rotate(0deg)',
						opacity: '0.6'
					},
					'50%': {
						transform: 'translateY(-20px) rotate(180deg)',
						opacity: '1'
					}
				},
				'neural-pulse': {
					'0%, 100%': {
						opacity: '0.3',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.8',
						transform: 'scale(1.05)'
					}
				},
				'wave-spread': {
					'0%': {
						transform: 'translate(-50%, -50%) scale(0)',
						opacity: '1'
					},
					'100%': {
						transform: 'translate(-50%, -50%) scale(1)',
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'holographic-pulse': 'holographic-pulse 2s infinite',
				'float': 'float 6s ease-in-out infinite',
				'neural-pulse': 'neural-pulse 2s infinite',
				'wave-spread': 'wave-spread 4s infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
