/**
 * Adem Ayem - Modul Laporan
 * Tiga tab: Stock, Pemasukan, Pengeluaran.
 * Tiap tab: filter -> satu tabel + baris total -> Cetak PDF / Unduh Excel.
 */

// ===================== HELPER UMUM =====================

// Tanggal lokal (YYYY-MM-DD), bukan UTC, supaya "hari ini" benar di WIB
function localDateStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Tanggal lokal (YYYY-MM-DD) dari nilai tanggal apa pun (ISO UTC, timestamp, dsb.)
function dayOf(value) {
  const d = new Date(value);
  return isNaN(d) ? String(value || '').slice(0, 10) : localDateStr(d);
}

// Tampilan tanggal: 28/10/2026 07.30
function fmtDateTime(value) {
  const d = new Date(value);
  if (isNaN(d)) return '-';
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}.${p(d.getMinutes())}`;
}

// 2026-10-28 -> 28/10/2026
function fmtDay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function periodText(from, to) {
  return `Periode ${from ? fmtDay(from) : 'awal'} – ${to ? fmtDay(to) : 'sekarang'}`;
}

// Normalisasi penamaan metode pembayaran
function normalizePaymentName(value) {
  const p = String(value || '').toLowerCase().trim();
  if (['tunai', 'cash', 'uang tunai'].includes(p)) return 'tunai';
  if (['qris', 'qr'].includes(p)) return 'qris';
  if (['transfer', 'transfer bank'].includes(p)) return 'transfer';
  return p;
}

function payLabel(m) {
  return (typeof PAY_LABELS !== 'undefined' && PAY_LABELS[m]) ||
    ({ tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer Bank' })[m] || m || '-';
}

function catLabel(c) {
  if (typeof CAT_LABEL !== 'undefined' && CAT_LABEL[c]) return CAT_LABEL[c];
  const s = String(c || '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '-';
}

function searchQuery(id) {
  return (document.getElementById(id)?.value || '').trim().toLowerCase();
}

function searchNote(q) {
  return q ? ` · Cari "${q}"` : '';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ===================== TABEL GENERIK =====================
// cols: [{ h: 'Judul', type?: 'money' | 'jenis', right?: true }]

function fmtCell(col, v) {
  if (v === null || v === undefined || v === '') return '-';
  if (col.type === 'money') return rupiah(v);
  return v;
}

function cellHTML(col, v) {
  if (col.type === 'jenis') {
    const out = String(v).toLowerCase() === 'keluar';
    return `<span class="pill ${out ? 'pill-out' : 'pill-in'}">${out ? 'Keluar' : 'Masuk'}</span>`;
  }
  return escapeMenuHTML(String(fmtCell(col, v)));
}

// foot: { label, labelSpan, value, valueSpan, valueRight } -> satu baris total di bawah tabel
function renderReportTable(tableId, cols, rows, emptyMsg, foot) {
  const el = document.getElementById(tableId);
  if (!el) return;

  const head = `<thead><tr>${cols.map(c => `<th${c.right ? ' class="tr"' : ''}>${escapeMenuHTML(c.h)}</th>`).join('')}</tr></thead>`;

  const body = rows.length
    ? rows.map(r => `<tr>${cols.map((c, i) => `<td${c.right ? ' class="tr"' : ''}>${cellHTML(c, r[i])}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cols.length}" class="empty">${escapeMenuHTML(emptyMsg)}</td></tr>`;

  const tfoot = foot
    ? `<tfoot><tr><td colspan="${foot.labelSpan}">${escapeMenuHTML(foot.label)}</td><td colspan="${foot.valueSpan}"${foot.valueRight ? ' class="tr"' : ''}>${escapeMenuHTML(foot.value)}</td></tr></tfoot>`
    : '';

  el.innerHTML = head + `<tbody>${body}</tbody>` + tfoot;
}

// ===================== TAB & ROLE =====================

const REPORT_TABS = ['stok', 'pemasukan', 'pengeluaran'];

// Data terakhir yang dirender per tab, dipakai untuk export PDF / Excel
const reportExport = {};

// Tab yang boleh dilihat tiap role (sesuai analisis kebutuhan)
const ROLE_TABS = {
  superadmin:    ['stok', 'pemasukan', 'pengeluaran'],
  administrator: ['stok'],
  kasir:         ['pemasukan']
};

function reportRole() {
  let r = '';
  try { r = (typeof currentUser === 'function' && currentUser() && currentUser().role) || ''; } catch (e) {}
  r = String(r).toLowerCase();
  if (r === 'owner') return 'superadmin';
  if (r === 'admin') return 'administrator';
  return ROLE_TABS[r] ? r : 'superadmin';
}

function allowedTabs() {
  return ROLE_TABS[reportRole()];
}

function switchReportTab(name) {
  if (!allowedTabs().includes(name)) name = allowedTabs()[0];
  REPORT_TABS.forEach(t => {
    const panel = document.getElementById('tab-' + t);
    if (panel) panel.style.display = t === name ? '' : 'none';
  });
  document.querySelectorAll('.report-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
}

function applyRoleTabs() {
  const allowed = allowedTabs();
  document.querySelectorAll('.report-tab').forEach(btn => {
    btn.style.display = allowed.includes(btn.dataset.tab) ? '' : 'none';
  });
  // Kalau hanya ada satu tab, bar tab tidak perlu ditampilkan
  const bar = document.getElementById('reportTabBar');
  if (bar) bar.style.display = allowed.length > 1 ? '' : 'none';
  REPORT_TABS.forEach(t => {
    if (!allowed.includes(t)) {
      const panel = document.getElementById('tab-' + t);
      if (panel) panel.remove();
    }
  });
}

function renderAllReports() {
  if (document.getElementById('tab-stok')) renderStockReport();
  if (document.getElementById('tab-pemasukan')) renderReport();
  if (document.getElementById('tab-pengeluaran')) renderExpenseReport();
}

// Kembalikan filter ke default: tanggal = hari ini, metode / kategori / jenis = semua
function resetReportFilters(tab) {
  const today = localDateStr();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  if (tab === 'stok') {
    set('stSearch', ''); set('stCat', ''); set('stType', ''); set('stFrom', today); set('stTo', today);
    renderStockReport();
  } else if (tab === 'pemasukan') {
    set('repSearch', ''); set('repFrom', today); set('repTo', today); set('repPaymentMethod', '');
    renderReport();
  } else if (tab === 'pengeluaran') {
    set('spSearch', ''); set('repSpendFrom', today); set('repSpendTo', today);
    renderExpenseReport();
  }
}

// ===================== TAB STOCK =====================

function renderStockReport() {
  const inv = getInv();
  const cat = document.getElementById('stCat')?.value || '';
  const type = document.getElementById('stType')?.value || '';
  const from = document.getElementById('stFrom')?.value || '';
  const to = document.getElementById('stTo')?.value || '';
  const q = searchQuery('stSearch');

  const logs = getLog()
    .filter(l => {
      const d = dayOf(l.date);
      if ((from && d < from) || (to && d > to)) return false;
      if (type && l.type !== type) return false;
      if (cat) {
        const it = inv.find(x => x.id === l.itemId);
        if (!it || it.category !== cat) return false;
      }
      if (q) {
        const it = inv.find(x => x.id === l.itemId);
        const hay = `${it ? it.name : ''} ${l.note || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const masuk = logs.filter(l => l.type === 'masuk').length;
  const keluar = logs.filter(l => l.type === 'keluar').length;

  const cols = [
    { h: 'Tanggal' }, { h: 'Nama Barang' }, { h: 'Kategori' }, { h: 'Jenis', type: 'jenis' },
    { h: 'Jumlah', right: true }, { h: 'Satuan' }, { h: 'Keterangan' }
  ];
  const rows = logs.map(l => {
    const it = inv.find(x => x.id === l.itemId);
    return [
      fmtDateTime(l.date),
      it ? it.name : '-',
      it ? catLabel(it.category) : '-',
      l.type === 'masuk' ? 'Masuk' : 'Keluar',
      l.qty,
      it ? it.unit : '-',
      l.note || '-'
    ];
  });

  const catName = cat ? catLabel(cat) : 'Semua kategori';
  const typeName = type ? (type === 'masuk' ? 'Masuk' : 'Keluar') : 'Masuk & keluar';
  const sub = `${periodText(from, to)} · ${catName} · ${typeName} · ${logs.length} catatan${searchNote(q)}`;
  const footValue = `${masuk} barang masuk · ${keluar} barang keluar`;
  const empty = 'Tidak ada pergerakan stok pada rentang ini';

  setText('stPeriod', sub);
  renderReportTable('stTable', cols, rows, empty, { label: 'Total', labelSpan: 3, value: footValue, valueSpan: 4 });

  reportExport.stok = {
    title: 'Laporan Stock',
    subtitle: sub,
    summary: [
      { label: 'Barang Masuk (catatan)', value: masuk },
      { label: 'Barang Keluar (catatan)', value: keluar }
    ],
    tables: [{
      title: 'Pergerakan Stok', cols, rows, empty,
      foot: ['Total', '', '', footValue, '', '', '']
    }]
  };
}

// ===================== TAB PEMASUKAN =====================

function renderReport() {
  const from = document.getElementById('repFrom')?.value || '';
  const to = document.getElementById('repTo')?.value || '';
  const method = (document.getElementById('repPaymentMethod')?.value || '').toLowerCase();
  const q = searchQuery('repSearch');

  const trx = getTrx()
    .filter(t => {
      const d = dayOf(t.date);
      const payment = normalizePaymentName(t.payment);
      const itemText = (t.items || []).map(i => i.name).join(' ').toLowerCase();
      return (!from || d >= from) && (!to || d <= to) && (!method || payment === method) &&
             (!q || itemText.includes(q));
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const sales = trx.reduce((sum, t) => sum + Number(t.total || 0), 0);

  const cols = [{ h: 'Tanggal' }, { h: 'Item' }, { h: 'Metode Bayar' }, { h: 'Total', type: 'money', right: true }];
  const rows = trx.map(t => [
    fmtDateTime(t.date),
    (t.items || []).map(i => `${i.name} x${i.qty}`).join(', '),
    payLabel(normalizePaymentName(t.payment)),
    Number(t.total || 0)
  ]);

  const methodName = method ? payLabel(method) : 'Semua metode';
  const sub = `${periodText(from, to)} · ${methodName} · ${trx.length} transaksi${searchNote(q)}`;
  const footLabel = `Total Pemasukan (${trx.length} transaksi)`;
  const empty = 'Tidak ada transaksi pada rentang ini';

  setText('repPeriod', sub);
  renderReportTable('repTable', cols, rows, empty, {
    label: footLabel, labelSpan: 3, value: rupiah(sales), valueSpan: 1, valueRight: true
  });

  reportExport.pemasukan = {
    title: 'Laporan Pemasukan',
    subtitle: sub,
    summary: [
      { label: 'Total Penjualan', value: sales, money: true },
      { label: 'Jumlah Transaksi', value: trx.length }
    ],
    tables: [{
      title: 'Riwayat Transaksi', cols, rows, empty,
      foot: [footLabel, '', '', sales]
    }]
  };
}

// ===================== TAB PENGELUARAN =====================

function renderExpenseReport() {
  const from = document.getElementById('repSpendFrom')?.value || '';
  const to = document.getElementById('repSpendTo')?.value || '';
  const q = searchQuery('spSearch');

  const inv = getInv();
  const buys = getLog()
    .filter(l => {
      const d = dayOf(l.date);
      return l.type === 'masuk' &&
             Number(l.cost) > 0 &&
             (!from || d >= from) &&
             (!to || d <= to) &&
             (!q || String((inv.find(x => x.id === l.itemId) || {}).name || '').toLowerCase().includes(q));
    })
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const spend = buys.reduce((sum, l) => sum + Number(l.cost || 0), 0);

  const cols = [
    { h: 'Tanggal' }, { h: 'Barang' }, { h: 'Jumlah', right: true },
    { h: 'Satuan' }, { h: 'Harga', type: 'money', right: true }
  ];
  const rows = buys.map(l => {
    const it = inv.find(x => x.id === l.itemId);
    return [fmtDateTime(l.date), it ? it.name : '-', l.qty, it ? it.unit : '-', Number(l.cost || 0)];
  });

  const sub = `${periodText(from, to)} · Pembelian stok · ${buys.length} pembelian${searchNote(q)}`;
  const footLabel = `Total Pengeluaran (${buys.length} pembelian)`;
  const empty = 'Belum ada pembelian stok pada rentang ini';

  setText('spPeriod', sub);
  renderReportTable('spTable', cols, rows, empty, {
    label: footLabel, labelSpan: 4, value: rupiah(spend), valueSpan: 1, valueRight: true
  });

  reportExport.pengeluaran = {
    title: 'Laporan Pengeluaran (Pembelian Stok)',
    subtitle: sub,
    summary: [
      { label: 'Total Pengeluaran', value: spend, money: true },
      { label: 'Jumlah Pembelian', value: buys.length }
    ],
    tables: [{
      title: 'Pembelian Stok', cols, rows, empty,
      foot: [footLabel, '', '', '', spend]
    }]
  };
}

// ===================== EXPORT PDF =====================
// Membuka jendela cetak berisi hanya laporan tab yang aktif,
// lalu pilih "Simpan sebagai PDF" di dialog cetak.

function exportReportPdf(tab) {
  const d = reportExport[tab];
  if (!d) return;
  const esc = s => escapeMenuHTML(String(s));

  const summary = d.summary.map(s =>
    `<div class="s"><b>${esc(s.money ? rupiah(s.value) : s.value)}</b><span>${esc(s.label)}</span></div>`
  ).join('');

  const tables = d.tables.map(t => {
    const foot = t.foot
      ? `<tfoot><tr>${t.cols.map((c, i) => {
          const v = t.foot[i];
          const txt = v === '' || v === null || v === undefined ? '' : (c.type === 'money' && typeof v === 'number' ? rupiah(v) : v);
          return `<td${c.right ? ' class="r"' : ''}>${esc(txt)}</td>`;
        }).join('')}</tr></tfoot>`
      : '';
    return `
    <table>
      <thead><tr>${t.cols.map(c => `<th${c.right ? ' class="r"' : ''}>${esc(c.h)}</th>`).join('')}</tr></thead>
      <tbody>${t.rows.length
        ? t.rows.map(r => `<tr>${t.cols.map((c, i) => `<td${c.right ? ' class="r"' : ''}>${esc(fmtCell(c, r[i]))}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${t.cols.length}" class="empty">${esc(t.empty)}</td></tr>`}</tbody>
      ${foot}
    </table>`;
  }).join('');

  const w = window.open('', '_blank');
  if (!w) {
    alert('Popup diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.');
    return;
  }

  w.document.write(`<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>${esc(d.title)} - Adem Ayem</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 24px; font-size: 12px; }
  h1 { margin: 0 0 2px; font-size: 20px; }
  .sub { color: #666; margin-bottom: 4px; }
  .printed { color: #999; font-size: 11px; margin-bottom: 16px; }
  .sums { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
  .s { border: 1px solid #ccc; border-radius: 6px; padding: 8px 14px; min-width: 130px; }
  .s b { display: block; font-size: 16px; }
  .s span { color: #666; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
  th { background: #f0f0f0; }
  tfoot td { font-weight: bold; background: #f7f7f7; }
  .r { text-align: right; }
  .empty { text-align: center; color: #888; }
  tr { page-break-inside: avoid; }
</style></head><body>
<h1>Adem Ayem - ${esc(d.title)}</h1>
<div class="sub">${esc(d.subtitle)}</div>
<div class="printed">Dicetak: ${esc(new Date().toLocaleString('id-ID'))}</div>
<div class="sums">${summary}</div>
${tables}
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

// ===================== EXPORT EXCEL =====================
// Butuh library SheetJS (dimuat lewat <script> di index.blade.php).

function exportReportExcel(tab) {
  const d = reportExport[tab];
  if (!d) return;
  if (typeof XLSX === 'undefined') {
    alert('Library Excel belum termuat. Cek koneksi internet lalu coba lagi.');
    return;
  }

  const wb = XLSX.utils.book_new();

  const sumRows = [
    ['Adem Ayem - ' + d.title],
    [d.subtitle],
    ['Dicetak: ' + new Date().toLocaleString('id-ID')],
    [],
    ...d.summary.map(s => [s.label, s.value])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumRows), 'Ringkasan');

  d.tables.forEach(t => {
    const aoa = [
      t.cols.map(c => c.h),
      ...t.rows.map(r => t.cols.map((c, i) => {
        const v = r[i];
        if (c.type === 'money') return v === null || v === undefined || v === '' ? '' : Number(v);
        return v === null || v === undefined ? '' : v;
      }))
    ];
    if (t.foot) aoa.push(t.foot);
    const name = t.title.replace(/[\\\/?*\[\]:]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
  });

  XLSX.writeFile(wb, `laporan-${tab}-${localDateStr()}.xlsx`);
}

// ===================== INISIALISASI =====================

function initReportPage() {
  if (!document.getElementById('reportTabs')) return;

  // Default: tanggal = hari ini, metode pembayaran / kategori / jenis = semua
  const today = localDateStr();
  ['repFrom', 'repTo', 'repSpendFrom', 'repSpendTo', 'stFrom', 'stTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
  ['repPaymentMethod', 'stCat', 'stType', 'stSearch', 'repSearch', 'spSearch'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const first = allowedTabs().includes('pemasukan') ? 'pemasukan' : allowedTabs()[0];
  applyRoleTabs();
  switchReportTab(first);
  renderAllReports();
}

// initReportPage() dipanggil dari bootstrapPage() di core.js