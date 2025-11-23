"use client";
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SmoothScroll } from '@/components/SmoothScroll';
export function LayoutShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isAdmin = pathname?.startsWith('/admin');
	if (isAdmin) {
		return <>{children}</>;
	}
	return (
		<SmoothScroll
			options={{
				duration: 1.2,
				easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
				smoothWheel: true,
				wheelMultiplier: 1,
				touchMultiplier: 2,
				lerp: 0.1,
			}}
		>
			<Header />
			<main className="overflow-x-hidden">
				{children}
			</main>
			<Footer />
		</SmoothScroll>
	);
}
