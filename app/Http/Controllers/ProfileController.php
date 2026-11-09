<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Citizen;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->load('roles');

        $citizen = null;
        if ($user->id_form_pvd) {
            $citizen = Citizen::find($user->id_form_pvd);
        } elseif ($user->documento) {
            $citizen = Citizen::where('documento', $user->documento)->first();
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'ciudadano' => $citizen,
            'esCiudadano' => $user->hasRole(['Usuario', 'Ciudadano']) || $user->es_usuario_ciudadano,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'telefono' => $validated['telefono'] ?? $user->telefono,
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Si existe ficha de ciudadano en form_pvd o es usuario ciudadano, sincronizar
        $citizen = null;
        if ($user->id_form_pvd) {
            $citizen = Citizen::find($user->id_form_pvd);
        } elseif ($user->documento) {
            $citizen = Citizen::where('documento', $user->documento)->first();
        }

        if ($citizen) {
            $citizenData = [
                'correo' => $validated['email'],
                'telefono' => $validated['telefono'] ?? $citizen->telefono,
            ];

            if (isset($validated['direccion'])) $citizenData['direccion'] = $validated['direccion'];
            if (isset($validated['barrio'])) $citizenData['barrio'] = $validated['barrio'];
            if (isset($validated['zona'])) $citizenData['zona'] = $validated['zona'];
            if (isset($validated['estrato'])) $citizenData['estrato'] = $validated['estrato'];
            if (isset($validated['nivel_educativo'])) $citizenData['nivel_educativo'] = $validated['nivel_educativo'];
            if (isset($validated['ocupacion'])) $citizenData['ocupacion'] = $validated['ocupacion'];
            if (isset($validated['g_poblacional'])) $citizenData['g_poblacional'] = $validated['g_poblacional'];
            if (isset($validated['grupo_etnico'])) $citizenData['grupo_etnico'] = $validated['grupo_etnico'];
            if (isset($validated['t_aseguramiento'])) $citizenData['t_aseguramiento'] = $validated['t_aseguramiento'];

            $citizen->update($citizenData);
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
