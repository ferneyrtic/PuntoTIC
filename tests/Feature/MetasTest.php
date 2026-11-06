<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\PuntosVdSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MetasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PuntosVdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_guests_cannot_update_metas(): void
    {
        $response = $this->post(route('metas.update'), [
            'metas' => [
                '1' => 1500,
                '2' => 1200,
                '3' => 400,
                '4' => 400,
                'consolidado' => 3500,
            ],
        ]);

        $response->assertUnauthorized();
    }

    public function test_non_admin_users_are_forbidden_from_updating_metas(): void
    {
        $gestor = User::factory()->create();
        $gestor->assignRole('Gestor PVD');

        $response = $this
            ->actingAs($gestor)
            ->post(route('metas.update'), [
                'metas' => [
                    '1' => 1500,
                    '2' => 1200,
                    '3' => 400,
                    '4' => 400,
                    'consolidado' => 3500,
                ],
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_metas(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrador');

        $payload = [
            '1' => 1800,
            '2' => 1300,
            '3' => 500,
            '4' => 500,
            'consolidado' => 4100,
        ];

        $response = $this
            ->actingAs($admin)
            ->post(route('metas.update'), [
                'metas' => $payload,
            ]);

        $response->assertSessionHas('success');

        $stored = Setting::get('metas_mensuales_sedes');
        $this->assertSame($payload, $stored);
    }

    public function test_dashboard_renders_with_semaforo_metas(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrador');

        $response = $this
            ->actingAs($admin)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('stats.semaforo_metas')
            ->has('stats.semaforo_metas.meta_objetivo')
            ->has('stats.semaforo_metas.porcentaje_cumplimiento')
        );
    }
}
