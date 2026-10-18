
<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MenuController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| Pengecekan Role
|--------------------------------------------------------------------------
*/
$role = fn (string ...$roles) => function (
    Request $request,
    Closure $next
) use ($roles) {
    $user = $request->user();

    if (! $user) {
        return redirect()->route('login');
    }

    if (in_array($user->role, $roles, true)) {
        return $next($request);
    }

    $message = 'Anda tidak punya akses ke halaman ini.';

    if ($request->expectsJson()) {
        abort(403, $message);
    }

    $home = match ($user->role) {
        'kasir' => 'kasir.index',
        'owner', 'admin' => 'dashboard',
        default => null,
    };

    if ($home === null || $request->routeIs($home)) {
        abort(403, $message);
    }

    return redirect()->route($home)->with('error', $message);
};

/*
|--------------------------------------------------------------------------
| Home
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

Route::redirect('/home', '/');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::get('/login', [AuthController::class, 'showLogin'])
    ->name('login')
    ->middleware('guest');

Route::post('/login', [AuthController::class, 'login'])
    ->name('login.process');

Route::post('/logout', [AuthController::class, 'logout'])
    ->name('logout')
    ->middleware('auth');

/*
|--------------------------------------------------------------------------
| Halaman Aplikasi
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () use ($role) {

    // Owner dan Admin
    Route::group(['middleware' => [$role('owner', 'admin')]], function () {
        Route::get('/dashboard', function () {
            return view('dashboard.index', [
                'pageKey' => 'dashboard'
            ]);
        })->name('dashboard');
    });

    // Owner saja
    Route::group(['middleware' => [$role('owner')]], function () {

        // Pengelolaan Pengguna
        Route::get('/pengguna', [UserController::class, 'index'])
            ->name('pengguna.index');

        Route::post('/pengguna', [UserController::class, 'store'])
            ->name('pengguna.store');

        Route::put('/pengguna/{user}', [UserController::class, 'update'])
            ->name('pengguna.update');

        Route::delete('/pengguna/{user}', [UserController::class, 'destroy'])
            ->name('pengguna.destroy');

        // Kelola Menu
        Route::get('/menu/data', [MenuController::class, 'data'])
            ->name('menu.data');
            
        Route::get('/menu', [MenuController::class, 'index'])
            ->name('menu.index');

        Route::post('/menu', [MenuController::class, 'store'])
            ->name('menu.store');

        Route::put('/menu/{menu}', [MenuController::class, 'update'])
            ->name('menu.update');

        Route::delete('/menu/{menu}', [MenuController::class, 'destroy'])
            ->name('menu.destroy');
    });

    // Admin saja
    Route::group(['middleware' => [$role('admin')]], function () {
        Route::get('/stok', function () {
            return view('stok.index', [
                'pageKey' => 'stok'
            ]);
        })->name('stok.index');
    });

    // Kasir saja
    Route::group(['middleware' => [$role('kasir')]], function () {
        Route::get('/kasir', function () {
            return view('kasir.index', [
                'pageKey' => 'kasir'
            ]);
        })->name('kasir.index');
    });

    // Semua role yang sudah login
    Route::get('/laporan', function () {
        return view('laporan.index', [
            'pageKey' => 'laporan'
        ]);
    })->name('laporan.index');

    Route::get('/profile', function () {
        return view('profile.index', [
            'pageKey' => 'profil'
        ]);
    })->name('profile.index');

    Route::put('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');
});

/*
|--------------------------------------------------------------------------
| Alamat Tidak Dikenal
|--------------------------------------------------------------------------
*/
Route::fallback(function (Request $request) {
    if (pathinfo($request->path(), PATHINFO_EXTENSION) !== '') {
        abort(404);
    }

    return redirect()->route('home');
});
