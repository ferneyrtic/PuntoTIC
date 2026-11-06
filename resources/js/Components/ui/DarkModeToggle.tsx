import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface Props {
    className?: string;
    showLabel?: boolean;
}

export default function DarkModeToggle({ className = '', showLabel = false }: Props) {
    const [dark, setDark] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        // Solo activar si el usuario lo configuró explícitamente en dark
        return localStorage.getItem('puntotic-theme') === 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
            localStorage.setItem('puntotic-theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('puntotic-theme', 'light');
        }
    }, [dark]);

    return (
        <button
            onClick={() => setDark(!dark)}
            type="button"
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={dark ? 'Cambiar a modo claro (Luz)' : 'Cambiar a modo oscuro (Noche)'}
            className={`btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                dark
                    ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:text-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
            } ${className}`}
        >
            {dark ? (
                <>
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    {showLabel && <span className="text-xs font-bold text-amber-300">Modo Claro</span>}
                </>
            ) : (
                <>
                    <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                    {showLabel && <span className="text-xs font-bold text-slate-700">Modo Oscuro</span>}
                </>
            )}
        </button>
    );
}
