import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { ChevronDown, MapPin } from 'lucide-react';

interface BarrioInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function BarrioInput({
    value,
    onChange,
    placeholder = 'Buscar o escribir barrio / vereda...',
    className = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none bg-white',
}: BarrioInputProps) {
    const { catalogs } = usePage<any>().props;
    const barrios: string[] = catalogs?.barrios || [];
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

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
                        onChange(e.target.value);
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
                                setOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-900 transition-colors ${
                                value.toLowerCase() === barrio.toLowerCase()
                                    ? 'bg-emerald-50 font-bold text-emerald-800'
                                    : 'text-slate-700'
                            }`}
                        >
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{barrio}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
