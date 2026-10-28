<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Masuk - Adem Ayem</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Kaushan+Script&display=swap" rel="stylesheet">
<style>
        * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Poppins',sans-serif; color:#1d2a23; }

    .lg-page { min-height:100vh; display:flex; align-items:center; justify-content:center;
        padding:calc(32px + env(safe-area-inset-top)) 20px calc(32px + env(safe-area-inset-bottom));
        background:radial-gradient(circle at 50% 0%, #d6ecdd, #f1f4f2 62%); }
    .lg-card { width:100%; max-width:350px; background:#fff; border-radius:20px;
        padding:26px 26px 34px; box-shadow:0 8px 30px rgba(20,60,40,.12); }

    /* Header merek */
    .lg-brand { text-align:center; margin-bottom:34px; }
    .lg-brand svg { display:block; margin:0 auto; width:66px; height:auto; }
    .lg-depot { font-size:10px; letter-spacing:3.5px; font-weight:600; color:#8a6a12; text-transform:uppercase; margin-top:2px; }
    .lg-name { font-family:'Kaushan Script',cursive; font-size:36px; line-height:1; margin-top:-2px; color:#2f7d4f; }

    .lg-alert { background:#fbe4df; color:#8a2a1c; border-radius:10px; padding:9px 12px;
        font-size:12.5px; font-weight:500; margin-bottom:14px; }

    /* Form */
    .lg-label { display:block; font-size:12px; font-weight:600; margin-bottom:5px; }
    .lg-wrap { position:relative; margin-bottom:14px; }
    .lg-wrap.last { margin-bottom:20px; }
    .lg-ico { position:absolute; left:13px; top:50%; transform:translateY(-50%); pointer-events:none; width:16px; height:16px; }
    .lg-input { width:100%; padding:10px 12px 10px 38px; border:1.5px solid #d5ddd8; border-radius:10px;
        font:500 13.5px 'Poppins',sans-serif; background:#fff; color:#1d2a23; outline:none;
        transition:border-color .15s, box-shadow .15s; }
    .lg-input:focus { border-color:#2f7d4f; box-shadow:0 0 0 3px rgba(47,125,79,.15); }
    .lg-input.pw { padding-right:42px; }
    .lg-eye { position:absolute; right:6px; top:50%; transform:translateY(-50%); border:0; background:transparent;
        padding:6px; cursor:pointer; color:#5f6b64; display:flex; }
    .lg-eye svg { width:18px; height:18px; }

    .lg-btn { width:100%; padding:11px; border:0; border-radius:10px; background:#2f7d4f; color:#fff;
        font:600 14px 'Poppins',sans-serif; cursor:pointer; transition:background .15s, transform .1s; }
    .lg-btn:hover { background:#276a43; }
    .lg-btn:active { transform:scale(.99); }
    .lg-btn:disabled { opacity:.75; cursor:wait; }
    .lg-foot { margin-top:18px; text-align:center; font-size:10.5px; color:#7a847e; }
</style>
</head>
<body>

<div class="lg-page">
  <div class="lg-card">

    <div class="lg-brand">
      <svg width="86" height="46" viewBox="0 0 150 78" fill="none" stroke="#2f7d4f" stroke-width="4" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 66L34 50H116L142 66Z"/>
        <path d="M34 50L52 36H98L116 50"/>
        <path d="M52 36L66 22H84L98 36"/>
        <path d="M66 22L75 10L84 22"/>
      </svg>
      <div class="lg-depot">Depot Yu Sri</div>
      <div class="lg-name">Adem Ayem</div>
    </div>

    @if ($errors->any())
      <div class="lg-alert" role="alert">{{ $errors->first() }}</div>
    @elseif (session('error'))
      <div class="lg-alert" role="alert">{{ session('error') }}</div>
    @endif

    <form method="POST" action="{{ route('login.process') }}" id="loginForm">
      @csrf

      <label class="lg-label" for="loginUser">Username</label>
      <div class="lg-wrap">
        <svg class="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6b64" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/></svg>
        <input id="loginUser" class="lg-input" name="username" value="{{ old('username') }}"
               placeholder="Masukkan username" autocomplete="username" required autofocus>
      </div>

      <label class="lg-label" for="loginPass">Password</label>
      <div class="lg-wrap last">
        <svg class="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6b64" stroke-width="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
        <input id="loginPass" class="lg-input pw" name="password" type="password"
               placeholder="Masukkan password" autocomplete="current-password" required>
        <button type="button" class="lg-eye" id="togglePass" aria-label="Tampilkan password">
          <svg id="eyeOn" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg id="eyeOff" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="display:none"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A16.8 16.8 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
        </button>
      </div>

      <button type="submit" class="lg-btn" id="loginBtn">Masuk</button>
    </form>

    <p class="lg-foot">Lupa password? Hubungi owner untuk mengatur ulang.</p>
  </div>
</div>

<script>
    const pass = document.getElementById('loginPass');
    const eyeOn = document.getElementById('eyeOn');
    const eyeOff = document.getElementById('eyeOff');
    const toggle = document.getElementById('togglePass');

    toggle.addEventListener('click', () => {
        const show = pass.type === 'password';
        pass.type = show ? 'text' : 'password';
        eyeOn.style.display = show ? 'none' : '';
        eyeOff.style.display = show ? '' : 'none';
        toggle.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    });

    // Cegah klik ganda saat form dikirim
    document.getElementById('loginForm').addEventListener('submit', () => {
        const btn = document.getElementById('loginBtn');
        setTimeout(() => { btn.disabled = true; btn.textContent = 'Memproses...'; }, 0);
    });
</script>
</body>
</html>