/**
 * Adem Ayem - Application Entry Point & Orchestrator
 * Menghubungkan seluruh modul aplikasi dan menginisialisasi siklus hidup halaman.
 *
 * Modul yang tersedia di /js/modules/:
 * - core.js       : Konfigurasi LocalStorage, utilitas rupiah, autentikasi, dan bootstrap
 * - qr-code.js    : Library generator QR Code SVG dan modal QR Menu
 * - dashboard.js  : Ringkasan statistik dan monitoring stok menipis
 * - users.js      : Manajemen pengguna & hak akses role (client fallback)
 * - menu.js       : Kelola katalog menu, foto/emoji, dan integrasi API
 * - stok.js       : Inventaris bahan, barang masuk/keluar, dan log mutasi
 * - kasir.js      : Antarmuka kasir/POS, keranjang, PB1 10%, dan simpan order
 * - payment.js    : Modal pembayaran tunai/qris/transfer, kembalian, dan cetak struk
 * - riwayat.js    : Riwayat transaksi pesanan dan pelunasan status pending
 * - laporan.js    : Laporan keuangan, analitik grafik, dan laporan stok
 * - profil.js     : Pengaturan profil saya dan ganti password
 */

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