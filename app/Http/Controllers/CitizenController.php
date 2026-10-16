<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCitizenRequest;
use App\Http\Requests\UpdateCitizenRequest;
use App\Models\Category;
use App\Models\Citizen;
use App\Models\DocumentType;
use App\Models\Point;
use App\Services\CitizenService;
use App\Services\MLService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CitizenController extends Controller
{
    public function __construct(
        protected CitizenService $citizenService,
        protected MLService $mlService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'id_punto', 'zona', 'nivel_educativo', 'estrato', 'sort_by', 'sort_dir']);
        $citizens = $this->citizenService->paginate($filters, 15);
        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto']);
        $documentTypes = DocumentType::where('activo', true)->get(['id_tipo', 'sigla', 'nombre_tipo']);

        return Inertia::render('Citizens/Index', [
            'citizens' => $citizens,
            'filters' => $filters,
            'points' => $points,
            'documentTypes' => $documentTypes,
        ]);
    }

    public function create(): Response
    {
        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto', 'zona']);
        $documentTypes = DocumentType::where('activo', true)->get(['id_tipo', 'sigla', 'nombre_tipo']);
        $categories = Category::with('subcategorias')->where('activo', true)->orderBy('orden')->get();

        return Inertia::render('Citizens/Create', [
            'points' => $points,
            'documentTypes' => $documentTypes,
            'categories' => $categories,
        ]);
    }

    public function store(StoreCitizenRequest $request): RedirectResponse|JsonResponse
    {
        $citizen = $this->citizenService->createCitizen($request->validated());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Ciudadano registrado exitosamente.',
                'data' => $citizen,
            ]);
        }

        if ($request->boolean('crear_visita_inmediata')) {
            return redirect()->route('visitas.create', ['documento' => $citizen->documento])
                ->with('success', 'Ciudadano registrado con éxito. Registre el servicio solicitado.');
        }

        return redirect()->route('ciudadanos.show', $citizen->id_form_pvd)
            ->with('success', 'Ciudadano registrado exitosamente.');
    }

    public function show(Citizen $citizen): Response
    {
        $citizen->load([
            'tipoDocumento',
            'punto',
            'gestor',
            'visitas' => fn($q) => $q->with(['categoria', 'subcategoria', 'punto', 'gestor'])->limit(20),
            'prestamos' => fn($q) => $q->with('punto')->limit(10),
            'impresiones' => fn($q) => $q->with('punto')->limit(10),
        ]);

        $mlPredictions = $this->mlService->predictNextService($citizen, $citizen->id_punto);

        return Inertia::render('Citizens/Show', [
            'citizen' => $citizen,
            'mlPredictions' => $mlPredictions,
        ]);
    }

    public function edit(Citizen $citizen): Response
    {
        $citizen->load(['tipoDocumento', 'punto']);
        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto', 'zona']);
        $documentTypes = DocumentType::where('activo', true)->get(['id_tipo', 'sigla', 'nombre_tipo']);

        return Inertia::render('Citizens/Edit', [
            'citizen' => $citizen,
            'points' => $points,
            'documentTypes' => $documentTypes,
        ]);
    }

    public function update(UpdateCitizenRequest $request, Citizen $citizen): RedirectResponse
    {
        $this->citizenService->updateCitizen($citizen, $request->validated());

        return redirect()->route('ciudadanos.show', $citizen->id_form_pvd)
            ->with('success', 'Datos del ciudadano actualizados correctamente en todos sus campos.');
    }

    /**
     * Endpoint API para verificación rápida por cédula y recomendaciones IA.
     */
    public function verify(Request $request): JsonResponse
    {
        $document = trim($request->get('documento', ''));
        if (! $document) {
            return response()->json(['exists' => false, 'citizen' => null]);
        }

        $citizen = $this->citizenService->findByDocument($document);

        if (! $citizen) {
            return response()->json([
                'exists' => false,
                'citizen' => null,
                'message' => 'Ciudadano no registrado previamente.',
            ]);
        }

        $predictions = $this->mlService->predictNextService($citizen, $request->get('id_punto'));

        return response()->json([
            'exists' => true,
            'citizen' => [
                'id_form_pvd' => $citizen->id_form_pvd,
                'documento' => $citizen->documento,
                'id_tipo' => $citizen->id_tipo,
                'nombre_completo' => $citizen->nombre_completo,
                'nombres' => $citizen->nombres,
                'apellidos' => $citizen->apellidos,
                'fecha_nac' => $citizen->fecha_nac?->toDateString(),
                'edad' => $citizen->edad,
                'genero' => $citizen->genero,
                'correo' => $citizen->correo,
                'telefono' => $citizen->telefono,
                'direccion' => $citizen->direccion,
                'barrio' => $citizen->barrio,
                'zona' => $citizen->zona,
                'up' => $citizen->up,
                'estrato' => $citizen->estrato,
                'nivel_educativo' => $citizen->nivel_educativo,
                'ocupacion' => $citizen->ocupacion,
                'grupo_etnico' => $citizen->grupo_etnico,
                'g_poblacional' => $citizen->g_poblacional,
                't_aseguramiento' => $citizen->t_aseguramiento,
                'punto_nombre' => $citizen->punto?->nombre_punto,
                'total_visitas' => $citizen->visitas()->count(),
            ],
            'predictions' => $predictions,
        ]);
    }

    /**
     * Búsqueda ágil de niños y estudiantes para el modo Aula Digital (Dinamarca y Chichimene).
     */
    public function searchStudents(Request $request): JsonResponse
    {
        $term = trim($request->get('term', $request->get('q', '')));
        $pointId = $request->get('id_punto', $request->user()?->id_punto);

        if (strlen($term) < 2) {
            return response()->json([]);
        }

        $students = Citizen::query()
            ->when($pointId, fn($q) => $q->where('id_punto', $pointId))
            ->where(function ($q) use ($term) {
                $q->where('nombres', 'like', "%{$term}%")
                  ->orWhere('apellidos', 'like', "%{$term}%")
                  ->orWhere('documento', 'like', "%{$term}%");
            })
            ->latest('id_form_pvd')
            ->limit(8)
            ->get(['id_form_pvd', 'documento', 'nombres', 'apellidos', 'barrio', 'edad']);

        return response()->json($students);
    }
}
