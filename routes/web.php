<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Home: arahkan sesuai status login & role
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    if (! Auth::check()) {
        return redirect()->route('login');
    }

    return Auth::user()->role === 'kasir'
        ? redirect()->route('kasir.index')
        : redirect()->route('dashboard');
})->name('home');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::get('/login', [AuthController::class, 'showLogin'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->name('login.process');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

/*
|--------------------------------------------------------------------------
| Halaman aplikasi (wajib login)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {

    // Owner & Admin
    Route::middleware('role:owner,admin')->group(function () {
        Route::get('/dashboard', function () {
            return view('dashboard.index', ['pageKey' => 'dashboard']);
        })->name('dashboard');
    });

    // Owner saja
    Route::middleware('role:owner')->group(function () {
        // Pengelolaan pengguna (CRUD)
        Route::get('/pengguna', [UserController::class, 'index'])->name('pengguna.index');
        Route::post('/pengguna', [UserController::class, 'store'])->name('pengguna.store');
        Route::put('/pengguna/{user}', [UserController::class, 'update'])->name('pengguna.update');
        Route::delete('/pengguna/{user}', [UserController::class, 'destroy'])->name('pengguna.destroy');

        Route::get('/menu', function () {
            return view('menu.index', ['pageKey' => 'menu']);
        })->name('menu.index');
    });

    // Admin saja
    Route::middleware('role:admin')->group(function () {
        Route::get('/stok', function () {
            return view('stok.index', ['pageKey' => 'stok']);
        })->name('stok.index');
    });

    // Kasir saja
    Route::middleware('role:kasir')->group(function () {
        Route::get('/kasir', function () {
            return view('kasir.index', ['pageKey' => 'kasir']);
        })->name('kasir.index');
    });

    // Semua role yang sudah login
    Route::get('/laporan', function () {
        return view('laporan.index', ['pageKey' => 'laporan']);
    })->name('laporan.index');

    Route::get('/profile', function () {
        return view('profile.index', ['pageKey' => 'profil']);
    })->name('profile.index');

    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
});