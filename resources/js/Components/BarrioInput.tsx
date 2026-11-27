import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { ChevronDown, MapPin } from 'lucide-react';

interface BarrioMeta {
    up?: string;
    zona?: 'Urbana' | 'Rural';
}

interface BarrioInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelectMeta?: (meta: { barrio: string; up?: string; zona?: 'Urbana' | 'Rural' }) => void;
    placeholder?: string;
    className?: string;
}

export default function BarrioInput({
    value,
    onChange,
    onSelectMeta,
    placeholder = 'Buscar o escribir barrio / vereda...',
    className = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none bg-white',
}: BarrioInputProps) {
    const { catalogs } = usePage<any>().props;
    const barrios: string[] = catalogs?.barrios || [];
    const barriosMeta: Record<string, BarrioMeta> = catalogs?.barrios_meta || {};
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const emitMeta = (barrioName: string) => {
        if (!onSelectMeta) return;
        const key = barrioName.trim().toUpperCase();
        const found = barriosMeta[key];
        if (found) {
            onSelectMeta({ barrio: barrioName, up: found.up, zona: found.zona });
        } else if (key.startsWith('VEREDA ') || key.includes('CORREGIMIENTO')) {
            onSelectMeta({ barrio: barrioName, up: undefined, zona: 'Rural' });
        } else {
            onSelectMeta({ barrio: barrioName, up: undefined, zona: undefined });
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = useMemo(() => {
        const term = (value || '').trim().toLowerCase();
        if (!term) return barrios.slice(0, 60);
        return barrios.filter((b) => b.toLowerCase().includes(term)).slice(0, 60);
    }, [barrios, value]);

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={value}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange(val);
                        emitMeta(val);
                        setOpen(true);
                    }}
                    placeholder={placeholder}
                    className={`${className} pr-8`}
                    autoComplete="off"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setOpen((o) => !o)}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Ver lista de barrios y veredas"
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>
            </div>

            {open && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1">
                    {filtered.map((barrio, idx) => (
                        <button
                            key={`${barrio}-${idx}`}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(barrio);
                                emitMeta(barrio);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-emerald-50 hover:text-emerald-900 transition-colors ${
                                value.toLowerCase() === barrio.toLowerCase()
                                    ? 'bg-emerald-50 font-bold text-emerald-800'
                                    : 'text-slate-700'
                            }`}
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{barrio}</span>
                            </span>
                            {barriosMeta[barrio.trim().toUpperCase()]?.up && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                    {barriosMeta[barrio.trim().toUpperCase()].up}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
