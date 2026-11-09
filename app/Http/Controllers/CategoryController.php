<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $showLegacy = (bool) $request->boolean('legacy', false);

        $categories = Category::with(['subcategorias' => fn($q) => $q->withCount('visitas')])
            ->withCount('visitas')
            ->when(! $showLegacy, fn($q) => $q->where('activo', true))
            ->when($showLegacy, fn($q) => $q->where(fn($sq) => $sq->where('activo', false)->orWhereNull('activo')))
            ->orderBy('orden')
            ->get();

        $activeCount = Category::where('activo', true)->count();
        $legacyCount = Category::where(fn($sq) => $sq->where('activo', false)->orWhereNull('activo'))->count();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'showLegacy' => $showLegacy,
            'activeCount' => $activeCount,
            'legacyCount' => $legacyCount,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()?->hasRole(['Administrador', 'Coordinador PVD'])) {
            abort(403, 'Acceso denegado: Se requieren permisos administrativos.');
        }

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'icono' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'orden' => ['nullable', 'integer'],
        ]);

        $validated['nombre'] = strip_tags($validated['nombre']);
        $cat = Category::create($validated);

        AuditLog::registrar('CREAR_CATEGORIA', 'Categorias', (string) $cat->id_categoria, null, $validated);

        return redirect()->route('categorias.index')
            ->with('success', 'Categoría creada exitosamente.');
    }

    public function update(Request $request, Category $categoria): RedirectResponse
    {
        if (! $request->user()?->hasRole(['Administrador', 'Coordinador PVD'])) {
            abort(403, 'Acceso denegado: Se requieren permisos administrativos.');
        }

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'icono' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'orden' => ['nullable', 'integer'],
            'activo' => ['boolean'],
        ]);

        $validated['nombre'] = strip_tags($validated['nombre']);
        $anteriores = $categoria->toArray();
        $categoria->update($validated);

        AuditLog::registrar('ACTUALIZAR_CATEGORIA', 'Categorias', (string) $categoria->id_categoria, $anteriores, $validated);

        return redirect()->route('categorias.index')
            ->with('success', 'Categoría actualizada con éxito.');
    }

    public function destroy(Request $request, Category $categoria): RedirectResponse
    {
        if (! $request->user()?->hasRole(['Administrador', 'Coordinador PVD'])) {
            abort(403, 'Acceso denegado: Se requieren permisos administrativos.');
        }

        AuditLog::registrar('ELIMINAR_CATEGORIA', 'Categorias', (string) $categoria->id_categoria, $categoria->toArray(), null);
        $categoria->delete();

        return redirect()->route('categorias.index')
            ->with('success', 'Categoría eliminada.');
    }

    public function storeSubcategory(Request $request, Category $categoria): RedirectResponse
    {
        if (! $request->user()?->hasRole(['Administrador', 'Coordinador PVD'])) {
            abort(403, 'Acceso denegado: Se requieren permisos administrativos.');
        }

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'orden' => ['nullable', 'integer'],
        ]);

        $validated['nombre'] = strip_tags($validated['nombre']);
        $sub = $categoria->subcategorias()->create($validated);

        AuditLog::registrar('CREAR_SUBCATEGORIA', 'Categorias', (string) $sub->id_subcategoria, null, $validated);

        return redirect()->route('categorias.index')
            ->with('success', 'Subcategoría agregada con éxito.');
    }

    public function deleteSubcategory(Request $request, SubCategory $subcategoria): RedirectResponse
    {
        if (! $request->user()?->hasRole(['Administrador', 'Coordinador PVD'])) {
            abort(403, 'Acceso denegado: Se requieren permisos administrativos.');
        }

        AuditLog::registrar('ELIMINAR_SUBCATEGORIA', 'Categorias', (string) $subcategoria->id_subcategoria, $subcategoria->toArray(), null);
        $subcategoria->delete();

        return redirect()->route('categorias.index')
            ->with('success', 'Subcategoría eliminada.');
    }
}
