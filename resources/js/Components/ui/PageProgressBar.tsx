import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export default function PageProgressBar() {
    const [loading, setLoading] = useState(false);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        let increment: ReturnType<typeof setInterval>;

        const start = router.on('start', () => {
            setLoading(true);
            setWidth(0);
            // Simular progreso acelerado hasta 85%
            increment = setInterval(() => {
                setWidth((w) => {
                    if (w >= 85) {
                        clearInterval(increment);
                        return 85;
                    }
                    return w + Math.random() * 12;
                });
            }, 150);
        });

        const finish = router.on('finish', () => {
            clearInterval(increment);
            setWidth(100);
            timer = setTimeout(() => {
                setLoading(false);
                setWidth(0);
            }, 400);
        });

        return () => {
            start();
            finish();
            clearInterval(increment);
            clearTimeout(timer);
        };
    }, []);

    if (!loading && width === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 z-[9999] h-[3px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300 ease-out"
            style={{
                width: `${width}%`,
                opacity: loading || width > 0 ? 1 : 0,
            }}
        />
    );
}
