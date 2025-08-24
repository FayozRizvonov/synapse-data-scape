import React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGroupProps {
	children: React.ReactNode;
	className?: string;
	variants?: {
		container?: Variants;
		item?: Variants;
	};
	viewportAmount?: number;
	once?: boolean;
}

export const AnimatedGroup: React.FC<AnimatedGroupProps> = ({
	children,
	className,
	variants,
	viewportAmount = 0.3,
	once = true,
}) => {
	const containerVariants: Variants = variants?.container || {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
	};
	const itemVariants: Variants = variants?.item || {
		hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
		visible: { opacity: 1, y: 0, filter: "blur(0px)" },
	};

	return (
		<motion.div
			className={cn(className)}
			variants={containerVariants}
			initial="hidden"
			whileInView="visible"
			viewport={{ amount: viewportAmount, once }}
		>
			{React.Children.map(children, (child, index) => (
				<motion.div key={index} variants={itemVariants}>
					{child}
				</motion.div>
			))}
		</motion.div>
	);
};

export default AnimatedGroup;



