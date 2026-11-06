import React, { useEffect, useRef } from 'react';

interface SkeletonProps {
    className?: string;
}

export function SkeletonBox({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden bg-slate-100 rounded-2xl ${className}`}
        >
            <div className="absolute inset-0 shimmer" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4">
                        <div className="flex justify-between items-start">
                            <SkeletonBox className="h-3 w-28" />
                            <SkeletonBox className="h-8 w-8 rounded-xl" />
                        </div>
                        <SkeletonBox className="h-10 w-24" />
                        <SkeletonBox className="h-3 w-36" />
                        <div className="pt-3 border-t border-slate-100 flex justify-between">
                            <SkeletonBox className="h-3 w-20" />
                            <SkeletonBox className="h-3 w-10" />
                        </div>
                    </div>
                ))}
            </div>
            {/* Chart + sedes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4">
                    <SkeletonBox className="h-4 w-48" />
                    <SkeletonBox className="h-64 w-full rounded-2xl" />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4">
                    <SkeletonBox className="h-4 w-32" />
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <SkeletonBox className="h-3 w-full" />
                            <SkeletonBox className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
    return (
        <tr>
            {[...Array(cols)].map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <SkeletonBox className="h-4 w-full max-w-[120px]" />
                </td>
            ))}
        </tr>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-3">
                <SkeletonBox className="h-10 w-10 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-3 w-3/4" />
                    <SkeletonBox className="h-3 w-1/2" />
                </div>
            </div>
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-3 w-4/5" />
        </div>
    );
}

/** Hook para animar elementos al entrar en viewport */
export function useScrollReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.remove('opacity-0', 'translate-y-4');
                    el.classList.add('opacity-100', 'translate-y-0');
                    observer.unobserve(el);
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return ref;
}

/** Wrapper que aplica reveal al hacer scroll */
export function RevealOnScroll({
    children,
    className = '',
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useScrollReveal();

    return (
        <div
            ref={ref}
            className={`opacity-0 translate-y-4 transition-all duration-500 ease-out ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
