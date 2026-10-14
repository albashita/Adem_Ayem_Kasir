<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // Belum login -> ke halaman login
        if (! $user) {
            return redirect()->route('login');
        }

        // Role sesuai -> lanjut
        if (in_array($user->role, $roles, true)) {
            return $next($request);
        }

        $message = 'Anda tidak punya akses ke halaman ini.';

        // Permintaan AJAX/JSON tetap dibalas 403
        if ($request->expectsJson()) {
            abort(403, $message);
        }

        // Halaman utama tiap role
        $home = match ($user->role) {
            'kasir'          => 'kasir.index',
            'owner', 'admin' => 'dashboard',
            default          => null,
        };

        // Role tak dikenal, atau sudah di halaman utamanya sendiri:
        // tampilkan 403 supaya tidak terjadi redirect berulang (loop)
        if ($home === null || $request->routeIs($home)) {
            abort(403, $message);
        }

        // Role salah -> kembalikan ke halaman utamanya sendiri
        return redirect()->route($home)->with('error', $message);
    }
}