<div class="sidebar" id="sidebarNav">
  <div class="brand">Adem<span> Ayem</span></div>
  <div class="rolechip" id="roleChip"></div>
  <!-- Daftar menu diisi otomatis oleh app.js sesuai role yang login -->
</div>

<a href="{{ route('riwayat.index') }}"
   class="{{ request()->routeIs('riwayat.index') ? 'active' : '' }}">
    <span>Riwayat Transaksi</span>
</a>
