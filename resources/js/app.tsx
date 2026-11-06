import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'PuntoTIC - Alcaldía de Acacías';

import { registerPwaServiceWorker, initPwaInstallListener } from './services/pwaService';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#1B6B35',
    },
});

// Asegurar que por defecto inicie en Modo Claro institucional
if (typeof window !== 'undefined') {
    if (localStorage.getItem('puntotic-theme') === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Inicializar capacidades PWA (Service Worker y prompt de instalación)
registerPwaServiceWorker();
initPwaInstallListener();

