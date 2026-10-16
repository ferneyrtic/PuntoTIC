<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVisitRequest;
use App\Models\Category;
use App\Models\DynamicField;
use App\Models\Point;
use App\Services\CitizenService;
use App\Services\MLService;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VisitController extends Controller
{
    public function __construct(
        protected VisitService $visitService,
        protected CitizenService $citizenService,
        protected MLService $mlService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'id_punto', 'id_categoria', 'id_subcategoria', 'fecha_desde', 'fecha_hasta']);
        $visits = $this->visitService->paginate($filters, 15);

        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto']);
        $categories = Category::with('subcategorias')->where('activo', true)->orderBy('orden')->get();
        $dynamicFields = DynamicField::where('modulo', 'visitas')->where('activo', true)->get();

        return Inertia::render('Visits/Index', [
            'visits' => $visits,
            'filters' => $filters,
            'points' => $points,
            'categories' => $categories,
            'dynamicFields' => $dynamicFields,
        ]);
    }

    public function create(Request $request): Response
    {
        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto', 'zona']);
        $categories = Category::with('subcategorias')->where('activo', true)->orderBy('orden')->get();
        $dynamicFields = DynamicField::where('modulo', 'visitas')->where('activo', true)->get();

        $prefillDocument = $request->get('documento', '');
        $initialCitizen = null;
        $initialPredictions = [];

        if ($prefillDocument) {
            $initialCitizen = $this->citizenService->findByDocument($prefillDocument);
            if ($initialCitizen) {
                $initialPredictions = $this->mlService->predictNextService($initialCitizen, $request->user()?->id_punto);
            }
        }

        $user = $request->user();
        $puedeAulaDigital = $user ? (bool) $user->puede_acceder_aula_digital : false;
        $puedePvdGeneral = $user ? (bool) $user->puede_acceder_pvd_general : true;

        return Inertia::render('Visits/Create', [
            'points' => $points,
            'categories' => $categories,
            'dynamicFields' => $dynamicFields,
            'prefillDocument' => $prefillDocument,
            'initialCitizen' => $initialCitizen,
            'initialPredictions' => $initialPredictions,
            'puedeAulaDigital' => $puedeAulaDigital,
            'puedePvdGeneral' => $puedePvdGeneral,
        ]);
    }

    public function store(StoreVisitRequest $request): RedirectResponse|JsonResponse
    {
        $visit = $this->visitService->registerVisit($request->validated());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Visita registrada exitosamente en el sistema.',
                'data' => $visit,
            ]);
        }

        return redirect()->route('visitas.index')
            ->with('success', 'Visita registrada exitosamente en el sistema.');
    }

    /**
     * Endpoint API para clasificar descripciones escritas en lenguaje natural (NLP).
     */
    public function classifyNlp(Request $request): JsonResponse
    {
        $text = $request->get('descripcion', '');
        $suggestion = $this->mlService->classifyDescription($text);

        return response()->json([
            'classified' => ! is_null($suggestion),
            'suggestion' => $suggestion,
        ]);
    }
}
