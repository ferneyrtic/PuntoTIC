import React from 'react';
import { usePage } from '@inertiajs/react';

interface GrupoPoblacionalSelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const FALLBACK_GRUPOS = [
    'Ninguno',
    'Discapacitados',
    'Desplazados',
    'Migrantes',
    'Gestantes',
    'Población infantil ICBF',
    'Madres comunitarias',
    'Desmovilizados',
    'Victimas',
    'Desplazamiento forzado',
    'Otros grupos',
];

export default function GrupoPoblacionalSelect({
    value,
    onChange,
    className = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-alcaldia-green outline-none bg-white',
}: GrupoPoblacionalSelectProps) {
    const { catalogs } = usePage<any>().props;
    const rawGrupos: string[] = catalogs?.grupos_poblacionales?.length
        ? catalogs.grupos_poblacionales
        : FALLBACK_GRUPOS;

    // Preservar valor actual si viene de un registro histórico
    const options =
        value && !rawGrupos.some((g) => g.toLowerCase() === value.toLowerCase())
            ? [value, ...rawGrupos]
            : rawGrupos;

    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
            {options.map((grupo) => (
                <option key={grupo} value={grupo}>
                    {grupo}
                </option>
            ))}
        </select>
    );
}
