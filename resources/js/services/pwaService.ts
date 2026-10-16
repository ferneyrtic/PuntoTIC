/**
 * Servicio PWA para PuntoTIC - Alcaldía de Acacías
 * Manejo de Service Worker, detección de conectividad, cola fuera de línea e instalación.
 */
import axios from 'axios';

export interface OfflineRecord {
    id: string;
    type: 'visita' | 'ciudadano';
    data: any;
    summary: string;
    createdAt: string;
    retries: number;
    error?: string;
}

const STORAGE_QUEUE_KEY = 'puntotic_offline_queue_v1';
let deferredPrompt: any = null;

// Escuchar evento de instalación nativa (PWA Install Prompt)
export function initPwaInstallListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        deferredPrompt = e;
        window.dispatchEvent(new CustomEvent('pwa-installable', { detail: { available: true } }));
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
}

// Saber si la app ya corre en modo Standalone (instalada)
export function isPwaStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
    );
}

// Disparar diálogo de instalación del navegador
export async function promptPwaInstall(): Promise<boolean> {
    if (!deferredPrompt) return false;
    try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        return choice.outcome === 'accepted';
    } catch (err) {
        console.error('Error al solicitar instalación PWA:', err);
        return false;
    }
}

// Registrar el Service Worker
export function registerPwaServiceWorker(): void {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    // Chequear si hay actualización en espera
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    window.dispatchEvent(new CustomEvent('pwa-update-available'));
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.warn('[PWA] Error al registrar Service Worker:', error);
                });
        });
    }
}

// Obtener cola actual de elementos fuera de línea
export function getOfflineQueue(): OfflineRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

// Guardar registro en la cola local
export function addToOfflineQueue(type: 'visita' | 'ciudadano', data: any, summary?: string): OfflineRecord {
    const queue = getOfflineQueue();
    const newRecord: OfflineRecord = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        data,
        summary: summary || (type === 'visita' ? `Visita: ${data.nombre_completo || data.documento || 'Ciudadano'}` : `Ciudadano: ${data.documento}`),
        createdAt: new Date().toISOString(),
        retries: 0,
    };

    queue.push(newRecord);
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('pwa-queue-updated', { detail: { queue, count: queue.length } }));
    return newRecord;
}

// Eliminar un elemento de la cola
export function removeOfflineItem(id: string): void {
    const queue = getOfflineQueue().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('pwa-queue-updated', { detail: { queue, count: queue.length } }));
}

// Limpiar toda la cola
export function clearOfflineQueue(): void {
    localStorage.removeItem(STORAGE_QUEUE_KEY);
    window.dispatchEvent(new CustomEvent('pwa-queue-updated', { detail: { queue: [], count: 0 } }));
}

// Sincronizar todos los registros pendientes con el backend
export async function syncOfflineQueue(): Promise<{ total: number; success: number; failed: number }> {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { total: 0, success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineRecord[] = [];

    for (const item of queue) {
        try {
            const endpoint = item.type === 'visita' ? '/visitas' : '/ciudadanos';
            await axios.post(endpoint, item.data, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            successCount++;
        } catch (error: any) {
            console.error(`[PWA Sync] Error sincronizando elemento ${item.id}:`, error);
            item.retries += 1;
            item.error = error?.response?.data?.message || error.message || 'Error de conexión';
            remainingQueue.push(item);
            failedCount++;
        }
    }

    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remainingQueue));
    window.dispatchEvent(new CustomEvent('pwa-queue-updated', { detail: { queue: remainingQueue, count: remainingQueue.length } }));

    return {
        total: queue.length,
        success: successCount,
        failed: failedCount,
    };
}
