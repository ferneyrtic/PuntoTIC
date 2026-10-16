import React, { useState, useEffect } from 'react';
import {
    Wifi,
    WifiOff,
    RefreshCw,
    Download,
    CheckCircle2,
    AlertCircle,
    X,
    Database,
    UploadCloud,
    Trash2,
} from 'lucide-react';
import {
    getOfflineQueue,
    syncOfflineQueue,
    removeOfflineItem,
    clearOfflineQueue,
    promptPwaInstall,
    isPwaStandalone,
    OfflineRecord,
} from '@/services/pwaService';

export default function PwaStatusBanner() {
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [offlineQueue, setOfflineQueue] = useState<OfflineRecord[]>(getOfflineQueue());
    const [syncing, setSyncing] = useState<boolean>(false);
    const [syncResult, setSyncResult] = useState<{ message: string; success: boolean } | null>(null);
    const [showQueueModal, setShowQueueModal] = useState<boolean>(false);
    const [canInstall, setCanInstall] = useState<boolean>(false);
    const [isStandaloneApp, setIsStandaloneApp] = useState<boolean>(false);
    const [justRestored, setJustRestored] = useState<boolean>(false);

    useEffect(() => {
        setIsStandaloneApp(isPwaStandalone());

        const handleOnline = async () => {
            setIsOnline(true);
            setJustRestored(true);
            setTimeout(() => setJustRestored(false), 5000);

            // Auto-sincronizar cola al recuperar internet
            const currentQueue = getOfflineQueue();
            if (currentQueue.length > 0) {
                handleSync();
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setJustRestored(false);
        };

        const handleQueueUpdated = (e: any) => {
            setOfflineQueue(e.detail?.queue || getOfflineQueue());
        };

        const handleInstallable = (e: any) => {
            setCanInstall(e.detail?.available ?? true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('pwa-queue-updated', handleQueueUpdated);
        window.addEventListener('pwa-installable', handleInstallable);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('pwa-queue-updated', handleQueueUpdated);
            window.removeEventListener('pwa-installable', handleInstallable);
        };
    }, []);

    const handleSync = async () => {
        if (syncing || !isOnline) return;
        setSyncing(true);
        setSyncResult(null);

        try {
            const res = await syncOfflineQueue();
            if (res.total > 0) {
                if (res.failed === 0) {
                    setSyncResult({
                        message: `Sincronización exitosa: ${res.success} registros procesados correctamente.`,
                        success: true,
                    });
                } else {
                    setSyncResult({
                        message: `Sincronizados ${res.success} de ${res.total} registros. ${res.failed} con error de validación.`,
                        success: false,
                    });
                }
            }
        } catch (err: any) {
            setSyncResult({
                message: 'No fue posible completar la sincronización con el servidor.',
                success: false,
            });
        } finally {
            setSyncing(false);
            setOfflineQueue(getOfflineQueue());
        }
    };

    const handleInstallClick = async () => {
        const accepted = await promptPwaInstall();
        if (accepted) {
            setCanInstall(false);
        }
    };

    return (
        <>
            {/* 1. Alerta de Estado Fuera de Línea */}
            {!isOnline && (
                <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm border-b border-amber-600/40">
                    <div className="flex items-center gap-2 max-w-2xl">
                        <div className="p-1 rounded-lg bg-amber-600/20 text-slate-950 shrink-0">
                            <WifiOff className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="font-bold">Modo Fuera de Línea Activo:</span>{' '}
                            <span>
                                La plataforma está operando con datos en caché. Cualquier visita registrada se guardará en este equipo y se sincronizará cuando regrese internet.
                            </span>
                        </div>
                    </div>
                    {offlineQueue.length > 0 && (
                        <button
                            onClick={() => setShowQueueModal(true)}
                            className="btn-tactile ml-3 px-3 py-1 rounded-lg bg-slate-950 text-amber-300 font-bold hover:bg-slate-900 transition-colors shrink-0"
                        >
                            Cola ({offlineQueue.length})
                        </button>
                    )}
                </div>
            )}

            {/* 2. Alerta de Conexión Restablecida */}
            {isOnline && justRestored && (
                <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in-down">
                    <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        <span>Conexión restablecida con el servidor. Sincronizando datos...</span>
                    </div>
                </div>
            )}

            {/* 3. Banner de Registros Pendientes de Sincronización */}
            {isOnline && offlineQueue.length > 0 && (
                <div className="bg-indigo-50 border-b border-indigo-200 text-indigo-950 px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                            <Database className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="font-bold">{offlineQueue.length} {offlineQueue.length === 1 ? 'registro pendiente' : 'registros pendientes'}</span>{' '}
                            <span>guardados fuera de línea listos para enviar a la base de datos central.</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowQueueModal(true)}
                            className="btn-tactile px-3 py-1 rounded-lg border border-indigo-300 bg-white text-indigo-800 font-semibold hover:bg-indigo-50 text-xs transition-colors"
                        >
                            Ver detalles
                        </button>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 text-xs shadow-xs transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* 4. Notificación de Resultado de Sincronización */}
            {syncResult && (
                <div
                    className={`px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                        syncResult.success ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' : 'bg-rose-50 text-rose-900 border-b border-rose-200'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {syncResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{syncResult.message}</span>
                    </div>
                    <button
                        onClick={() => setSyncResult(null)}
                        className="btn-tactile p-1 text-slate-500 hover:text-slate-800"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* 5. Modal de Cola de Registros Fuera de Línea */}
            {showQueueModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Cola de Sincronización Fuera de Línea
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Registros almacenados localmente en este navegador
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowQueueModal(false)}
                                className="btn-tactile p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="py-4 max-h-72 overflow-y-auto space-y-2">
                            {offlineQueue.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    No hay registros pendientes de sincronización.
                                </div>
                            ) : (
                                offlineQueue.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-slate-800 truncate">
                                                {item.summary}
                                            </div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                <span className="uppercase font-semibold tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                                    {item.type}
                                                </span>
                                                <span>
                                                    {new Date(item.createdAt).toLocaleTimeString('es-CO', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                                {item.error && (
                                                    <span className="text-rose-600 truncate max-w-[150px]">
                                                        {item.error}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeOfflineItem(item.id)}
                                            className="btn-tactile p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                            title="Eliminar de la cola"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            {offlineQueue.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (confirm('¿Desea limpiar todos los registros pendientes?')) {
                                            clearOfflineQueue();
                                        }
                                    }}
                                    className="btn-tactile text-xs text-rose-600 hover:text-rose-800 font-semibold"
                                >
                                    Vaciar cola
                                </button>
                            )}
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => setShowQueueModal(false)}
                                    className="btn-tactile px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cerrar
                                </button>
                                {isOnline && offlineQueue.length > 0 && (
                                    <button
                                        onClick={() => {
                                            handleSync();
                                            setShowQueueModal(false);
                                        }}
                                        disabled={syncing}
                                        className="btn-tactile inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <UploadCloud className="w-3.5 h-3.5" />
                                        <span>Sincronizar</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
