# PuntoTIC · Red Municipal de Puntos Vive Digital y Aulas Digitales
### Alcaldía Municipal de Acacías · Meta, Colombia

Plataforma institucional para la gestión operativa, registro de atenciones, control de acceso comunitario y analítica de uso de las salas de tecnología y conectividad pública en el municipio de Acacías.

---

## 📌 Documentación Completa de Cambios y Modernización

Para consultar el registro técnico detallado de todas las mejoras, la arquitectura PWA offline, el rediseño visual y las optimizaciones de experiencia de usuario (UX/UI), consulta el documento:

👉 **[DOCUMENTACION_CAMBIOS_PLATAFORMA_PVD.md](./DOCUMENTACION_CAMBIOS_PLATAFORMA_PVD.md)**

---

## 🚀 Capacidades y Módulos Principales

* **Centro de Mando (Bento Grid):** Monitoreo en tiempo real de atenciones diarias, histogramas semanales, distribución porcentual entre sedes urbanas y rurales, y seguimiento de ciudadanos habituales.
* **Registro de Visitas Dual:** Flujo especializado conmutable entre *Aula Digital* (formación de colegios y grados) y *Punto Vive Digital* (trámites ciudadanos y navegación libre).
* **Directorio Ciudadano Inteligente:** Búsqueda instantánea por documento con autocompletado y perfil sociodemográfico.
* **Préstamo de Salas y Auditorios:** Categorización comunitaria real (convenios SENA, colegios, ICBF, juntas de acción comunal, brigadas de salud y cineclub).
* **Control de Impresiones:** Trazabilidad de copias e impresiones gratuitas de apoyo a la comunidad.
* **Modo PWA Offline-First:** Resiliencia en campo mediante Service Workers y almacenamiento local en cola para operar en sedes rurales sin conexión y sincronizar automáticamente al recuperar red.
* **Diseño Institucional Humano:** Interfaz moderna y accesible construida con Inertia.js, React, Tailwind CSS y vectoriales SVG de Lucide (sin emojis informales ni plantillas saturadas).

---

## 🛠️ Stack Tecnológico

* **Backend:** Laravel 11 / PHP 8.5
* **Frontend:** Inertia.js + React 18 + TypeScript
* **Estilos:** Tailwind CSS + animaciones y utilidades táctiles
* **Visualización de Datos:** Recharts
* **Iconografía:** Lucide React
* **PWA:** Service Worker con estrategias de caché y sincronización local

---

## 💻 Puesta en Marcha Local

### Requisitos
* PHP >= 8.2 con extensiones `pdo`, `sqlite` o `mysql`, `gd`, `intl`, `zip`
* Composer >= 2.x
* Node.js >= 18.x & NPM

### Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/ferneyrtic/PuntoTIC.git
cd PuntoTIC

# 2. Instalar dependencias PHP
composer install

# 3. Instalar dependencias JavaScript
npm install

# 4. Configurar variables de entorno
cp .env.example .env
php artisan key:generate

# 5. Ejecutar migraciones y datos de prueba
php artisan migrate --seed

# 6. Compilar activos de frontend
npm run build

# 7. Iniciar servidores de desarrollo
php artisan serve
npm run dev
```

---

## 🏛️ Créditos Institucionales
Desarrollado para la **Alcaldía Municipal de Acacías** y la **Red de Puntos Vive Digital y Aulas Digitales** del Meta.
