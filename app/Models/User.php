<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;

#[Fillable(['username', 'name', 'email', 'password', 'role', 'phone', 'address', 'is_active'])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    protected $table = 'users';
    protected $primaryKey = 'id_user';

    // tabel users tidak punya kolom remember_token
    protected $rememberTokenName = '';

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }
}