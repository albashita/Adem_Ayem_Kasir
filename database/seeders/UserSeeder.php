<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
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