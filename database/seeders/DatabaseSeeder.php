<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
{
    $akun = [
        ['name' => 'Owner', 'username' => 'owner', 'role' => 'owner'],
        ['name' => 'Admin', 'username' => 'admin', 'role' => 'admin'],
        ['name' => 'Kasir', 'username' => 'kasir', 'role' => 'kasir'],
    ];

    foreach ($akun as $a) {
        User::updateOrCreate(
            ['username' => $a['username']],
            [
                'name'     => $a['name'],
                'password' => 'password123', // otomatis di-hash oleh cast
                'role'     => $a['role'],
            ]
        );
    }
}
}
