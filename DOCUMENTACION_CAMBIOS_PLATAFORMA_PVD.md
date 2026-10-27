# Documentación Técnica y Registro de Transformación de la Plataforma PuntoTIC
## Red de Puntos Vive Digital y Aulas Digitales · Alcaldía Municipal de Acacías, Meta

---

## 1. Resumen Ejecutivo

Este documento detalla en profundidad todas las intervenciones, mejoras arquitectónicas, modernizaciones de interfaz y capacidades funcionales añadidas a la plataforma **PuntoTIC**. 

El proyecto fue concebido originalmente como un prototipo administrativo básico para el registro de usuarios en los **Puntos Vive Digital (PVD)** y **Aulas Digitales** del municipio de Acacías (Meta, Colombia). La intervención técnica tuvo como objetivo principal transformar dicho prototipo en una **solución digital institucional, robusta, altamente accesible, con soporte offline (PWA) y con un diseño centrado en el usuario (UX/UI)**, eliminando por completo cualquier aspecto genérico de plantilla o código de relleno de inteligencia artificial.

---

## 2. Principios de Diseño y Humanización del Frontend

### 2.1. Erradicación de Clichés Visuales y Módulos Ficticios
* **Eliminación Total de "IA Predictiva de Afluencia":** Se eliminó por completo el componente que proyectaba afluencias y generaba recomendaciones operativas automáticas sin fundamento estadístico real. Esto liberó espacio crítico en el panel principal y eliminó elementos distractores.
* **Supresión de Animaciones Saturadas:** Se retiraron cajas con bordes oscuros pesados y animaciones de radar parpadeante (ej. el widget antiguo de *SEDE ACTIVA* con pulso verde continuo), sustituyéndolas por componentes informativos sobrios y de alta elegancia.
* **Prohibición Total de Emojis:** Se sustituyó el 100% de emojis informales (💡, ⚡, ⭐, ✨, 🏢, etc.) por iconos vectoriales SVG limpios y consistentes de la librería [`lucide-react`](https://lucide.dev/).

### 2.2. Identidad Visual Institucional (Alcaldía de Acacías)
* **Emblemas Oficiales:** Integración en alta fidelidad del escudo oficial de la Alcaldía de Acacías y del logotipo de PuntoTIC (`/images/logo_alcaldia.png`, `/images/escudo_acacias.png`), presentados en marcos con bordes redondeados y fondos contrastados.
* **Paleta Cromática Municipal:**
  * **Verde Institucional Principal:** `#1B6B35` (Alcaldía Green) y `#134D27` (Green Dark).
  * **Acentos Cálidos:** `#F5A623` (Ámbar Meta) para indicadores secundarios y alertas de atención.
  * **Fondos y Contrastes:** `#0B132B` y `#0F1E36` para la barra lateral y encabezados de alta jerarquía; `#F8FAFC` (Slate ultra-claro) para el fondo general de trabajo; bordes sutiles en `#E2E8F0`.
* **Micro-interacciones Táctiles:** Incorporación de la clase utilitaria `.btn-tactile` (`active:scale-[0.98] transition-transform duration-150`) para dar retroalimentación física perceptible a los operadores al pulsar botones y tarjetas interactivas.

---

## 3. Arquitectura del Layout y Navegación (`AuthenticatedLayout.tsx`)

Se rediseñó desde cero la experiencia de navegación para resolver problemas críticos de truncamiento de texto, desbordamiento horizontal y rigidez en pantallas pequeñas y tablets de campo:

```
+---------------------------------------------------------------------------------------------------+
|  SIDEBAR INSTITUCIONAL (w-64)   | TOPBAR DE COMANDO STICKY                                        |
|  - Escudo + PuntoTIC Acacías    | - Chip Sede Activa (MapPin)                                     |
|  - Operación Principal          | - Buscador Global Ciudadano (⌘K)                                |
|  - Servicios en Sala            | - Fecha Localizada + Acción Rápida "+ Visita"                   |
|  - Administración y Datos       +-----------------------------------------------------------------+
|  - Perfil + Cierre de Sesión    | LIENZO PRINCIPAL (<main max-w-7xl>)                             |
|                                 | [ ENCABEZADO DE PÁGINA: Título H1 + Insignias + Subtítulo ]     |
|                                 | [ CONTENIDO ESPECÍFICO DE LA VISTA: Tablas, Formularios, Bento ] |
+---------------------------------------------------------------------------------------------------+
```

### 3.1. Barra Lateral de Navegación (Sidebar)
* **Anchura Estable:** Fijada en `w-64` para evitar el truncamiento de nombres largos como *"Alcaldía Municipal"* y *"Categorías y Servicios"*.
* **Jerarquía por Áreas Operativas:**
  1. **Operación Principal:** Panel de Control, Registrar Visita, Historial de Visitas, Directorio Ciudadano.
  2. **Servicios en Sala:** Préstamo de Salas, Impresiones y Copias.
  3. **Administración y Datos:** Exportar Reportes, Categorías y Servicios, Campos Dinámicos, Configuración y Auditoría.
* **Tarjeta de Funcionario:** Panel inferior con avatar sintetizado por iniciales, nombre del gestor, rol asignado y acceso directo para cierre de sesión seguro.

### 3.2. Barra Superior de Comando (Topbar)
* **Desacoplamiento del Título:** Se retiró el `header` de la barra superior. Antes, los títulos largos provocaban que la barra colapsara y se truncaran textos con puntos suspensivos (`Red Munic...`, `Monitoreo oper...`).
* **Sede Activa en Chip Contextual:** Ubicación de la sede actual (ej. *Punto Vive Digital PLUS*) en una cápsula con icono de geolocalización.
* **Buscador Ciudadano Global:** Input directo para búsqueda por cédula o nombre con soporte para atajo de teclado (`Ctrl + K` o `Cmd + K`).
* **Fecha Dinámica:** Fecha del día formateada en lenguaje natural colombiano (ej. *mar, 27 oct 2026*).

### 3.3. Experiencia Móvil de Campo
* **Cajón Deslizante (Slide Drawer):** Menú lateral desplegable con fondo desenfocado para teléfonos móviles.
* **Barra de Navegación por Pulgar (Bottom Thumb Bar):** Barra fija inferior con los accesos directos más frecuentes y botón flotante central para registrar visitas rápidamente con una sola mano.

---

## 4. Implementación PWA y Resiliencia Offline-First

Uno de los aportes más significativos fue dotar a la plataforma de capacidades de **Aplicación Web Progresiva (PWA)**, garantizando que los gestores puedan operar en Aulas Digitales rurales (como Dinamarca o Chichimene) aun si el servicio de internet comunitario falla o sufre caídas temporales.

### 4.1. Manifiesto y Capacidad de Instalación
* Archivos `public/manifest.json` y `public/manifest.webmanifest` con metadatos completos:
  * Nombre: *PuntoTIC - Red de PVD Acacías*
  * Modos: `standalone` con orientación `portrait-primary`.
  * Tema de color y fondo: `#1B6B35` y `#F8FAFC`.
  * Paquete de iconos en múltiples resoluciones (`32x32`, `192x192`, `512x512`, `maskable 512x512` y `apple-touch-icon`).
* Instalable como aplicación nativa en Windows, macOS, ChromeOS, Android e iOS.

### 4.2. Service Worker (`public/sw.js`)
* **Estrategia de Caché Dual:**
  * *Cache-First* para fuentes tipográficas, iconos estáticos y hojas de estilo compiladas.
  * *Network-First con Stale-While-Revalidate* para navegación del cascarón de la aplicación.
* **Página de Contingencia Offline (`public/offline.html`):** Vista amigable e institucional que se presenta si el usuario recarga la página sin conectividad alguna, informándole que sus datos locales permanecen protegidos y brindándole acceso a un botón de reintento.

### 4.3. Motor de Almacenamiento Local y Sincronización (`pwaService.ts`)
* **Detección Automática de Conectividad:** Monitoreo en tiempo real de los eventos `online` y `offline` del navegador.
* **Colas Locales Transaccionales:**
  * Cola de ciudadanos registrados offline (`offline_citizens_queue`).
  * Cola de visitas y atenciones offline (`offline_visits_queue`).
* **Sincronización Silenciosa:** Al reconectarse a internet, el servicio procesa automáticamente las colas en segundo plano, enviando los registros acumulados al servidor sin duplicar registros.

### 4.4. Monitor Visual de Estado (`PwaStatusBanner.tsx`)
* Banner superior que alerta al gestor si la red se encuentra desconectada.
* Contador interactivo de registros guardados localmente pendientes por sincronizar.
* Botón de acción para forzar la sincronización manual inmediata.

---

## 5. Modernización Módulo por Módulo

### 5.1. Centro de Mando / Dashboard (`Pages/Dashboard.tsx`)
* **Bento Grid Asimétrico:** Distribución visual moderna que prioriza los datos de mayor impacto operacional:
  * **Hero Card "Jornada de Hoy":** Muestra en gran formato las atenciones del día actual, su variación porcentual respecto al mismo día de la semana anterior y el ritmo de llegada de ciudadanos.
  * **Directorio Ciudadano Activo:** Indicador del total de personas registradas en la base municipal y altas de la semana.
  * **Préstamos de Espacios:** Conteo de salas y auditorios prestados durante la jornada.
  * **Consumo de Papel:** Hojas impresas en el día y acumuladas en el mes.
* **Gráfica Semanal Interactiva:** Histograma de barras interactivo implementado con `recharts`, con tooltips estilizados en modo oscuro y barras destacadas para la jornada actual.
* **Distribución de la Red Municipal:** Desglose porcentual y barras de progreso del volumen atendido en cada sede:
  1. *Punto Vive Digital PLUS*
  2. *PVD Escuela Normal Superior*
  3. *PVD Dinamarca (Rural)*
  4. *Aula Digital Chichimene (Rural)*
* **Flujo de Actividad y Detección de Abandono (Churn Prevention):** Lista en vivo de las últimas atenciones y panel de alertas preventivas sobre ciudadanos habituales que llevan más de 60 días sin acudir a los puntos.

### 5.2. Registro de Visitas y Atenciones (`Pages/Visits/Create.tsx`)
* **Conmutador de Modo Dual:**
  * **Modo Aula Digital:** Optimizado para colegios e instituciones educativas, permitiendo seleccionar institución, grado escolar (6° a 11°) y grupo.
  * **Modo PVD General:** Optimizado para la atención ciudadana particular (trámites, cursos, navegación libre, capacitación).
* **Autocompletado y Búsqueda Instantánea:** Al ingresar el número de cédula o documento de identidad, el sistema consulta localmente o vía API en milisegundos para pre-cargar nombres, edad, teléfono y datos sociodemográficos.
* **Trámites Habituales Claros:** Selector rápido de servicios más solicitados (*Impresión de certificados, Consulta Sisbén, SENA Sofía Plus, Navegación asistida*).
* **Soporte Offline Directo:** Si no hay internet, el botón de guardado almacena la atención en la cola local de la PWA y notifica al gestor que el registro quedó asegurado.

### 5.3. Historial de Visitas (`Pages/Visits/Index.tsx`)
* **Tabla Híbrida Responsiva:** En pantallas de escritorio muestra una tabla detallada con información de fecha, hora, ciudadano, sede, servicio y gestor; en pantallas móviles se transforma automáticamente en tarjetas de lectura rápida.
* **Filtros Compuestos:** Barra de filtrado multicriterio por texto, sede, categoría de servicio y rango de fechas (*desde/hasta*).
* **Exportación Directa:** Botón con enlace al generador de reportes en formato Excel/CSV.

### 5.4. Directorio Ciudadano (`Pages/Citizens/Index.tsx`, `Create.tsx`)
* **Ficha Sociodemográfica:** Muestra edad calculada dinámicamente, nivel de escolaridad, condición diferencial o de vulnerabilidad (Madres cabeza de hogar, adultos mayores, población desplazada) y total de visitas acumuladas.
* **Prevención de Duplicados:** Alertas inmediatas en caso de intentar registrar una identificación ya existente.
* **Formulario Offline:** Creación de nuevos perfiles de usuario funcional aun sin conexión.

### 5.5. Préstamo de Salas y Espacios TIC (`Pages/RoomLoans/Index.tsx`)
* **Categorías Reales Comunitarias:** Clasificación aterrizada a la dinámica del municipio de Acacías:
  * Convenios SENA / Alcaldía
  * Instituciones Educativas y Colegios
  * Programas ICBF y Niñez
  * Juntas de Acción Comunal (JAC) y Asambleas
  * Cine Comunitario y Cineclub
  * Programas de Paz y Fundaciones
  * Expresiones Culturales y Danza
  * Jornadas de Salud y Vacunación
  * Emprendimiento y Empleo
* **Verificación de Responsable:** Modal con validación instantánea del documento del coordinador de la actividad.

### 5.6. Portal de Acceso y Login (`Pages/Auth/Login.tsx`)
* **Diseño Institucional:** Fondo sutil con destellos institucionales, escudo oficial de Acacías y tipografía nítida.
* **Selector Rápido de Credenciales (Modo Pruebas / Demo):** Botones en forma de pastilla que permiten autocompletar credenciales con un solo clic (ej. *Administrador General* o *Coordinador Sede PLUS*).
* **Seguridad de Interfaz:** Botón para alternar visibilidad de contraseña y validación estricta de campos.

---

## 6. Mantenimiento del Backend y Garantía de Pruebas

Siguiendo estrictamente las directrices del proyecto:
* **Cero Rupturas en Lógica de Negocio:** No se alteraron los esquemas de bases de datos, migraciones ni modelos Eloquent de manera destructiva.
* **Pruebas Automatizadas 100% Exitosas:** La suite completa de PHPUnit continúa ejecutándose con éxito rotundo:
  ```bash
  php artisan test --compact
  {"tool":"phpunit","result":"passed","tests":25,"passed":25,"assertions":62}
  ```
* **Compilación Frontend Libre de Errores:** Tanto TypeScript como Vite compilan de manera limpia:
  ```bash
  npm run build
  ✓ 3198 modules transformed.
  ✓ built in 8.37s
  ```

---

## 7. Resumen de Archivos y Métricas de Cambio

* **Archivos modificados y creados:** 37 archivos.
* **Líneas añadidas:** +5,327 líneas de código limpio, modular y documentado.
* **Líneas eliminadas / refactorizadas:** -1,060 líneas de código obsoleto o saturado.

### Principales archivos intervenidos:
| Archivo | Tipo de Intervención |
| :--- | :--- |
| `resources/js/Layouts/AuthenticatedLayout.tsx` | Rediseño de Sidebar, Topbar, navegación móvil y contenedor principal |
| `resources/js/Pages/Dashboard.tsx` | Bento Grid, gráficas Recharts, métricas municipales, eliminación de módulo IA |
| `resources/js/Pages/Visits/Create.tsx` | Modo dual (Aula/PVD), autocompletado de ciudadanos, soporte offline PWA |
| `resources/js/Pages/Visits/Index.tsx` | Tabla responsiva, filtros avanzados, eliminación de emojis |
| `resources/js/Pages/Citizens/Index.tsx` | Directorio ciudadano, métricas sociodemográficas, vistas adaptativas |
| `resources/js/Pages/RoomLoans/Index.tsx` | Categorización comunitaria real, validación de responsables |
| `resources/js/Pages/Auth/Login.tsx` | Login institucional, pastillas de credenciales rápidas |
| `resources/js/services/pwaService.ts` | **(Nuevo)** Servicio de sincronización y almacenamiento local offline |
| `resources/js/Components/PwaStatusBanner.tsx` | **(Nuevo)** Banner visual de monitoreo de conexión y sincronización |
| `public/sw.js` | **(Nuevo)** Service Worker con estrategias de caché resilientes |
| `public/manifest.json` | **(Nuevo)** Manifiesto PWA para instalación web |
| `public/offline.html` | **(Nuevo)** Pantalla de contingencia sin conexión a red |
| `tailwind.config.js` | Definición de sombras suaves, animaciones y colores de la Alcaldía |
| `resources/css/app.css` | Utilidades de micro-interacción `.btn-tactile` y barras de desplazamiento |
| `.gitignore` | Protección para ignorar volcados y respaldos de bases de datos SQL |

---

*Documento elaborado para el repositorio oficial PuntoTIC · Alcaldía Municipal de Acacías, Meta.*
