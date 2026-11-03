<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_is_blocked_by_default_policy(): void
    {
        config(['auth.allow_registration' => false]);

        $response = $this->get('/register');
        $response->assertRedirect(route('login'));

        $postResponse = $this->post('/register', [
            'name' => 'Attacker',
            'email' => 'attacker@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        $postResponse->assertStatus(403);
    }

    public function test_registration_screen_can_be_rendered_when_allowed(): void
    {
        config(['auth.allow_registration' => true]);

        $response = $this->get('/register');
        $response->assertStatus(200);
    }

    public function test_new_users_can_register_when_allowed(): void
    {
        config(['auth.allow_registration' => true]);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }
}
