@extends('layouts.app')

@section('title', 'Dashboard - Adem Ayem')
@section('page-title', 'Dashboard')

@section('content')
      <div class="grid" id="dashStats"></div>
      <div class="panel"><h3>Stok Bahan Menipis (≤5)</h3>
      <table><thead><tr><th>Barang</th><th>Kategori</th><th>Sisa Stok</th><th>Satuan</th></tr></thead><tbody id="lowStockBody"></tbody></table></div>
@endsection

@push('scripts')
<script>
/* ===== HALAMAN: Dashboard (superadmin & administrator) ===== */
function renderDashboard(){
  const inv = getInv();
  const trx = getTrx();
  const today = new Date().toISOString().slice(0,10);

  const todayTrx = trx.filter(t => t.date.slice(0,10) === today);
  const todaySales = todayTrx.reduce((sum, t) => sum + t.total, 0);
  const todaySpend = stockSpend(today, today);

  const lowStock = inv.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card"><div class="num">${inv.length}</div><div class="lbl">Total Jenis Bahan</div></div>
    <div class="stat-card"><div class="num">${rupiah(todaySales)}</div><div class="lbl">Penjualan Hari Ini</div></div>
    <div class="stat-card"><div class="num">${rupiah(todaySpend)}</div><div class="lbl">Pembelian Stok Hari Ini</div></div>
    <div class="stat-card"><div class="num">${todayTrx.length}</div><div class="lbl">Transaksi Penjualan Hari Ini</div></div>
  `;

  document.getElementById('lowStockBody').innerHTML =
    lowStock.length
      ? lowStock.map(p => `
        <tr>
          <td>${p.name}</td>
          <td><span class="tag tag-${p.category}">${CAT_LABEL[p.category] || p.category}</span></td>
          <td>${p.stock}</td>
          <td>${p.unit}</td>
        </tr>`).join('')
      : `<tr><td colspan="4" class="empty">Semua stok aman</td></tr>`;
}
</script>
@endpush