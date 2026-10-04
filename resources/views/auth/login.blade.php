<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Adem Ayem</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>

<div id="loginScreen">
  <div class="login-card">
    <h1>Adem<span> Ayem</span></h1>
    <p class="sub">Masuk untuk mengelola sistem</p>
    <div class="field"><label>Username</label><input id="loginUser" placeholder="superadmin"></div>
    <div class="field"><label>Password</label><input id="loginPass" type="password" placeholder="••••••••"></div>
    <button class="btn btn-primary" onclick="doLogin()">Masuk</button>
    <div class="error-msg" id="loginError"></div>
    <div class="hint">Demo akun:<br>superadmin / super123<br>administrator / admin123<br>kasir / kasir123</div>
  </div>
</div>

<script>
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
  const FIRST_PAGE_BY_ROLE = { superadmin:'dashboard', administrator:'dashboard', kasir:'kasir' };
</script>
<script src="{{ asset('js/app.js') }}" data-page="login"></script>
</body>
</html>