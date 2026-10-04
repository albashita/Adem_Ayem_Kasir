<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>@yield('title', 'Adem Ayem')</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/app.css') }}">
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
  // Dipakai app.js untuk tahu ini halaman apa & ke mana link sidebar harus mengarah,
  // karena di Laravel tiap menu adalah route/URL sungguhan (bukan SPA satu halaman).
  const PAGE_KEY = @json($pageKey ?? 'dashboard');
  const ROUTE_URLS = {
    dashboard: @json(route('dashboard')),
    pengguna: @json(route('pengguna.index')),
    menu: @json(route('menu.index')),
    stok: @json(route('stok.index')),
    kasir: @json(route('kasir.index')),
    laporan: @json(route('laporan.index')),
    profil: @json(route('profile.index')),
    login: @json(route('login'))
  };
</script>
<script src="{{ asset('js/app.js') }}"></script>
</body>
</html>