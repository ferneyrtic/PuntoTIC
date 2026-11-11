<?php

namespace App\Http\Middleware;

use App\Models\Point;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->loadMissing(['roles', 'punto']);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'is_admin' => $user ? $user->is_admin : false,
                'roles' => $user ? $user->getRoleNames() : [],
            ],
            'points' => fn () => Cache::remember(
                'active_points_shared_list_v1',
                600,
                fn () => Point::where('activo', true)->get(['id_punto', 'nombre_punto', 'zona'])->toArray()
            ),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
