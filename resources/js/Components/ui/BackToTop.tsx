import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > 320);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            onClick={scrollToTop}
            aria-label="Volver arriba"
            className={`fixed bottom-24 md:bottom-8 right-5 z-50 w-10 h-10 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 flex items-center justify-center transition-all duration-300 btn-tactile hover:bg-emerald-700 hover:shadow-emerald-800/30 ${
                visible
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
        >
            <ChevronUp className="w-5 h-5" />
        </button>
    );
}
