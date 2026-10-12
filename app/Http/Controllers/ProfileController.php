<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'             => 'required|string|max:100',
            'username'         => 'required|string|max:50|unique:users,username,' . $user->id_user . ',id_user',
            'password'         => 'nullable|string|min:6',
            'current_password' => 'nullable|string',
        ]);

        // Ganti password: password lama wajib benar
        if (!empty($data['password'])) {
            if (!Hash::check($data['current_password'] ?? '', $user->password)) {
                return response()->json([
                    'errors' => ['current_password' => ['Password lama salah.']],
                ], 422);
            }
            $user->password = Hash::make($data['password']);
        }

        $user->name = $data['name'];
        $user->username = $data['username'];
        $user->save();

        return response()->json([
            'name'     => $user->name,
            'username' => $user->username,
        ]);
    }
}