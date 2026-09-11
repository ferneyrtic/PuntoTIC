<?php

use App\Http\Controllers\CitizenController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DynamicFieldController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\PrintRecordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoomLoanController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\VisitController;
use App\Http\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

// Redirección inicial al Dashboard o Login
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Rutas autenticadas del sistema PVD
Route::middleware(['auth'])->group(function () {
    // Dashboard General con IA y métricas
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Gestión de Ciudadanos (Directorio, Búsqueda, Creación y Edición 100% Completa)
    Route::resource('ciudadanos', CitizenController::class);
    Route::post('/api/ciudadanos/verificar', [CitizenController::class, 'verify'])->name('ciudadanos.verify');
    Route::get('/api/ciudadanos/buscar-estudiantes', [CitizenController::class, 'searchStudents'])->name('ciudadanos.buscar-estudiantes');

    // Registro y Listado de Visitas
    Route::resource('visitas', VisitController::class);
    Route::post('/api/visitas/clasificar-nlp', [VisitController::class, 'classifyNlp'])->name('visitas.classify-nlp');

    // Préstamos de Salas
    Route::resource('prestamos', RoomLoanController::class);

    // Registro de Impresiones
    Route::resource('impresiones', PrintRecordController::class);

    // Exportaciones Avanzadas (Excel / CSV con selección de columnas)
    Route::get('/exportar', [ExportController::class, 'index'])->name('exportar.index');
    Route::get('/exportar/descargar', [ExportController::class, 'download'])->name('exportar.download');

    // Gestión de Categorías y Subcategorías
    Route::resource('categorias', CategoryController::class)->except(['create', 'show', 'edit']);
    Route::post('/categorias/{categoria}/subcategorias', [CategoryController::class, 'storeSubcategory'])->name('categorias.subcategorias.store');
    Route::delete('/subcategorias/{subcategoria}', [CategoryController::class, 'deleteSubcategory'])->name('categorias.subcategorias.destroy');

    // Campos Dinámicos (Columnas Personalizables sin tocar código)
    Route::resource('campos-dinamicos', DynamicFieldController::class)->only(['index', 'store', 'destroy']);

    // Configuración y Auditoría
    Route::get('/configuracion', [SettingController::class, 'index'])->name('configuracion.index');
    Route::post('/configuracion', [SettingController::class, 'update'])->name('configuracion.update');

    // Perfil de usuario
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
