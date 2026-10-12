<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const ROLES = ['owner', 'admin', 'kasir'];

    public function index()
    {
        return view('pengguna.index', [
            'pageKey' => 'pengguna',
            'users'   => User::orderBy('id_user')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:75'],
            'username' => ['required', 'string', 'max:30', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6', 'max:50'],
            'role'     => ['required', Rule::in(self::ROLES)],
        ]);

        User::create($data);

        return redirect()->route('pengguna.index')->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:75'],
            'username' => ['required', 'string', 'max:30',
                           Rule::unique('users', 'username')->ignore($user->id_user, 'id_user')],
            'password' => ['nullable', 'string', 'min:6', 'max:50'],
            'role'     => ['required', Rule::in(self::ROLES)],
        ]);

        if (empty($data['password'])) {
            unset($data['password']); // kosong = password tidak diubah
        }

        $user->update($data);

        return redirect()->route('pengguna.index')->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id_user === $request->user()->id_user) {
            return back()->withErrors(['hapus' => 'Tidak bisa menghapus akun sendiri.']);
        }

        try {
            $user->delete();
        } catch (QueryException $e) {
            // user sudah punya riwayat transaksi/stok, tidak boleh dihapus
            return back()->withErrors(['hapus' => 'Pengguna ini sudah punya riwayat data, jadi tidak bisa dihapus.']);
        }

        return redirect()->route('pengguna.index')->with('success', 'Pengguna berhasil dihapus.');
    }
}