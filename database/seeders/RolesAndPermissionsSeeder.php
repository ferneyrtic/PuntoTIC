<?php

namespace Database\Seeders;

use App\Models\Citizen;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Permisos granulares
        $permissions = [
            'ver_dashboard',
            'gestionar_ciudadanos',
            'editar_todos_campos_ciudadano',
            'registrar_visitas',
            'acceder_modo_pvd_general',
            'acceder_modo_aula_digital',
            'gestionar_prestamos',
            'gestionar_impresiones',
            'exportar_reportes',
            'gestionar_categorias',
            'gestionar_campos_dinamicos',
            'gestionar_usuarios',
            'ver_auditoria',
            'configurar_sistema',
            'ver_portal_ciudadano',
            'solicitar_prestamos',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // 1. Rol Administrador: control total del sistema
        $adminRole = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        // 2. Rol Coordinador PVD (Sedes Urbanas: PLUS y Tradicional)
        // Solo PVD general, NO tiene acceso a aula digital
        $coordinadorPvdRole = Role::firstOrCreate(['name' => 'Coordinador PVD', 'guard_name' => 'web']);
        $coordinadorPvdRole->syncPermissions([
            'ver_dashboard',
            'gestionar_ciudadanos',
            'editar_todos_campos_ciudadano',
            'registrar_visitas',
            'acceder_modo_pvd_general',
            'gestionar_prestamos',
            'gestionar_impresiones',
            'exportar_reportes',
            'gestionar_categorias',
            'gestionar_campos_dinamicos',
            'ver_auditoria',
        ]);

        // 3. Rol Gestor PVD (Operadores de ventanilla en PVD urbano)
        // Solo PVD general, NO tiene acceso a aula digital
        $gestorPvdRole = Role::firstOrCreate(['name' => 'Gestor PVD', 'guard_name' => 'web']);
        $gestorPvdRole->syncPermissions([
            'ver_dashboard',
            'gestionar_ciudadanos',
            'registrar_visitas',
            'acceder_modo_pvd_general',
            'gestionar_prestamos',
            'gestionar_impresiones',
        ]);

        // 4. Rol Coordinador Aula Digital (Sedes Rurales: Dinamarca y Chichimene)
        // Tiene acceso prioritario a Aula Digital y modo PVD general si llega un adulto
        $coordinadorAulaRole = Role::firstOrCreate(['name' => 'Coordinador Aula Digital', 'guard_name' => 'web']);
        $coordinadorAulaRole->syncPermissions([
            'ver_dashboard',
            'gestionar_ciudadanos',
            'editar_todos_campos_ciudadano',
            'registrar_visitas',
            'acceder_modo_aula_digital',
            'acceder_modo_pvd_general',
            'gestionar_prestamos',
            'gestionar_impresiones',
            'exportar_reportes',
        ]);

        // 5. Rol Gestor Aula Digital (Operadores de aula en corregimientos)
        // Tiene acceso prioritario a Aula Digital y también al formulario PVD general
        $gestorAulaRole = Role::firstOrCreate(['name' => 'Gestor Aula Digital', 'guard_name' => 'web']);
        $gestorAulaRole->syncPermissions([
            'ver_dashboard',
            'gestionar_ciudadanos',
            'registrar_visitas',
            'acceder_modo_aula_digital',
            'acceder_modo_pvd_general',
            'gestionar_prestamos',
        ]);

        // Compatibilidad con rol legacy y Coordinador General
        $legacyCoordinador = Role::firstOrCreate(['name' => 'Coordinador', 'guard_name' => 'web']);
        $legacyCoordinador->syncPermissions($coordinadorPvdRole->permissions);

        // Rol Coordinador General (Supervisión global municipal de todas las sedes)
        $coordGeneralRole = Role::firstOrCreate(['name' => 'Coordinador General', 'guard_name' => 'web']);
        $coordGeneralRole->syncPermissions([
            'ver_dashboard',
            'gestionar_ciudadanos',
            'editar_todos_campos_ciudadano',
            'registrar_visitas',
            'acceder_modo_pvd_general',
            'acceder_modo_aula_digital',
            'gestionar_prestamos',
            'gestionar_impresiones',
            'exportar_reportes',
            'gestionar_categorias',
            'gestionar_campos_dinamicos',
            'ver_auditoria',
        ]);

        $legacyGestor = Role::firstOrCreate(['name' => 'Gestor', 'guard_name' => 'web']);
        $legacyGestor->syncPermissions($gestorPvdRole->permissions);

        // 6. Rol Usuario / Ciudadano (Usuarios externos para autoservicio y reservas)
        $usuarioRole = Role::firstOrCreate(['name' => 'Usuario', 'guard_name' => 'web']);
        $usuarioRole->syncPermissions(['ver_portal_ciudadano', 'solicitar_prestamos']);

        $ciudadanoRole = Role::firstOrCreate(['name' => 'Ciudadano', 'guard_name' => 'web']);
        $ciudadanoRole->syncPermissions(['ver_portal_ciudadano', 'solicitar_prestamos']);

        // =====================================================================
        // CUENTAS OFICIALES PARA PRUEBAS Y OPERACIÓN
        // =====================================================================

        // 0. Coordinador General Municipal
        $coordGeneral = User::updateOrCreate(
            ['email' => 'coordinador.general@acacias.gov.co'],
            [
                'name' => 'Coordinador General TIC',
                'password' => Hash::make('CoordGeneral2026*'),
                'id_punto' => null,
                'cargo' => 'Coordinador General PVD',
                'activo' => true,
            ]
        );
        $coordGeneral->syncRoles(['Coordinador General', 'Coordinador']);

        // 1. Administrador TIC (Preserva contraseña original de producción)
        $admin = User::firstWhere('email', 'admin@acacias.gov.co');
        if (!$admin) {
            $admin = User::create([
                'name' => 'Administrador TIC',
                'email' => 'admin@acacias.gov.co',
                'password' => Hash::make('Acacias2026*'),
                'id_punto' => 1,
                'cargo' => 'Líder TIC Municipal',
                'activo' => true,
            ]);
        }
        $admin->syncRoles(['Administrador']);

        // 2. Coordinador PVD PLUS (Punto 1)
        $coordPlus = User::updateOrCreate(
            ['email' => 'coordinador.plus@acacias.gov.co'],
            [
                'name' => 'Coordinador PVD PLUS',
                'password' => Hash::make('PvdPlus2026*'),
                'id_punto' => 1,
                'cargo' => 'Coordinador PVD PLUS',
                'activo' => true,
            ]
        );
        $coordPlus->syncRoles(['Coordinador PVD', 'Coordinador']);

        // 3. Gestor Global Unificado (Puntos y Aulas Digitales)
        $gestorGlobalRole = Role::firstOrCreate(['name' => 'Gestor Global', 'guard_name' => 'web']);
        $gestorGlobalRole->syncPermissions([
            'ver_dashboard',
            'gestionar_ciudadanos',
            'registrar_visitas',
            'acceder_modo_pvd_general',
            'acceder_modo_aula_digital',
            'gestionar_prestamos',
            'gestionar_impresiones',
        ]);

        $gestorGlobal = User::updateOrCreate(
            ['email' => 'gestor.global@acacias.gov.co'],
            [
                'name' => 'Gestor Global PVD y Aulas',
                'password' => Hash::make('GestorGlobal2026*'),
                'id_punto' => null,
                'cargo' => 'Gestor Operativo Global (Puntos y Aulas)',
                'activo' => true,
            ]
        );
        $gestorGlobal->syncRoles(['Gestor Global', 'Gestor']);

        // 6. Coordinador Aula Digital Dinamarca (Punto 3)
        $coordDinamarca = User::updateOrCreate(
            ['email' => 'coordinador.dinamarca@acacias.gov.co'],
            [
                'name' => 'Coordinador Aula Dinamarca',
                'password' => Hash::make('Dinamarca2026*'),
                'id_punto' => 3,
                'cargo' => 'Coordinador Aula Digital Dinamarca',
                'activo' => true,
            ]
        );
        $coordDinamarca->syncRoles(['Coordinador Aula Digital', 'Coordinador']);

        // 7. Gestor Aula Digital Dinamarca (Punto 3)
        $gestorDinamarca = User::updateOrCreate(
            ['email' => 'gestor.dinamarca@acacias.gov.co'],
            [
                'name' => 'Gestor Aula Dinamarca',
                'password' => Hash::make('GestorDinamarca2026*'),
                'id_punto' => 3,
                'cargo' => 'Gestor Sala Dinamarca',
                'activo' => true,
            ]
        );
        $gestorDinamarca->syncRoles(['Gestor Aula Digital']);

        // 8. Coordinador Aula Digital Chichimene (Punto 4)
        $coordChichimene = User::updateOrCreate(
            ['email' => 'coordinador.chichimene@acacias.gov.co'],
            [
                'name' => 'Coordinador Aula Chichimene',
                'password' => Hash::make('Chichimene2026*'),
                'id_punto' => 4,
                'cargo' => 'Coordinador Aula Digital Chichimene',
                'activo' => true,
            ]
        );
        $coordChichimene->syncRoles(['Coordinador Aula Digital', 'Coordinador']);

        // 9. Gestor Aula Digital Chichimene (Punto 4)
        $gestorChichimene = User::updateOrCreate(
            ['email' => 'gestor.chichimene@acacias.gov.co'],
            [
                'name' => 'Gestor Aula Chichimene',
                'password' => Hash::make('GestorChichimene2026*'),
                'id_punto' => 4,
                'cargo' => 'Gestor Sala Chichimene',
                'activo' => true,
            ]
        );
        $gestorChichimene->syncRoles(['Gestor Aula Digital']);

        // 10. Wilber Avila (Gestor Aula Digital Chichimene / CPS TIC)
        $wilberAvila = User::updateOrCreate(
            ['email' => 'wilberavila.cps.tic@gmail.com'],
            [
                'name' => 'Wilber Avila',
                'password' => Hash::make('Andrey2026'),
                'id_punto' => 4,
                'cargo' => 'Gestor Sala Chichimene',
                'activo' => true,
            ]
        );
        $wilberAvila->syncRoles(['Gestor Aula Digital', 'Gestor']);

        // 11. Usuario Ciudadano de Prueba (Rol Usuario con ficha vinculada en form_pvd)
        $testDoc = '1121000999';
        $tipoId = DB::table('tipo_id')->value('id_tipo');
        $puntoId = DB::table('puntos_vd')->value('id_punto') ?? 1;

        $testCitizen = Citizen::firstOrCreate(
            ['documento' => $testDoc],
            [
                'id_tipo' => $tipoId,
                'nombres' => 'Leonardo',
                'apellidos' => 'Usuario Ciudadano',
                'fecha_nac' => '1995-08-20',
                'edad' => 31,
                'genero' => 'Masculino',
                'correo' => 'usuario.prueba@acacias.gov.co',
                'telefono' => '3201234567',
                'direccion' => 'Calle 14 # 20-30',
                'barrio' => 'Centro',
                'zona' => 'Urbana',
                'estrato' => 2,
                'nivel_educativo' => 'Profesional / Universitario',
                'ocupacion' => 'Comerciante / Emprendedor',
                'activo' => true,
                'id_punto' => $puntoId,
            ]
        );

        $usuarioPrueba = User::updateOrCreate(
            ['email' => 'usuario.prueba@acacias.gov.co'],
            [
                'name' => 'Leonardo Usuario Ciudadano',
                'documento' => $testDoc,
                'id_form_pvd' => $testCitizen->id_form_pvd,
                'password' => Hash::make('Acacias2026*'),
                'id_punto' => $puntoId,
                'telefono' => '3201234567',
                'cargo' => 'Usuario Ciudadano',
                'activo' => true,
            ]
        );
        $usuarioPrueba->syncRoles(['Usuario']);
    }
}
