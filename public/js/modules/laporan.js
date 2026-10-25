/**
 * Adem Ayem - Laporan & Analitik Module
 * Laporan keuangan, analitik performa penjualan, grafik mingguan, dan laporan stok inventaris.
 */

function pctDelta(now, prev) {
  if (prev === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - prev) / prev) * 100);
}

function deltaHTML(pct, suffix) {
  if (pct === 0) return `<span class="delta">Sama dengan kemarin</span>`;
  const up = pct > 0;
  return `<span class="delta ${up ? 'up' : 'down'}">${up ? '↑' : '↓'} ${Math.abs(pct)}% ${suffix}</span>`;
}

function renderReportAnalytics() {
  const trx = getTrx();
  const todayStr = new Date().toISOString().slice(0, 10);
  const yStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayTrx = trx.filter(t => t.date.slice(0, 10) === todayStr);
  const yTrx = trx.filter(t => t.date.slice(0, 10) === yStr);

  const todaySales = todayTrx.reduce((s, t) => s + t.total, 0);
  const ySales = yTrx.reduce((s, t) => s + t.total, 0);
  const todayTax = todayTrx.reduce((s, t) => s + t.tax, 0);

  const avgToday = todayTrx.length ? Math.round(todaySales / todayTrx.length) : 0;
  const avgY = yTrx.length ? Math.round(ySales / yTrx.length) : 0;

  const repTodaySales = document.getElementById('repTodaySales');
  if (repTodaySales) repTodaySales.textContent = rupiah(todaySales);

  const repTodayDelta = document.getElementById('repTodayDelta');
  if (repTodayDelta) repTodayDelta.innerHTML = deltaHTML(pctDelta(todaySales, ySales), 'vs kemarin');

  const repTodayCount = document.getElementById('repTodayCount');
  if (repTodayCount) repTodayCount.textContent = todayTrx.length;

  const repCountDelta = document.getElementById('repCountDelta');
  if (repCountDelta) repCountDelta.innerHTML = deltaHTML(pctDelta(todayTrx.length, yTrx.length), 'vs kemarin');

  const repAvgTrx = document.getElementById('repAvgTrx');
  if (repAvgTrx) repAvgTrx.textContent = rupiah(avgToday);

  const repAvgDelta = document.getElementById('repAvgDelta');
  if (repAvgDelta) repAvgDelta.innerHTML = deltaHTML(pctDelta(avgToday, avgY), 'vs kemarin');

  const repTodayTax = document.getElementById('repTodayTax');
  if (repTodayTax) repTodayTax.textContent = rupiah(todayTax);

  const todaySpend = stockSpend(todayStr, todayStr);
  const todayNet = todaySales - todaySpend;

  const repTodaySpend = document.getElementById('repTodaySpend');
  if (repTodaySpend) repTodaySpend.textContent = rupiah(todaySpend);

  const todayNetEl = document.getElementById('repTodayNet');
  if (todayNetEl) {
    todayNetEl.textContent = rupiahNet(todayNet);
    todayNetEl.style.color = todayNet < 0 ? 'var(--danger)' : '';
  }

  // Grafik 7 hari terakhir
  const weeklyChart = document.getElementById('weeklyBarChart');
  if (weeklyChart) {
    const days = [];
    let maxVal = 1;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = d.toISOString().slice(0, 10);
      const val = trx.filter(t => t.date.slice(0, 10) === dStr).reduce((s, t) => s + t.total, 0);
      days.push({ label: d.toLocaleDateString('id-ID', { weekday: 'short' }), val });
      if (val > maxVal) maxVal = val;
    }
    const peakIdx = days.reduce((mi, d, i, arr) => d.val > arr[mi].val ? i : mi, 0);
    weeklyChart.innerHTML = days.map((d, i) => `
      <div class="bar-col">
        <div class="bv">${d.val >= 1000 ? (d.val / 1000).toFixed(1) + 'rb' : d.val}</div>
        <div class="bar ${i === peakIdx && d.val > 0 ? 'peak' : ''}" style="height:${Math.max(4, (d.val / maxVal) * 160)}px;"></div>
        <div class="bd">${d.label}</div>
      </div>
    `).join('');
  }

  // Metode pembayaran (donut chart)
  const donut = document.getElementById('paymentDonut');
  const legend = document.getElementById('paymentLegend');
  if (donut && legend) {
    const payColors = { tunai: '#2F7D50', qris: '#E08A2C', kartu: '#2A5A9C', transfer: '#B4472F' };
    const payTotals = {};
    let grandTotal = 0;
    trx.forEach(t => {
      payTotals[t.payment] = (payTotals[t.payment] || 0) + t.total;
      grandTotal += t.total;
    });
    const payEntries = Object.entries(payTotals).sort((a, b) => b[1] - a[1]);
    if (grandTotal > 0) {
      let acc = 0;
      const gradParts = [];
      payEntries.forEach(([m, v]) => {
        const pct = (v / grandTotal) * 100;
        gradParts.push(`${payColors[m] || '#999'} ${acc}% ${acc + pct}%`);
        acc += pct;
      });
      donut.style.background = `conic-gradient(${gradParts.join(',')})`;
      donut.innerHTML = `<div class="inner">${Math.round((payEntries[0][1] / grandTotal) * 100)}%<span>${PAY_LABELS[payEntries[0][0]] || payEntries[0][0]}</span></div>`;
      legend.innerHTML = payEntries.map(([m, v]) => `
        <div class="legend-row"><span><span class="legend-dot" style="background:${payColors[m] || '#999'}"></span>${PAY_LABELS[m] || m}</span><b>${Math.round((v/grandTotal)*100)}%</b></div>
      `).join('');
    } else {
      donut.style.background = '#EEE';
      donut.innerHTML = `<div class="inner">0%</div>`;
      legend.innerHTML = `<div class="empty">Belum ada transaksi</div>`;
    }
  }

  // Menu terlaris bulan ini
  const topMenuBody = document.getElementById('topMenuBody');
  if (topMenuBody) {
    const monthStr = todayStr.slice(0, 7);
    const menuAgg = {};
    trx.filter(t => t.date.slice(0, 7) === monthStr).forEach(t => {
      (t.items || []).forEach(i => {
        if (!menuAgg[i.name]) menuAgg[i.name] = { qty: 0, omzet: 0 };
        menuAgg[i.name].qty += i.qty;
        menuAgg[i.name].omzet += i.qty * i.price;
      });
    });
    const topMenu = Object.entries(menuAgg).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
    topMenuBody.innerHTML = topMenu.length
      ? topMenu.map(([name, v]) => `<tr><td>${escapeMenuHTML(name)}</td><td>${v.qty}</td><td>${rupiah(v.omzet)}</td></tr>`).join('')
      : `<tr><td colspan="3" class="empty">Belum ada penjualan bulan ini</td></tr>`;
  }

  // Jam tersibuk
  const topHoursBody = document.getElementById('topHoursBody');
  if (topHoursBody) {
    const hourAgg = {};
    trx.forEach(t => {
      const h = new Date(t.date).getHours();
      const bucket = Math.floor(h / 2) * 2;
      const key = `${String(bucket).padStart(2, '0')}.00 - ${String(bucket + 2).padStart(2, '0')}.00`;
      if (!hourAgg[key]) hourAgg[key] = { count: 0, omzet: 0 };
      hourAgg[key].count++;
      hourAgg[key].omzet += t.total;
    });
    const topHours = Object.entries(hourAgg).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
    topHoursBody.innerHTML = topHours.length
      ? topHours.map(([range, v]) => `<tr><td>${range}</td><td>${v.count}</td><td>${rupiah(v.omzet)}</td></tr>`).join('')
      : `<tr><td colspan="3" class="empty">Belum ada data transaksi</td></tr>`;
  }
}

// Normalisasi penamaan metode pembayaran
function normalizePaymentName(value) {
  const p = String(value || '').toLowerCase().trim();
  if (['tunai', 'cash', 'uang tunai'].includes(p)) return 'tunai';
  if (['qris', 'qr'].includes(p)) return 'qris';
  if (['debit', 'kartu debit'].includes(p)) return 'debit';
  if (['transfer', 'transfer bank'].includes(p)) return 'transfer';
  return p;
}

function renderReport() {
  const from = document.getElementById('repFrom')?.value || '';
  const to = document.getElementById('repTo')?.value || '';
  const method = (document.getElementById('repPaymentMethod')?.value || '').toLowerCase();

  const stockFrom = document.getElementById('repSpendFrom')?.value || '';
  const stockTo = document.getElementById('repSpendTo')?.value || '';

  const trx = getTrx()
    .filter(t => {
      const d = String(t.date || '').slice(0, 10);
      const payment = normalizePaymentName(t.payment);
      return (!from || d >= from) && (!to || d <= to) && (!method || payment === method);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const sales = trx.reduce((sum, t) => sum + Number(t.total || 0), 0);

  const repTotalSales = document.getElementById('repTotalSales');
  if (repTotalSales) repTotalSales.textContent = rupiah(sales);

  const repTotalTrx = document.getElementById('repTotalTrx');
  if (repTotalTrx) repTotalTrx.textContent = trx.length;

  // Laporan keuangan (khusus superadmin)
  const fin = document.getElementById('repFinance');
  if (fin) {
    const isSuper = currentUser() && currentUser().role === 'superadmin';
    fin.style.display = isSuper ? 'block' : 'none';

    if (isSuper) {
      const buys = getLog()
        .filter(l => {
          const d = String(l.date || '').slice(0, 10);
          return l.type === 'masuk' &&
                 Number(l.cost) > 0 &&
                 (!stockFrom || d >= stockFrom) &&
                 (!stockTo || d <= stockTo);
        })
        .reverse();

      const spend = buys.reduce((sum, l) => sum + Number(l.cost || 0), 0);
      const net = sales - spend;

      const repSpend = document.getElementById('repSpend');
      if (repSpend) repSpend.textContent = rupiah(spend);

      const netEl = document.getElementById('repNet');
      if (netEl) {
        netEl.textContent = rupiahNet(net);
        netEl.style.color = net < 0 ? 'var(--danger)' : '';
      }

      const inv = getInv();
      const repSpendBody = document.getElementById('repSpendBody');
      if (repSpendBody) {
        repSpendBody.innerHTML = buys.length
          ? buys.map(l => {
              const it = inv.find(x => x.id === l.itemId);
              return `<tr>
                <td>${new Date(l.date).toLocaleString('id-ID')}</td>
                <td>${it ? escapeMenuHTML(it.name) : '-'}</td>
                <td>${l.qty} ${it ? escapeMenuHTML(it.unit) : ''}</td>
                <td>${rupiah(l.cost)}</td>
              </tr>`;
            }).join('')
          : `<tr><td colspan="4" class="empty">Belum ada pembelian stok pada rentang ini</td></tr>`;
      }
    }
  }

  // Rekap metode pembayaran
  const payAgg = {};
  trx.forEach(t => {
    const key = normalizePaymentName(t.payment) || '-';
    if (!payAgg[key]) payAgg[key] = { count: 0, total: 0 };
    payAgg[key].count++;
    payAgg[key].total += Number(t.total || 0);
  });

  const payEntries = Object.entries(payAgg).sort((a, b) => b[1].total - a[1].total);
  const repPayBody = document.getElementById('repPayBody');
  if (repPayBody) {
    repPayBody.innerHTML = payEntries.length
      ? payEntries.map(([m, v]) => `
          <tr>
            <td>${PAY_LABELS[m] || ({ tunai: 'Tunai', qris: 'QRIS', debit: 'Debit', transfer: 'Transfer Bank' })[m] || m}</td>
            <td>${v.count}</td>
            <td>${rupiah(v.total)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="3" class="empty">Belum ada transaksi pada rentang ini</td></tr>`;
  }

  // Riwayat transaksi
  const repBody = document.getElementById('repBody');
  if (repBody) {
    repBody.innerHTML = trx.length
      ? trx.map(t => `
          <tr>
            <td>${new Date(t.date).toLocaleString('id-ID')}</td>
            <td>${(t.items || []).map(i => `${escapeMenuHTML(i.name)} x${i.qty}`).join(', ')}</td>
            <td>${(PAY_LABELS[normalizePaymentName(t.payment)] || normalizePaymentName(t.payment) || '-').toUpperCase()}</td>
            <td>${rupiah(t.total)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="4" class="empty">Tidak ada transaksi pada rentang ini</td></tr>`;
  }
}

// ===== LAPORAN STOK (untuk administrator) =====
function stockStatusHTML(n) {
  return n <= 0 ? '<span style="color:var(--danger);font-weight:600">Habis</span>'
       : n <= 5 ? '<span style="color:var(--accent);font-weight:600">Menipis</span>'
       : '<span style="color:#3E7A52;font-weight:600">Aman</span>';
}

function renderStockReport() {
  const inv = getInv();
  const menu = getMenu();
  const cat = document.getElementById('stCat')?.value || '';
  const from = document.getElementById('stFrom')?.value || '';
  const to = document.getElementById('stTo')?.value || '';

  const items = inv.filter(p => !cat || p.category === cat).sort((a, b) => a.stock - b.stock);
  const habis = items.filter(p => p.stock <= 0).length;
  const menipis = items.filter(p => p.stock > 0 && p.stock <= 5).length;

  const logs = getLog().filter(l => {
    const d = l.date.slice(0, 10);
    if ((from && d < from) || (to && d > to)) return false;
    if (!cat) return true;
    const it = inv.find(x => x.id === l.itemId);
    return it && it.category === cat;
  }).slice().reverse();

  const masuk = logs.filter(l => l.type === 'masuk').reduce((s, l) => s + l.qty, 0);
  const keluar = logs.filter(l => l.type === 'keluar').reduce((s, l) => s + l.qty, 0);
  const spend = logs.filter(l => l.type === 'masuk' && l.cost > 0).reduce((s, l) => s + Number(l.cost || 0), 0);

  const stTotal = document.getElementById('stTotal');
  if (stTotal) stTotal.textContent = items.length;

  const stAman = document.getElementById('stAman');
  if (stAman) stAman.textContent = items.length - habis - menipis;

  const stMenipis = document.getElementById('stMenipis');
  if (stMenipis) stMenipis.textContent = menipis;

  const stHabis = document.getElementById('stHabis');
  if (stHabis) stHabis.textContent = habis;

  const stMasuk = document.getElementById('stMasuk');
  if (stMasuk) stMasuk.textContent = masuk;

  const stKeluar = document.getElementById('stKeluar');
  if (stKeluar) stKeluar.textContent = keluar;

  const stSpend = document.getElementById('stSpend');
  if (stSpend) stSpend.textContent = rupiah(spend);

  const stListBody = document.getElementById('stListBody');
  if (stListBody) {
    stListBody.innerHTML = items.length
      ? items.map(p => `
          <tr>
            <td>${escapeMenuHTML(p.name)}</td>
            <td>${CAT_LABEL[p.category] || p.category}</td>
            <td>${p.stock}</td>
            <td>${escapeMenuHTML(p.unit)}</td>
            <td>${stockStatusHTML(p.stock)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" class="empty">Belum ada barang</td></tr>`;
  }

  const stMenuBody = document.getElementById('stMenuBody');
  if (stMenuBody) {
    stMenuBody.innerHTML = menu.length
      ? menu.slice().sort((a, b) => a.stock - b.stock).map(p => `
          <tr>
            <td>${escapeMenuHTML(p.code || '-')}</td>
            <td>${escapeMenuHTML(p.name)}</td>
            <td><span class="tag tag-menu">${escapeMenuHTML(p.category)}</span></td>
            <td>${p.stock}</td>
            <td>${stockStatusHTML(p.stock)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" class="empty">Belum ada menu</td></tr>`;
  }

  const stLogBody = document.getElementById('stLogBody');
  if (stLogBody) {
    stLogBody.innerHTML = logs.length
      ? logs.map(l => {
          const it = inv.find(x => x.id === l.itemId);
          return `<tr>
            <td>${new Date(l.date).toLocaleString('id-ID')}</td>
            <td>${it ? escapeMenuHTML(it.name) : '-'}</td>
            <td>${l.type === 'masuk' ? 'Masuk' : 'Keluar'}</td>
            <td>${l.qty}</td>
            <td>${it ? escapeMenuHTML(it.unit) : '-'}</td>
            <td>${l.type === 'masuk' && l.cost > 0 ? rupiah(l.cost) : '-'}</td>
            <td>${escapeMenuHTML(l.note || '-')}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="7" class="empty">Tidak ada pergerakan stok pada rentang ini</td></tr>`;
  }
}
