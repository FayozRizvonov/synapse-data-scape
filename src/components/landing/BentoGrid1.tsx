import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, Mic, BarChart3, Sparkles, Shield, Zap, FileText } from 'lucide-react';

interface BentoGridItemProps {
	title: string;
	description: string;
	icon: ReactNode;
	className?: string;
	size?: 'small' | 'medium' | 'large';
}

const iconVariants = {
	initial: { rotate: 0, scale: 1 },
	animate: {
		rotate: [0, 10, -10, 0],
		scale: [1, 1.05, 1],
		transition: {
			duration: 2,
			repeat: Infinity,
			repeatDelay: 1.5,
			ease: 'easeInOut',
		},
	},
};

const BentoGridItem = ({ title, description, icon, className, size = 'small' }: BentoGridItemProps) => {
	const cardVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } } as any,
	};

	return (
		<motion.div
			variants={cardVariants}
			className={cn(
				'group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black/50 px-6 pt-6 pb-8 shadow-md transition-all duration-500 hover:shadow-xl',
				className,
			)}
		>
			{/* Background grid effect */}
			<div className="absolute top-0 -right-1/2 z-0 size-full bg-[linear-gradient(to_right,#3d16165e_1px,transparent_1px),linear-gradient(to_bottom,#3d16165e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

			{/* Big background icon */}
			<div className="absolute right-2 bottom-3 text-primary/5 group-hover:text-primary/10 z-0 scale-[6] transition-all duration-700 group-hover:scale-[6.5]">
				<motion.div variants={iconVariants} initial="initial" animate="animate">
					{icon}
				</motion.div>
			</div>

			{/* Main content */}
			<div className="relative z-10 flex flex-col justify-between h-full">
				<div>
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow transition-all duration-500 group-hover:bg-primary/20">
						<motion.div variants={iconVariants} initial="initial" animate="animate">
							{icon}
						</motion.div>
					</div>
					<h3 className="text-xl font-semibold text-foreground mb-1">{title}</h3>
					<p className="text-muted-foreground text-sm leading-snug">{description}</p>
				</div>
				<div className="mt-4 flex items-center text-sm font-medium text-primary">
					<span>Learn more</span>
					<ArrowRight className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
				</div>
			</div>

			{/* Bottom glow */}
			<div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/30 blur-2xl transition-all duration-500 group-hover:blur-lg" />
		</motion.div>
	);
};

const items = [
	{
		title: 'Voice Assistant',
		description: 'Speak your query — we transcribe, analyze, and voice the answer.',
		icon: <Mic className="size-6" />,
		size: 'large' as const,
	},
	{
		title: 'Pharma Analytics',
		description: 'Trends, shares, forecasts and comparisons at brand and category level.',
		icon: <BarChart3 className="size-6" />,
		size: 'small' as const,
	},
	{
		title: 'Insight Cards',
		description: 'Structured answers: period, YoY, leaders, risks, actions.',
		icon: <Sparkles className="size-6" />,
		size: 'medium' as const,
	},
	{
		title: 'Performance',
		description: '60fps animations, fast responses and an optimized UI.',
		icon: <Zap className="size-6" />,
		size: 'medium' as const,
	},
	{
		title: 'Security',
		description: 'GDPR/HIPAA compliant, data privacy and access control.',
		icon: <Shield className="size-6" />,
		size: 'small' as const,
	},
	{
		title: 'Reports & Rollout',
		description: 'Ready-to-use report templates and quick integration.',
		icon: <FileText className="size-6" />,
		size: 'large' as const,
	},
];

export function BentoGrid1() {
	const containerVariants = {
		hidden: {},
		visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
	};

	return (
		<section className="w-full px-4 py-16 sm:py-20 md:py-24">
			<div className="mx-auto max-w-7xl">
				<motion.div
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6"
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.2 }}
				>
					{items.map((item, index) => (
						<BentoGridItem
							key={index}
							title={item.title}
							description={item.description}
							icon={item.icon}
							size={item.size}
							className={cn(
								item.size === 'large'
									? 'col-span-6 md:col-span-4'
								: item.size === 'medium'
									? 'col-span-6 sm:col-span-3'
									: 'col-span-6 sm:col-span-2',
							)}
						/>
					))}
				</motion.div>
			</div>
		</section>
	);
}
