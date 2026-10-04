<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

/*
|--------------------------------------------------------------------------
| Auth (login & logout murni di sisi browser / localStorage, lihat app.js)
|--------------------------------------------------------------------------
*/

Route::get('/login', function () {
    return view('auth.login');
})->name('login');

/*
|--------------------------------------------------------------------------
| Dashboard (Superadmin & Administrator)
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', function () {
    return view('dashboard.index', ['pageKey' => 'dashboard']);
})->name('dashboard');

/*
|--------------------------------------------------------------------------
| Superadmin
|--------------------------------------------------------------------------
*/

Route::get('/pengguna', function () {
    return view('pengguna.index', ['pageKey' => 'pengguna']);
})->name('pengguna.index');

Route::get('/menu', function () {
    return view('menu.index', ['pageKey' => 'menu']);
})->name('menu.index');

/*
|--------------------------------------------------------------------------
| Administrator
|--------------------------------------------------------------------------
*/

Route::get('/stok', function () {
    return view('stok.index', ['pageKey' => 'stok']);
})->name('stok.index');

/*
|--------------------------------------------------------------------------
| Kasir (satu halaman utuh, modal pembayaran/struk/QR menu ada di dalamnya)
|--------------------------------------------------------------------------
*/

Route::get('/kasir', function () {
    return view('kasir.index', ['pageKey' => 'kasir']);
})->name('kasir.index');

/*
|--------------------------------------------------------------------------
| Laporan (semua role, tampilan beda sesuai role lewat app.js)
|--------------------------------------------------------------------------
*/

Route::get('/laporan', function () {
    return view('laporan.index', ['pageKey' => 'laporan']);
})->name('laporan.index');

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

Route::get('/profile', function () {
    return view('profile.index', ['pageKey' => 'profil']);
})->name('profile.index');