<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\PuntosVdSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TipoIdSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $response = $this->get(route('exportar.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_exports_index(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('exportar.index'));

        $response->assertOk();
    }

    public function test_authenticated_users_can_download_listado_asistencia_stream(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('exportar.listado-asistencia'));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_dashboard_graficas_respects_custom_date_range(): void
    {
        $this->seed(PuntosVdSeeder::class);
        $this->seed(TipoIdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('Administrador');

        $response = $this->actingAs($user)->get(route('dashboard', [
            'print' => 'true',
            'fecha_desde' => '2026-03-01',
            'fecha_hasta' => '2026-03-31',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('stats.periodo.key', 'custom')
            ->where('stats.periodo.fecha_desde', '2026-03-01')
            ->where('stats.periodo.fecha_hasta', '2026-03-31')
        );
    }
}
