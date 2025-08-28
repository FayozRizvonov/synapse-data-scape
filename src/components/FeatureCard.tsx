import { cn } from '@/lib/utils';
import React from 'react';
import { BauhausBorder } from './ui/bauhaus-border';
import { useTheme } from '@/hooks/useTheme';
import { MoreVertical, Share2, Download, MessageSquare } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem
} from './ui/dropdown-menu';

type FeatureType = {
	title: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	description: string;
	value?: string;
	change?: string;
	changeType?: 'positive' | 'negative';
	comparison?: string;
	category?: 'key' | 'situation';
};

type FeatureCardProps = React.ComponentProps<'div'> & {
	feature: FeatureType;
	onClick?: () => void;
	id?: string;
};

export function FeatureCard({ feature, className, onClick, id, ...props }: FeatureCardProps) {
	const p = genRandomPattern();
	const { theme } = useTheme();
	const backgroundColor = 'var(--bg-card)';

	  // Settings for Key Metrics
	const isKeyMetric = feature.category === 'key';
	const borderWidth = isKeyMetric ? '4px' : '2px';
	const accentColor = isKeyMetric ? 'var(--metric-key)' : 'hsl(var(--accent))';

	return (
		<div className="p-2">
			<BauhausBorder
				borderRadius="1.25em"
				borderWidth={borderWidth}
				accentColor={accentColor}
				backgroundColor={backgroundColor}
				className={className}
			>
				<div 
					id={id}
					className={cn('relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:scale-105', '')} 
					onClick={onClick}
					{...props}
				>
					<div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
						<div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
							<GridPattern
								width={20}
								height={20}
								x="-12"
								y="4"
								squares={p}
								className="fill-foreground/5 stroke-foreground/25 absolute inset-0 h-full w-full mix-blend-overlay"
							/>
						</div>
					</div>
					<feature.icon className="text-foreground/75 size-6" strokeWidth={1} aria-hidden />
					<h3 className="mt-10 text-sm md:text-base font-semibold text-foreground">{feature.title}</h3>
					{feature.value && (
						<div className="mt-2 flex items-end gap-2">
							<span className={`text-2xl font-bold ${feature.value.includes('%') ? 'text-success-foreground' : 'text-foreground'}`}>{feature.value}</span>
							{feature.change && (
								<span className={`text-sm font-medium ${
									feature.changeType === 'positive' ? 'text-success-foreground' : 'text-error-foreground'
								}`}>{feature.change}</span>
							)}
						</div>
					)}
					{feature.comparison && (
						<p className="text-xs text-muted-foreground mt-1">{feature.comparison}</p>
					)}
					<p className="relative z-20 mt-2 text-xs font-light text-muted-foreground">{feature.description}</p>
					{/* Three dots menu in the top right corner */}
					<div className="absolute top-3 right-3 z-30">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button aria-label="Open menu" className="p-1 rounded-full transition-colors hover:bg-white/30 dark:hover:bg-white/10">
										<MoreVertical className="w-5 h-5 text-gray-700 dark:text-white/80 opacity-80 hover:opacity-100" />
									</button>
								</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="backdrop-blur-md border shadow-xl p-1 bg-white/90 dark:bg-black/30 dark:backdrop-blur-md dark:border-white/10 dark:shadow-none">
								<DropdownMenuItem onClick={e => { e.stopPropagation(); alert('Share'); }}>
									<Share2 className="w-4 h-4 mr-2" /> Share
								</DropdownMenuItem>
								<DropdownMenuItem onClick={e => { e.stopPropagation(); alert('Download'); }}>
									<Download className="w-4 h-4 mr-2" /> Download
								</DropdownMenuItem>
								<DropdownMenuItem onClick={e => { e.stopPropagation(); alert('Ask Assistant'); }}>
									<MessageSquare className="w-4 h-4 mr-2" /> Ask Assistant
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{/* End three dots menu */}
				</div>
			</BauhausBorder>
		</div>
	);
}

function GridPattern({
	width,
	height,
	x,
	y,
	squares,
	...props
}: React.ComponentProps<'svg'> & { width: number; height: number; x: string; y: string; squares?: number[][] }) {
	const patternId = React.useId();

	return (
		<svg aria-hidden="true" {...props}>
			<defs>
				<pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
					<path d={`M.5 ${height}V.5H${width}`} fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
			{squares && (
				<svg x={x} y={y} className="overflow-visible">
					{squares.map(([x, y], index) => (
						<rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
					))}
				</svg>
			)}
		</svg>
	);
}

function genRandomPattern(length?: number): number[][] {
	length = length ?? 5;
	return Array.from({ length }, () => [
		Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
		Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
	]);
} 