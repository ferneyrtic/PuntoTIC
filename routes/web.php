<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CitizenController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DynamicFieldController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\PrintRecordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoomLoanController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\VisitController;
use App\Models\Citizen;
use App\Models\Point;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirección inicial: Landing Page para visitantes, o Dashboard/Portal para usuarios autenticados
Route::get('/', function () {
    if (auth()->check()) {
        if (auth()->user()->hasRole(['Usuario', 'Ciudadano']) || auth()->user()->es_usuario_ciudadano) {
            return redirect()->route('portal.index');
        }

        return redirect()->route('dashboard');
    }

    $points = Point::where('activo', true)
        ->whereNotIn('id_punto', [5, 6])
        ->get(['id_punto', 'nombre_punto', 'zona', 'direccion']);

    return Inertia::render('Welcome', [
        'points' => $points,
    ]);
});

// Rutas autenticadas del sistema PVD
Route::middleware(['auth'])->group(function () {
    // Dashboard General con métricas e IA
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Gestión de Ciudadanos (Directorio, Búsqueda, Creación y Edición)
    Route::model('ciudadano', Citizen::class);
    Route::resource('ciudadanos', CitizenController::class)->except(['destroy']);
    Route::post('/api/ciudadanos/verificar', [CitizenController::class, 'verify'])
        ->middleware('throttle:60,1')
        ->name('ciudadanos.verify');
    Route::get('/api/ciudadanos/buscar-estudiantes', [CitizenController::class, 'searchStudents'])
        ->middleware('throttle:60,1')
        ->name('ciudadanos.buscar-estudiantes');

    // Registro y Listado de Visitas
    Route::resource('visitas', VisitController::class)->only(['index', 'create', 'store']);
    Route::post('/api/visitas/clasificar-nlp', [VisitController::class, 'classifyNlp'])
        ->middleware('throttle:30,1')
        ->name('visitas.classify-nlp');

    // Préstamos de Salas
    Route::resource('prestamos', RoomLoanController::class)->only(['index', 'store', 'update']);
    Route::post('prestamos/{prestamo}', [RoomLoanController::class, 'update'])->name('prestamos.update.post');

    // Registro de Impresiones
    Route::resource('impresiones', PrintRecordController::class)->only(['index', 'store']);

    // Exportaciones Avanzadas (Protegidas con rate limiting contra DoS)
    Route::get('/exportar', [ExportController::class, 'index'])->name('exportar.index');
    Route::get('/exportar/descargar', [ExportController::class, 'download'])
        ->middleware('throttle:20,1')
        ->name('exportar.download');
    Route::get('/exportar/listado-asistencia', [ExportController::class, 'listadoAsistencia'])
        ->middleware('throttle:20,1')
        ->name('exportar.listado-asistencia');

    // Gestión de Categorías y Subcategorías
    Route::get('categorias', [CategoryController::class, 'index'])->name('categorias.index');
    Route::middleware(['role:Administrador|Coordinador PVD'])->group(function () {
        Route::post('categorias', [CategoryController::class, 'store'])->name('categorias.store');
        Route::put('categorias/{categoria}', [CategoryController::class, 'update'])->name('categorias.update');
        Route::delete('categorias/{categoria}', [CategoryController::class, 'destroy'])->name('categorias.destroy');
        Route::post('/categorias/{categoria}/subcategorias', [CategoryController::class, 'storeSubcategory'])->name('categorias.subcategorias.store');
        Route::delete('/subcategorias/{subcategoria}', [CategoryController::class, 'deleteSubcategory'])->name('categorias.subcategorias.destroy');

        // Campos Dinámicos (Solo Administrador y Coordinador PVD)
        Route::resource('campos-dinamicos', DynamicFieldController::class)
            ->parameters(['campos-dinamicos' => 'campo'])
            ->only(['index', 'store', 'destroy']);
    });

    // Configuración y Auditoría del Sistema (Blindada: Exclusivo para Administrador)
    Route::middleware(['role:Administrador'])->group(function () {
        Route::get('/configuracion', [SettingController::class, 'index'])->name('configuracion.index');
        Route::post('/configuracion', [SettingController::class, 'update'])->name('configuracion.update');
        Route::get('/auditoria', [AuditLogController::class, 'index'])->name('auditoria.index');
    });

    // Portal Ciudadano y Solicitud de Espacios / Salas
    Route::get('/portal', [PortalController::class, 'index'])->name('portal.index');
    Route::post('/portal/solicitar-sala', [PortalController::class, 'solicitarSala'])->name('portal.solicitar-sala');
    Route::get('/api/portal/disponibilidad', [PortalController::class, 'disponibilidad'])->name('portal.disponibilidad');

    // Perfil de usuario autenticado
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
