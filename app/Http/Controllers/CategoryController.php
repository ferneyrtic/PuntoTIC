<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::with(['subcategorias' => fn($q) => $q->withCount('visitas')])
            ->withCount('visitas')
            ->orderBy('orden')
            ->get();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'icono' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'orden' => ['nullable', 'integer'],
        ]);

        Category::create($validated);

        return redirect()->route('categorias.index')
            ->with('success', 'Categoría creada exitosamente.');
    }

    public function update(Request $request, Category $categoria): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'icono' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'orden' => ['nullable', 'integer'],
            'activo' => ['boolean'],
        ]);

        $categoria->update($validated);

        return redirect()->route('categorias.index')
            ->with('success', 'Categoría actualizada con éxito.');
    }

    public function storeSubcategory(Request $request, Category $categoria): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'orden' => ['nullable', 'integer'],
        ]);

        $categoria->subcategorias()->create($validated);

        return redirect()->route('categorias.index')
            ->with('success', 'Subcategoría agregada con éxito.');
    }

    public function deleteSubcategory(SubCategory $subcategoria): RedirectResponse
    {
        $subcategoria->delete();

        return redirect()->route('categorias.index')
            ->with('success', 'Subcategoría eliminada.');
    }
}
