<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

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

        // Compatibilidad con rol legacy
        $legacyCoordinador = Role::firstOrCreate(['name' => 'Coordinador', 'guard_name' => 'web']);
        $legacyCoordinador->syncPermissions($coordinadorPvdRole->permissions);

        // =====================================================================
        // CUENTAS OFICIALES PARA PRUEBAS Y OPERACIÓN
        // =====================================================================

        // 1. Administrador TIC
        $admin = User::updateOrCreate(
            ['email' => 'admin@acacias.gov.co'],
            [
                'name' => 'Administrador TIC',
                'password' => Hash::make('Acacias2026*'),
                'id_punto' => 1,
                'cargo' => 'Líder TIC Municipal',
                'activo' => true,
            ]
        );
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

        // 3. Gestor PVD PLUS (Punto 1)
        $gestorPlus = User::updateOrCreate(
            ['email' => 'gestor.plus@acacias.gov.co'],
            [
                'name' => 'Gestor PVD PLUS',
                'password' => Hash::make('GestorPlus2026*'),
                'id_punto' => 1,
                'cargo' => 'Gestor Ventanilla PLUS',
                'activo' => true,
            ]
        );
        $gestorPlus->syncRoles(['Gestor PVD']);

        // 4. Coordinador PVD Tradicional (Punto 2)
        $coordTradicional = User::updateOrCreate(
            ['email' => 'coordinador.tradicional@acacias.gov.co'],
            [
                'name' => 'Coordinador PVD Tradicional',
                'password' => Hash::make('PvdTradicional2026*'),
                'id_punto' => 2,
                'cargo' => 'Coordinador PVD Tradicional',
                'activo' => true,
            ]
        );
        $coordTradicional->syncRoles(['Coordinador PVD', 'Coordinador']);

        // 5. Gestor PVD Tradicional (Punto 2)
        $gestorTradicional = User::updateOrCreate(
            ['email' => 'gestor.tradicional@acacias.gov.co'],
            [
                'name' => 'Gestor PVD Tradicional',
                'password' => Hash::make('GestorTradicional2026*'),
                'id_punto' => 2,
                'cargo' => 'Gestor Ventanilla Tradicional',
                'activo' => true,
            ]
        );
        $gestorTradicional->syncRoles(['Gestor PVD']);

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
    }
}
