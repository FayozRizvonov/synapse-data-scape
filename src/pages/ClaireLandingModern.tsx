import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { cn } from '@/lib/utils';
import { BentoGrid1 } from '@/components/landing/BentoGrid1';

const transitionVariants = {
	item: {
		hidden: {
			opacity: 0,
			filter: 'blur(12px)',
			y: 12,
		},
		visible: {
			opacity: 1,
			filter: 'blur(0px)',
			y: 0,
			transition: {
				type: 'spring',
				bounce: 0.3,
				duration: 1.5,
			},
		},
	},
};

export default function ClaireLandingModern() {
	return (
		<>
			<HeroHeader />
			<main className="overflow-hidden">
				<section>
					<div className="relative pt-24 md:pt-36">
						{/* Keep our existing background from GlobalLayout. No extra background overlays here. */}
						<div className="mx-auto max-w-7xl px-6">
							<div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
								<AnimatedGroup variants={transitionVariants}>
									<a
										href="#link"
										className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
									>
										<span className="text-foreground text-sm">Introducing Claire AI for Pharma</span>
										<span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

										<div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
											<div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
												<span className="flex size-6">
													<ArrowRight className="m-auto size-3" />
												</span>
												<span className="flex size-6">
													<ArrowRight className="m-auto size-3" />
												</span>
											</div>
										</div>
									</a>

									<h1 className="mt-8 max-w-4xl mx-auto text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
										Claire AI — your intelligent pharmaceutical analyst
									</h1>
									<p className="mx-auto mt-8 max-w-2xl text-balance text-lg">
										Accurate answers. Fast insights. Voice assistant for pharmaceutical analytics.
									</p>
								</AnimatedGroup>

								<AnimatedGroup
									variants={{
										container: {
											visible: {
												transition: { staggerChildren: 0.05, delayChildren: 0.75 },
											},
										},
										...transitionVariants,
									}}
									className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
								>
									<div className="bg-foreground/10 rounded-[14px] border p-0.5">
										<Button asChild size="lg" className="rounded-xl px-5 text-base">
											<a href="#link">
												<span className="text-nowrap">Try demo</span>
											</a>
										</Button>
									</div>
									<Button key={2} asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
										<a href="#link">
											<span className="text-nowrap">Request a consultation</span>
										</a>
									</Button>
								</AnimatedGroup>
							</div>
						</div>

						{/* App screenshot card */}
						<AnimatedGroup
							variants={{
								container: {
									visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } },
								},
								...transitionVariants,
							}}
						>
							<div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
								<div aria-hidden className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%" />
								<div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
									<img
										className="bg-background aspect-15/8 relative rounded-2xl"
										src="/images/clairedashoard.png"
										alt="Claire dashboard"
										width="2700"
										height="1440"
									/>
								</div>
							</div>
						</AnimatedGroup>
					</div>
				</section>

				{/* Bento grid */}
				<BentoGrid1 />

				{/* Customers strip */}
				<section className="bg-background pb-16 pt-16 md:pb-32">
					<div className="group relative m-auto max-w-5xl px-6">
						<div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
							<a href="#" className="block text-sm duration-150 hover:opacity-75">
								<span> Meet Our Customers</span>
								<ChevronRight className="ml-1 inline-block size-3" />
							</a>
						</div>
						<div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
							<div className="flex">
								<img className="mx-auto h-5 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/nvidia.svg" alt="Nvidia Logo" height="20" />
							</div>
							<div className="flex">
								<img className="mx-auto h-4 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/column.svg" alt="Column Logo" height="16" />
							</div>
							<div className="flex">
								<img className="mx-auto h-4 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/github.svg" alt="GitHub Logo" height="16" />
							</div>
							<div className="flex">
								<img className="mx-auto h-5 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/nike.svg" alt="Nike Logo" height="20" />
							</div>
							<div className="flex">
								<img className="mx-auto h-5 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg" alt="Lemon Squeezy Logo" height="20" />
							</div>
							<div className="flex">
								<img className="mx-auto h-4 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/laravel.svg" alt="Laravel Logo" height="16" />
							</div>
							<div className="flex">
								<img className="mx-auto h-7 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/lilly.svg" alt="Lilly Logo" height="28" />
							</div>
							<div className="flex">
								<img className="mx-auto h-6 w-fit dark:invert" src="https://html.tailus.io/blocks/customers/openai.svg" alt="OpenAI Logo" height="24" />
							</div>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}

const menuItems = [
	{ name: 'Features', href: '#link' },
	{ name: 'Solution', href: '#link' },
	{ name: 'Pricing', href: '#link' },
	{ name: 'About', href: '#link' },
];

const HeroHeader = () => {
	const [menuState, setMenuState] = React.useState(false);
	const [isScrolled, setIsScrolled] = React.useState(false);

	React.useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 50);
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<header>
			<nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 group">
				<div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
					<div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
						<div className="flex w-full justify-between lg:w-auto">
							<a href="/" aria-label="home" className="flex items-center space-x-2">
								<Logo />
							</a>
							<button onClick={() => setMenuState(!menuState)} aria-label={menuState ? 'Close Menu' : 'Open Menu'} className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
								<Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
								<X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
							</button>
						</div>

						<div className="absolute inset-0 m-auto hidden size-fit lg:block">
							<ul className="flex gap-8 text-sm">
								{menuItems.map((item, index) => (
									<li key={index}>
										<a href={item.href} className="text-muted-foreground hover:text-accent-foreground block duration-150">
											<span>{item.name}</span>
										</a>
									</li>
								))}
							</ul>
						</div>

						<div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
							<div className="lg:hidden">
								<ul className="space-y-6 text-base">
									{menuItems.map((item, index) => (
										<li key={index}>
											<a href={item.href} className="text-muted-foreground hover:text-accent-foreground block duration-150">
												<span>{item.name}</span>
											</a>
										</li>
									))}
								</ul>
							</div>
							<div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
								<Button asChild variant="outline" size="sm" className={cn(isScrolled && 'lg:hidden')}>
									<a href="#"><span>Login</span></a>
								</Button>
								<Button asChild size="sm" className={cn(isScrolled && 'lg:hidden')}>
									<a href="#"><span>Sign Up</span></a>
								</Button>
								<Button asChild size="sm" className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
									<a href="#"><span>Get Started</span></a>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</nav>
		</header>
	);
};

const Logo = ({ className }: { className?: string }) => {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<img src="/images/claire_logo.png" alt="CLAIRE AI Logo" className="h-6 w-6 object-contain" />
			<span className="text-sm font-semibold">CLAIRE AI</span>
		</div>
	);
};
