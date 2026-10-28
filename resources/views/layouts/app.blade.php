
@php
    $roleMap = [
        'owner' => 'superadmin',
        'admin' => 'administrator',
        'kasir' => 'kasir',
    ];

    $serverUser = [
        'id'       => auth()->user()->id_user,
        'name'     => auth()->user()->name,
        'username' => auth()->user()->username,
        'role'     => $roleMap[auth()->user()->role] ?? 'kasir',
    ];

    $pageKeyMap = [
        'dashboard'      => 'dashboard',
        'pengguna.index' => 'pengguna',
        'menu.index'     => 'menu',
        'stok.index'     => 'stok',
        'kasir.index'    => 'kasir',
        'riwayat.index'  => 'riwayat',
        'laporan.index'  => 'laporan',
        'profile.index'  => 'profil',
    ];

    $pageKey = $pageKeyMap[request()->route()?->getName()] ?? 'dashboard';
@endphp

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

    <title>@yield('title', 'Adem Ayem')</title>

    <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
    >

    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/sidebar.css') }}">
</head>

<body>

    <div id="appScreen" style="display:block;">
        <div class="shell">

            @include('layouts.sidebar')

            <div class="main">
                @include('layouts.navbar')

                @yield('content')
            </div>

        </div>
    </div>

    <div id="receiptPrint"></div>

    <script>
        const ROUTE_URLS = {
            dashboard: @json(route('dashboard')),
            pengguna: @json(route('pengguna.index')),
            menu: @json(route('menu.index')),
            stok: @json(route('stok.index')),
            kasir: @json(route('kasir.index')),
            riwayat: @json(url('/riwayat')),
            laporan: @json(route('laporan.index')),
            profil: @json(route('profile.index')),
            login: @json(route('login'))
        };

        const FIRST_PAGE_BY_ROLE = {
            superadmin: 'dashboard',
            administrator: 'dashboard',
            kasir: 'kasir'
        };

        // Data user dari sesi Laravel
        const SERVER_USER = @json($serverUser);

        const LOGOUT_URL = @json(route('logout'));
        const CSRF_TOKEN = @json(csrf_token());
        const PAGE_KEY = @json($pageKey);
    </script>

    <!-- Modul JavaScript Aplikasi -->
    <script src="{{ asset('js/modules/core.js') }}"></script>
    <script src="{{ asset('js/modules/qr-code.js') }}"></script>
    <script src="{{ asset('js/modules/dashboard.js') }}"></script>
    <script src="{{ asset('js/modules/users.js') }}"></script>
    <script src="{{ asset('js/modules/menu.js') }}"></script>
    <script src="{{ asset('js/modules/stok.js') }}"></script>
    <script src="{{ asset('js/modules/kasir.js') }}"></script>
    <script src="{{ asset('js/modules/payment.js') }}"></script>
    <script src="{{ asset('js/modules/riwayat.js') }}"></script>
    <script src="{{ asset('js/modules/laporan.js') }}"></script>
    <script src="{{ asset('js/modules/profil.js') }}"></script>
    <script src="{{ asset('js/app.js') }}"></script>
    @stack('scripts')

</body>
</html>
