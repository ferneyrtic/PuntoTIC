# DOCUMENTO DE ARQUITECTURA DE SOFTWARE (SAD)
## Plataforma de Gestión y Analítica — Puntos Vive Digital (PVD)
### Alcaldía Municipal de Acacías — Meta | Secretaría de las TIC

---

| Metadato del Documento | Detalle Institucional |
|---|---|
| **Proyecto:** | Plataforma de Registro, Gestión Comunitaria y Analítica PVD |
| **Entidad Propietaria:** | Alcaldía de Acacías — Meta |
| **Versión de Arquitectura:** | 2.0.0 (Producción / Alta Disponibilidad) |
| **Patrón Arquitectónico:** | N-Capas (MVC + Service Layer + Repository Pattern) |
| **Framework Base:** | Laravel 11.x (PHP 8.2+) / Inertia.js / React 18 (TypeScript) / Tailwind CSS |
| **Fecha de Publicación:** | Septiembre de 2026 |

---

## 1. VISIÓN GENERAL DE LA ARQUITECTURA

La plataforma fue diseñada bajo el principio de **Separación de Responsabilidades (SoC)** y arquitectura de Monolito Moderno (*Modern Monolith* con Inertia.js + React), garantizando una experiencia de usuario fluida de Aplicación de Página Única (SPA sin recargas) combinada con la seguridad, robustez y velocidad de backend de Laravel 11:

```mermaid
graph TB
    subgraph Cliente["Capa de Presentación (Single Page Application - SPA)"]
        UI[React 18 Components + TypeScript + Tailwind CSS]
        SPA[Inertia.js Client Router + Lucide Icons + Chart.js]
    end

    subgraph Servidor["Capa de Enrutamiento y Control (Backend / HTTP)"]
        RT[Enrutador Web / Routes web.php]
        MW[Middlewares: Auth, CheckRole, CSRF, Throttle]
        CTRL[Controladores HTTP: CitizenCtrl, VisitCtrl, StatsCtrl, ExportCtrl]
    end

    subgraph Logica["Capa de Servicios de Negocio (Domain Services)"]
        CS[CitizenService: Auto-cálculo edad, normalización]
        VS[VisitService: Transacciones ACID, auto-registro]
        SS[StatsService: Agregación analítica O(log N)]
        ML[MLService: Inferencia estadística de aforo y trámites]
        ES[ExportService: Generación binaria PhpSpreadsheet & CSV]
    end

    subgraph Persistencia["Capa de Datos y Modelos (ORM / Persistence)"]
        ELO[Modelos Eloquent: Citizen, Visit, RoomLoan, PrintRecord, Point]
        DB[(Motor de Base de Datos SQLite / WAL / PostgreSQL)]
    end

    UI --> AJAX
    AJAX -->|HTTPS / REST| RT
    RT --> MW
    MW --> CTRL
    CTRL --> CS
    CTRL --> VS
    CTRL --> SS
    CTRL --> ML
    CTRL --> ES
    CS --> ELO
    VS --> ELO
    SS --> ELO
    ML --> ELO
    ES --> ELO
    ELO --> DB
```

---

## 2. DIAGRAMA DE CLASES DEL SISTEMA (UML)

El siguiente diagrama modela la estructura estática del sistema, detallando los modelos de dominio, sus atributos, métodos principales y relaciones de cardinalidad:

```mermaid
classDiagram
    direction TB

    class User {
        +int id
        +string name
        +string email
        +string password
        +int id_punto
        +string cargo
        +bool activo
        +hasMany(Visits)
        +belongsTo(Point)
    }

    class Point {
        +int id_punto
        +string nombre_punto
        +string zona
        +string direccion
        +bool activo
        +hasMany(Visits)
        +hasMany(RoomLoans)
        +hasMany(PrintRecords)
    }

    class Citizen {
        +int id_form_pvd
        +string documento
        +int id_tipo_documento
        +string nombres
        +string apellidos
        +date fecha_nacimiento
        +int edad
        +string genero
        +string telefono
        +string correo
        +string barrio
        +string zona
        +int estrato
        +string nivel_educativo
        +string ocupacion
        +string grupo_etnico
        +string g_poblacional
        +string t_aseguramiento
        +hasMany(Visits)
        +hasMany(PrintRecords)
        +belongsTo(Point)
        +belongsTo(DocumentType)
    }

    class Visit {
        +int id_visita
        +int id_form_pvd
        +int id_punto
        +int id_categoria
        +int id_subcategoria
        +string servicio_texto
        +string descripcion
        +int duracion_minutos
        +int id_gestor
        +datetime created_at
        +belongsTo(Citizen)
        +belongsTo(Point)
        +belongsTo(Category)
        +belongsTo(Subcategory)
        +belongsTo(User)
        +hasMany(DynamicFieldValues)
    }

    class RoomLoan {
        +int id_prestamo
        +int id_punto
        +int id_form_pvd
        +string nombre_responsable_texto
        +string tipo_actividad
        +int num_asistentes
        +date fecha_prestamo
        +time hora_inicio
        +time hora_fin
        +string estado
        +string observaciones
        +int id_gestor
        +belongsTo(Point)
        +belongsTo(Citizen)
    }

    class PrintRecord {
        +int id_impresion
        +int id_form_pvd
        +int id_punto
        +int numero_hojas
        +string tipo_impresion
        +string descripcion
        +int id_gestor
        +datetime created_at
        +belongsTo(Citizen)
        +belongsTo(Point)
    }

    class Category {
        +int id_categoria
        +string nombre
        +string color
        +string icono
        +bool activo
        +hasMany(Subcategories)
        +hasMany(Visits)
    }

    class Subcategory {
        +int id_subcategoria
        +int id_categoria
        +string nombre
        +bool activo
        +belongsTo(Category)
        +hasMany(Visits)
    }

    class AuditLog {
        +int id_log
        +int id_usuario
        +string accion
        +string tabla
        +int id_registro
        +json datos_anteriores
        +json datos_nuevos
        +string ip_origen
        +datetime created_at
    }

    Point "1" -- "*" User : asigna
    Point "1" -- "*" Citizen : registra
    Point "1" -- "*" Visit : recibe
    Point "1" -- "*" RoomLoan : aloja
    Point "1" -- "*" PrintRecord : suministra
    Citizen "1" -- "*" Visit : realiza
    Citizen "1" -- "*" PrintRecord : solicita
    Citizen "0..1" -- "*" RoomLoan : coordina
    Category "1" -- "*" Subcategory : subdivide
    Category "1" -- "*" Visit : clasifica
    Subcategory "1" -- "*" Visit : especifica
    User "1" -- "*" Visit : atiende
    User "1" -- "*" AuditLog : genera
```

---

## 3. DIAGRAMA DE CASOS DE USO (UML)

El diagrama de casos de uso describe las interacciones entre los actores y las funcionalidades del sistema:

```mermaid
graph LR
    subgraph Actores
        ADM((Administrador TIC))
        COO((Coordinador Sede))
        GES((Gestor PVD))
    end

    subgraph CasosDeUso["Sistema de Gestión PVD Acacías"]
        UC01[Iniciar Sesión Segura]
        UC02[Consultar Dashboard y Analítica]
        UC03[Buscar Ciudadano por Cédula / Nombre]
        UC04[Editar Datos Sociodemográficos y Nivel Educativo]
        UC05[Registrar Nueva Visita con Auto-Creación]
        UC06[Reservar Sala con 11 Categorías Reales]
        UC07[Registrar Folios de Impresión]
        UC08[Exportar Reporte Excel / CSV Parametrizado]
        UC09[Administrar Sedes y Usuarios]
        UC10[Auditar Trazabilidad y Logs Forenses]
        UC11[Consultar Previsión de Aforo e IA]
    end

    GES --> UC01
    GES --> UC03
    GES --> UC04
    GES --> UC05
    GES --> UC06
    GES --> UC07
    GES --> UC08

    COO --> UC01
    COO --> UC02
    COO --> UC03
    COO --> UC04
    COO --> UC05
    COO --> UC06
    COO --> UC07
    COO --> UC08
    COO --> UC11

    ADM --> UC01
    ADM --> UC02
    ADM --> UC03
    ADM --> UC04
    ADM --> UC05
    ADM --> UC06
    ADM --> UC07
    ADM --> UC08
    ADM --> UC09
    ADM --> UC10
    ADM --> UC11
```

---

## 4. DIAGRAMAS DE SECUENCIA DE PROCESOS CRÍTICOS

### 4.1 Secuencia: Registro Atómico de Visita con Auto-Creación de Ciudadano (Garantía ACID)

Este flujo garantiza que un ciudadano no registrado se cree y vincule con su atención en una sola transacción segura sin dejar registros huérfanos:

```mermaid
sequenceDiagram
    autonumber
    actor Gestor as Gestor PVD (Navegador)
    participant Ctrl as VisitController
    participant VS as VisitService
    participant CS as CitizenService
    participant DB as Base de Datos (SQLite / PostgreSQL)
    participant Log as AuditLog

    Gestor->>Ctrl: POST /visitas/guardar (Cédula, Nombres, Sede, Trámite)
    Ctrl->>VS: registrarVisitaConCiudadano(datos)
    VS->>DB: DB::beginTransaction()
    
    VS->>CS: buscarOCrearCiudadano(cédula, datos)
    CS->>DB: SELECT * FROM form_pvd WHERE documento = ?
    
    alt Ciudadano NO existe en la BD
        CS->>CS: calculateAge(fecha_nacimiento)
        CS->>DB: INSERT INTO form_pvd (documento, nombres, edad...)
        DB-->>CS: id_form_pvd generado
        CS->>Log: registrarCreacionCiudadano()
    else Ciudadano YA existe
        DB-->>CS: id_form_pvd existente
    end
    
    VS->>DB: INSERT INTO visitas (id_form_pvd, id_punto, id_categoria...)
    
    alt Todo OK
        VS->>DB: DB::commit()
        VS->>Log: registrarVisitaExitosa()
        VS-->>Ctrl: Visita confirmada (ID: 154998)
        Ctrl-->>Gestor: HTTP 200 OK + Mensaje de Éxito
    else Ocurre Excepción o Error
        VS->>DB: DB::rollBack()
        VS-->>Ctrl: Excepción capturada
        Ctrl-->>Gestor: HTTP 422 / 500 Transacción Cancelada
    end
```

### 4.2 Secuencia: Generación y Descarga de Reportes Excel / CSV

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Funcionario / Coordinador
    participant ExportCtrl as ExportController
    participant ExportSvc as ExportService
    participant ExcelCore as Maatwebsite/Excel + PhpSpreadsheet
    participant DB as Base de Datos

    Usuario->>ExportCtrl: GET /reportes/visitas/descargar?formato=xlsx&columnas=...
    ExportCtrl->>ExportSvc: exportVisitas(filtros, columnas, 'xlsx')
    ExportSvc->>ExportSvc: ini_set('memory_limit', '512M')
    ExportSvc->>ExcelCore: Excel::download(new VisitasExport(filtros, columnas))
    ExcelCore->>DB: SELECT visitas JOIN form_pvd (chunked / filtered)
    DB-->>ExcelCore: Filas de datos
    ExcelCore->>ExcelCore: Aplicar estilos Verde Alcaldía (#1B6B35), bordes y auto-ancho
    ExcelCore-->>ExportSvc: Flujo binario XLSX
    ExportSvc-->>ExportCtrl: BinaryFileResponse (Content-Disposition: attachment)
    ExportCtrl-->>Usuario: Descarga automática de "Reporte_Visitas_PVD_Acacias.xlsx"
```

---

## 5. CAPA DE SERVICIOS Y PATRONES DE DISEÑO IMPLEMENTADOS

1. **Service Layer Pattern (`app/Services`):**
   * Desacopla la lógica de negocio de los controladores HTTP.
   * Centraliza cálculos y reglas de negocio complejas en clases reutilizables:
     * `CitizenService`: Normalización de documentos, validación de cédulas, cálculo dinámico de edad.
     * `VisitService`: Transaccionalidad atómica y asignación de gestor.
     * `StatsService`: Consultas agrupadas de alta velocidad (`groupBy`) e indexadas para el dashboard.
     * `MLService`: Algoritmos de predicción lineal ponderada de aforo y probabilidad de trámites.
     * `ExportService`: Generación de streams binarios de hojas de cálculo con estilos institucionales.

2. **Audit Observer Pattern (`app/Models/AuditLog`):**
   * Toda modificación a ciudadanos, préstamos o sedes queda registrada en una bitácora inmutable que almacena el usuario responsable, IP de conexión, tabla afectada, campos anteriores y campos nuevos en formato JSON.

3. **Database Indexing Strategy:**
   * La plataforma utiliza índices B-Tree específicos que reducen la búsqueda en el padrón de 23.847 ciudadanos a **5.7 ms** y el cálculo del Dashboard de 155.000 visitas a **40.2 ms**.
