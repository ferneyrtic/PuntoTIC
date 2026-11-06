<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_audit_logs(): void
    {
        $response = $this->get('/auditoria');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_audit_logs(): void
    {
        $user = User::factory()->create();

        AuditLog::registrar(
            accion: 'REGISTRAR_VISITA',
            modulo: 'visitas',
            registroId: '9991',
            antiguos: null,
            nuevos: ['servicio_texto' => 'Test Visita QA']
        );

        $response = $this->actingAs($user)->get('/auditoria');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('AuditLogs/Index')
            ->has('logs.data')
            ->has('stats')
            ->where('stats.total_eventos', 1)
        );
    }

    public function test_audit_logs_can_be_filtered_by_module(): void
    {
        $user = User::factory()->create();

        AuditLog::registrar(accion: 'REGISTRAR_VISITA', modulo: 'visitas', registroId: '101');
        AuditLog::registrar(accion: 'PRESTAMO_SALA', modulo: 'prestamos', registroId: '202');

        $response = $this->actingAs($user)->get('/auditoria?modulo=prestamos');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('AuditLogs/Index')
            ->where('logs.data.0.modulo', 'prestamos')
            ->where('logs.data.0.registro_id', '202')
        );
    }
}
