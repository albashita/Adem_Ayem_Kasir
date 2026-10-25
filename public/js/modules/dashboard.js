/**
 * Adem Ayem - Dashboard Module
 * Menampilkan ringkasan statistik dan peringatan stok menipis pada dashboard.
 */

function renderDashboard() {
  const inv = getInv();
  const trx = getTrx();
  const today = new Date().toISOString().slice(0, 10);

  const todayTrx = trx.filter(t => t.date.slice(0, 10) === today);
  const todaySales = todayTrx.reduce((sum, t) => sum + t.total, 0);
  const todaySpend = stockSpend(today, today);

  const lowStock = inv
    .filter(p => p.stock <= 5)
    .sort((a, b) => a.stock - b.stock);

  const dashStats = document.getElementById('dashStats');
  if (dashStats) {
    dashStats.innerHTML = `
      <div class="stat-card">
        <div class="num">${inv.length}</div>
        <div class="lbl">Total Jenis Bahan</div>
      </div>
      <div class="stat-card">
        <div class="num">${rupiah(todaySales)}</div>
        <div class="lbl">Penjualan Hari Ini</div>
      </div>
      <div class="stat-card">
        <div class="num">${rupiah(todaySpend)}</div>
        <div class="lbl">Pembelian Stok Hari Ini</div>
      </div>
      <div class="stat-card">
        <div class="num">${todayTrx.length}</div>
        <div class="lbl">Transaksi Penjualan Hari Ini</div>
      </div>
    `;
  }

  const lowStockBody = document.getElementById('lowStockBody');
  if (lowStockBody) {
    lowStockBody.innerHTML = lowStock.length
      ? lowStock.map(p => `
          <tr>
            <td>${escapeMenuHTML(p.name)}</td>
            <td><span class="tag tag-${p.category}">${CAT_LABEL[p.category] || p.category}</span></td>
            <td>${p.stock}</td>
            <td>${escapeMenuHTML(p.unit)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="4" class="empty">Semua stok aman</td></tr>`;
  }
}
