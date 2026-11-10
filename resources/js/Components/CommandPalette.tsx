import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Search,
    LayoutDashboard,
    UserPlus,
    CalendarCheck,
    Users,
    History,
    DoorOpen,
    Printer,
    FileSpreadsheet,
    Settings,
    User,
    ArrowRight,
    X,
    Laptop,
    Sparkles,
} from 'lucide-react';
import axios from 'axios';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: Props) {
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;
    const userRole = currentUser?.role || '';
    const userRoles: string[] = currentUser?.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [];
    const isCitizen = Boolean(
        currentUser?.es_usuario_ciudadano ||
        userRole === 'Usuario' ||
        userRole === 'Ciudadano' ||
        userRoles.includes('Usuario') ||
        userRoles.includes('Ciudadano')
    );
    const isAdmin = Boolean(
        auth?.is_admin ||
        currentUser?.is_admin ||
        currentUser?.roles_nombres?.includes('Administrador')
    );

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [citizens, setCitizens] = useState<Array<any>>([]);
    const [searchingCitizens, setSearchingCitizens] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const defaultCommands = [
        {
            id: 'dashboard',
            name: 'Panel de Control',
            description: 'Métricas institucionales y analítica en vivo',
            icon: LayoutDashboard,
            url: route('dashboard'),
            category: 'Navegación',
        },
        {
            id: 'visitas-create',
            name: 'Registrar Visita / Atención',
            description: 'Formulario rápido de atención presencial en sala',
            icon: UserPlus,
            url: route('visitas.create'),
            category: 'Operación',
            badge: 'Frecuente',
        },
        {
            id: 'visitas-index',
            name: 'Historial de Visitas',
            description: 'Registro histórico y búsqueda detallada de atenciones',
            icon: CalendarCheck,
            url: route('visitas.index'),
            category: 'Operación',
        },
        {
            id: 'ciudadanos-index',
            name: 'Directorio de Ciudadanos',
            description: 'Padrón de usuarios, demografía y búsqueda de expedientes',
            icon: Users,
            url: route('ciudadanos.index'),
            category: 'Operación',
        },
        ...(isAdmin
            ? [
                  {
                      id: 'auditoria-index',
                      name: 'Registro de Auditoría y Trazabilidad',
                      description: 'Historial de eventos, cambios y gestores responsables',
                      icon: History,
                      url: route('auditoria.index'),
                      category: 'Seguridad',
                      badge: 'Nuevo',
                  },
                  {
                      id: 'configuracion-index',
                      name: 'Configuración del Sistema',
                      description: 'Ajustes globales del sistema y motor de IA predictivo',
                      icon: Settings,
                      url: route('configuracion.index'),
                      category: 'Administración',
                  },
              ]
            : []),
        {
            id: 'prestamos-index',
            name: 'Préstamo de Salas',
            description: 'Control de auditorios, salas de capacitación y eventos',
            icon: DoorOpen,
            url: route('prestamos.index'),
            category: 'Servicios',
        },
        {
            id: 'impresiones-index',
            name: 'Impresiones y Copias',
            description: 'Registro de hojas y consumo de recursos comunitarios',
            icon: Printer,
            url: route('impresiones.index'),
            category: 'Servicios',
        },
        {
            id: 'exportar-index',
            name: 'Centro de Exportación y Reportes',
            description: 'Descargas en Excel, CSV y formato oficial GTIC-F-16',
            icon: FileSpreadsheet,
            url: route('exportar.index'),
            category: 'Reportes',
        },
        {
            id: 'profile-edit',
            name: 'Mi Perfil de Usuario',
            description: 'Información de la cuenta, contraseña y seguridad',
            icon: User,
            url: route('profile.edit'),
            category: 'Cuenta',
        },
    ];

    const citizenCommands = [
        {
            id: 'portal-index',
            name: 'Portal Ciudadano (Inicio)',
            description: 'Página principal, tus préstamos solicitados y visitas a sedes PVD',
            icon: LayoutDashboard,
            url: route('portal.index'),
            category: 'Mi Portal',
        },
        {
            id: 'portal-solicitar',
            name: 'Solicitar Espacio o Aula en PVD',
            description: 'Apartar sala para cursos, cineclub, JAC, eventos o reuniones comunitarias',
            icon: DoorOpen,
            url: route('portal.index'),
            category: 'Servicios',
            badge: 'Disponible',
        },
        {
            id: 'profile-edit',
            name: 'Mi Perfil de Usuario',
            description: 'Información de tu cuenta ciudadana y cambio de contraseña',
            icon: User,
            url: route('profile.edit'),
            category: 'Cuenta',
        },
    ];

    const activeCommands = isCitizen ? citizenCommands : defaultCommands;

    // Filtered navigation commands
    const filteredCommands = activeCommands.filter((cmd) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            cmd.name.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.category.toLowerCase().includes(q)
        );
    });

    // Debounced search for citizens (only for staff, disabled for citizens)
    useEffect(() => {
        if (isCitizen) {
            setCitizens([]);
            setSearchingCitizens(false);
            return;
        }

        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setCitizens([]);
            setSearchingCitizens(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchingCitizens(true);
            try {
                const res = await axios.get(route('ciudadanos.buscar-estudiantes'), {
                    params: { q: trimmed },
                });
                setCitizens(res.data?.slice(0, 5) || []);
            } catch (err) {
                console.error('Error buscando ciudadanos en paleta', err);
            } finally {
                setSearchingCitizens(false);
            }
        }, 220);

        return () => clearTimeout(timer);
    }, [query, isCitizen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard navigation (ArrowUp, ArrowDown, Enter, Esc)
    const totalItems = filteredCommands.length + citizens.length;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % (totalItems || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + (totalItems || 1)) % (totalItems || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex < filteredCommands.length) {
                const target = filteredCommands[selectedIndex];
                if (target) {
                    onClose();
                    router.get(target.url);
                }
            } else {
                const citizenIndex = selectedIndex - filteredCommands.length;
                const cit = citizens[citizenIndex];
                if (cit) {
                    onClose();
                    router.get(route('visitas.create'), { documento: cit.documento });
                }
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Bar Input */}
                <div className="relative border-b border-slate-100 flex items-center px-4 py-3.5 bg-slate-50/50">
                    <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe una acción, módulo o número de cédula..."
                        className="w-full bg-transparent border-none text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-0 p-0"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 mr-2"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-600 font-mono">
                        ESC para cerrar
                    </span>
                </div>

                {/* Results List */}
                <div className="overflow-y-auto p-2 space-y-3 divide-y divide-slate-100">
                    {/* Ciudadanos encontrados en vivo */}
                    {citizens.length > 0 && (
                        <div className="pt-1">
                            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Ciudadanos Encontrados (Acceso Rápido)</span>
                            </div>
                            <div className="space-y-1 mt-1">
                                {citizens.map((cit, idx) => {
                                    const itemIdx = filteredCommands.length + idx;
                                    const isSelected = selectedIndex === itemIdx;
                                    return (
                                        <div
                                            key={cit.id_form_pvd || cit.documento}
                                            onClick={() => {
                                                onClose();
                                                router.get(route('visitas.create'), {
                                                    documento: cit.documento,
                                                });
                                            }}
                                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                                            className={`px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                                                    : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                                                    CC
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">
                                                        {cit.nombre_completo || `${cit.nombres} ${cit.apellidos}`}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        Doc: {cit.documento} · {cit.barrio || 'Acacías'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                                                <span>Atender</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Navigation Commands */}
                    <div className="pt-1">
                        <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Navegación y Módulos
                        </div>
                        <div className="space-y-1 mt-1">
                            {filteredCommands.length === 0 && citizens.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                                    No se encontraron resultados para "{query}"
                                </div>
                            ) : (
                                filteredCommands.map((cmd, idx) => {
                                    const isSelected = selectedIndex === idx;
                                    const IconComponent = cmd.icon;
                                    return (
                                        <div
                                            key={cmd.id}
                                            onClick={() => {
                                                onClose();
                                                router.get(cmd.url);
                                            }}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white shadow-sm'
                                                    : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        isSelected
                                                            ? 'bg-slate-800 text-emerald-400'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div
                                                        className={`text-xs font-bold ${
                                                            isSelected ? 'text-white' : 'text-slate-900'
                                                        }`}
                                                    >
                                                        {cmd.name}
                                                    </div>
                                                    <div
                                                        className={`text-[11px] truncate max-w-sm ${
                                                            isSelected ? 'text-slate-300' : 'text-slate-500'
                                                        }`}
                                                    >
                                                        {cmd.description}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {cmd.badge && (
                                                    <span
                                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                                            isSelected
                                                                ? 'bg-emerald-500 text-slate-950 font-black'
                                                                : 'bg-emerald-100 text-emerald-800 font-bold'
                                                        }`}
                                                    >
                                                        {cmd.badge}
                                                    </span>
                                                )}
                                                <ArrowRight
                                                    className={`w-4 h-4 ${
                                                        isSelected ? 'text-emerald-400' : 'text-slate-300'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer hints */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600 shadow-2xs">
                                ↑
                            </kbd>
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600 shadow-2xs">
                                ↓
                            </kbd>{' '}
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600 shadow-2xs">
                                ↵
                            </kbd>{' '}
                            seleccionar
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400">PuntoTIC Acacías</span>
                </div>
            </div>
        </div>
    );
}
