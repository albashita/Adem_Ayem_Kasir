(function () {
  const MODULES = [
    'core.js',
    'qr-code.js',
    'dashboard.js',
    'users.js',
    'menu.js',
    'stok.js',
    'kasir.js',
    'payment.js',
    'riwayat.js',
    'laporan.js',
    'profil.js'
  ];

  function initApp() {
    if (typeof seedIfEmpty === 'function') seedIfEmpty();
    if (typeof ensureMenuCodes === 'function') ensureMenuCodes();

    if (document.getElementById('loginScreen')) {
      const passEl = document.getElementById('loginPass');
      if (passEl) {
        passEl.addEventListener('keydown', e => {
          if (e.key === 'Enter') doLogin();
        });
      }
    } else if (typeof PAGE_KEY !== 'undefined' && typeof bootstrapPage === 'function') {
      bootstrapPage();
    }
  }

  // Kasus 1: Modul sudah dimuat melalui script tags di Blade
  if (typeof seedIfEmpty === 'function') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
    return;
  }

  // Kasus 2: Fallback loader jika app.js di-load secara mandiri
  const currentScript = document.currentScript;
  const basePath = currentScript
    ? currentScript.src.replace(/app\.js(\?.*)?$/, 'modules/')
    : '/js/modules/';

  let loadedCount = 0;
  MODULES.forEach(mod => {
    const s = document.createElement('script');
    s.src = basePath + mod;
    s.async = false; // Memastikan urutan dependensi terjaga
    s.onload = () => {
      loadedCount++;
      if (loadedCount === MODULES.length) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initApp);
        } else {
          initApp();
        }
      }
    };
    s.onerror = (e) => {
      console.error('[AdemAyem] Gagal memuat modul:', mod, e);
    };
    document.head.appendChild(s);
  });
})();