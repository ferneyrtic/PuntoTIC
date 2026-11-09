<?php

namespace App\Http\Requests\Auth;

use App\Models\Citizen;
use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     * Permite ingresar tanto con Correo Electrónico como con Número de Documento.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $login = trim($this->input('email'));
        $password = $this->input('password');
        $remember = $this->boolean('remember');

        $isEmail = filter_var($login, FILTER_VALIDATE_EMAIL);
        $authenticated = false;

        if ($isEmail) {
            // Intentar autenticación por correo electrónico
            $authenticated = Auth::attempt(['email' => $login, 'password' => $password], $remember);

            // Si falló, intentar variantes con punto o guión bajo habituales
            if (! $authenticated) {
                if ($login === 'gestor.plus@acacias.gov.co') {
                    $authenticated = Auth::attempt(['email' => 'gestor_plus@acacias.gov.co', 'password' => $password], $remember);
                } elseif ($login === 'gestor_plus@acacias.gov.co') {
                    $authenticated = Auth::attempt(['email' => 'gestor.plus@acacias.gov.co', 'password' => $password], $remember);
                }
            }
        } else {
            // 1. Intentar autenticación por documento directo en users
            $authenticated = Auth::attempt(['documento' => $login, 'password' => $password], $remember);

            // 2. Si no autenticó, buscar si el documento está en form_pvd y encontrar el usuario
            if (! $authenticated) {
                $citizen = Citizen::where('documento', $login)->first();
                if ($citizen) {
                    $user = User::where('id_form_pvd', $citizen->id)
                        ->orWhere('documento', $login)
                        ->first();

                    if ($user && Hash::check($password, $user->password)) {
                        Auth::login($user, $remember);
                        $authenticated = true;
                    }
                }
            }
        }

        if (! $authenticated) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Las credenciales ingresadas (correo o documento) no coinciden con nuestros registros.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
