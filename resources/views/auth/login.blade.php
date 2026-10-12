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

    <form method="POST" action="{{ route('login.process') }}">
      @csrf
      <div class="field">
        <label>Username</label>
        <input id="loginUser" name="username" value="{{ old('username') }}" placeholder="username" required autofocus>
      </div>
      <div class="field">
        <label>Password</label>
        <input id="loginPass" name="password" type="password" placeholder="••••••••" required>
      </div>
      <button type="submit" class="btn btn-primary">Masuk</button>
    </form>

    @error('username')
      <div class="error-msg" style="display:block">{{ $message }}</div>
    @enderror
  </div>
</div>

</body>
</html>