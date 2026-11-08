/**
 * Adem Ayem - Modul Laporan
 * Tiga tab: Stock, Pemasukan, Pengeluaran.
 * Integrasi Keuangan:
 * Pendapatan Bersih = Total Pendapatan - Total Pengeluaran
 * Data diambil langsung dari backend Laravel /laporan/data
 */

// ===================== HELPER UMUM =====================

function localDateStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtDay(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function periodText(from, to) {
  return `Periode ${from ? fmtDay(from) : 'awal'} – ${to ? fmtDay(to) : 'sekarang'}`;
}

function normalizePaymentName(value) {
  const p = String(value || '').toLowerCase().trim();
  if (['cash', 'tunai', 'uang tunai'].includes(p)) return 'cash';
  if (['qris', 'qr'].includes(p)) return 'qris';
  if (['transfer', 'transfer bank'].includes(p)) return 'transfer';
  return p;
}

function payLabel(m) {
  const norm = normalizePaymentName(m);
  const labels = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer Bank' };
  return labels[norm] || m || '-';
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

// ===================== STATE DATA LAPORAN =====================

let reportBackendData = {
  total_pendapatan: 0,
  total_pengeluaran: 0,
  pendapatan_bersih: 0,
  orders: [],
  expenses: [],
  stock_movements: []
};

const REPORT_TABS = ['stok', 'pemasukan', 'pengeluaran'];
const reportExport = {};

const ROLE_TABS = {
  superadmin:    ['stok', 'pemasukan', 'pengeluaran'],
  administrator: ['stok', 'pemasukan', 'pengeluaran'],
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
  return ROLE_TABS[reportRole()] || ['pemasukan'];
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
  const bar = document.getElementById('reportTabBar');
  if (bar) bar.style.display = allowed.length > 1 ? '' : 'none';
  REPORT_TABS.forEach(t => {
    if (!allowed.includes(t)) {
      const panel = document.getElementById('tab-' + t);
      if (panel) panel.remove();
    }
  });
}

// Sinkronisasi tanggal dari tab pemasukan ke pengeluaran dan sebaliknya
function syncDateToPengeluaran() {
  const f = document.getElementById('repFrom')?.value;
  const t = document.getElementById('repTo')?.value;
  const sf = document.getElementById('repSpendFrom');
  const st = document.getElementById('repSpendTo');
  if (sf && f) sf.value = f;
  if (st && t) st.value = t;
  fetchReportData();
}

function syncDateToPemasukan() {
  const sf = document.getElementById('repSpendFrom')?.value;
  const st = document.getElementById('repSpendTo')?.value;
  const f = document.getElementById('repFrom');
  const t = document.getElementById('repTo');
  if (f && sf) f.value = sf;
  if (t && st) t.value = st;
  fetchReportData();
}

// ===================== FETCH DATA BACKEND =====================

async function fetchReportData() {
  const page = document.getElementById('laporanPage');
  const urlBase = page?.dataset.dataUrl || '/laporan/data';

  // Ambil tanggal filter aktif
  const from = document.getElementById('repFrom')?.value || document.getElementById('repSpendFrom')?.value || '';
  const to = document.getElementById('repTo')?.value || document.getElementById('repSpendTo')?.value || '';

  const url = new URL(urlBase, window.location.origin);
  if (from) url.searchParams.set('from', from);
  if (to)   url.searchParams.set('to', to);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!res.ok) throw new Error('Gagal memuat data laporan.');
    reportBackendData = await res.json();

    updateFinancialSummary();
    filterIncomeReport();
    filterExpenseReport();
    filterStockReport();

  } catch (err) {
    console.error('Error fetchReportData:', err);
  }
}

function updateFinancialSummary() {
  const inc = Number(reportBackendData.total_pendapatan || 0);
  const exp = Number(reportBackendData.total_pengeluaran || 0);
  const net = inc - exp;

  setText('finSummaryIncome', rupiah(inc));
  setText('finSummaryExpense', rupiah(exp));

  const netEl = document.getElementById('finSummaryNet');
  if (netEl) {
    netEl.textContent = rupiah(net);
    netEl.style.color = net >= 0 ? '#1f5e3a' : '#dc2626';
  }

  setText('spTabTotalAmount', rupiah(exp));
  setText('spTabCount', `${(reportBackendData.expenses || []).length} pengeluaran tercatat`);
}

// ===================== TAB PEMASUKAN =====================

function filterIncomeReport() {
  const from = document.getElementById('repFrom')?.value || '';
  const to   = document.getElementById('repTo')?.value || '';
  const method = (document.getElementById('repPaymentMethod')?.value || '').toLowerCase();
  const q    = searchQuery('repSearch');

  const orders = (reportBackendData.orders || []).filter(o => {
    if (method && normalizePaymentName(o.payment) !== method) return false;
    if (q) {
      const itemsStr = (o.items || []).map(i => i.name).join(' ').toLowerCase();
      const invoice = String(o.invoice_number || '').toLowerCase();
      const customer = String(o.customer_name || '').toLowerCase();
      if (!itemsStr.includes(q) && !invoice.includes(q) && !customer.includes(q)) return false;
    }
    return true;
  });

  const totalFiltered = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const cols = [
    { h: 'No.', width: '50px' },
    { h: 'Tanggal' },
    { h: 'No. Nota' },
    { h: 'Pelanggan' },
    { h: 'Item Pesanan' },
    { h: 'Metode' },
    { h: 'Total', type: 'money', right: true }
  ];

  const rows = orders.map((o, idx) => [
    idx + 1,
    o.formatted_date || (o.date ? o.date.slice(0, 16) : '-'),
    o.invoice_number || '-',
    o.customer_name || '-',
    (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ') || '-',
    payLabel(o.payment),
    Number(o.total || 0)
  ]);

  const methodName = method ? payLabel(method) : 'Semua metode';
  const sub = `${periodText(from, to)} · ${methodName} · ${orders.length} transaksi pesanan lunas${searchNote(q)}`;
  const footLabel = `Total Pemasukan (${orders.length} transaksi)`;
  const empty = 'Tidak ada transaksi lunas pada periode ini.';

  setText('repPeriod', sub);
  renderGenericTable('repTable', cols, rows, empty, {
    label: footLabel, labelSpan: 6, value: rupiah(totalFiltered), valueSpan: 1, valueRight: true
  });

  reportExport.pemasukan = {
    title: 'Laporan Pemasukan (Pesanan Lunas)',
    subtitle: sub,
    summary: [
      { label: 'Total Pendapatan', value: reportBackendData.total_pendapatan, money: true },
      { label: 'Total Pengeluaran', value: reportBackendData.total_pengeluaran, money: true },
      { label: 'Pendapatan Bersih', value: reportBackendData.pendapatan_bersih, money: true },
      { label: 'Jumlah Transaksi Terfilter', value: orders.length }
    ],
    tables: [{
      title: 'Daftar Transaksi Lunas',
      cols,
      rows,
      empty,
      foot: [footLabel, '', '', '', '', '', totalFiltered]
    }]
  };
}

// ===================== TAB PENGELUARAN =====================

function filterExpenseReport() {
  const from = document.getElementById('repSpendFrom')?.value || '';
  const to   = document.getElementById('repSpendTo')?.value || '';
  const cat  = document.getElementById('spCategory')?.value || '';
  const q    = searchQuery('spSearch');

  const expenses = (reportBackendData.expenses || []).filter(e => {
    if (cat && e.category !== cat) return false;
    if (q) {
      const desc = String(e.description || '').toLowerCase();
      const c = String(e.category || '').toLowerCase();
      if (!desc.includes(q) && !c.includes(q)) return false;
    }
    return true;
  });

  const totalFiltered = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const cols = [
    { h: 'No.', width: '50px' },
    { h: 'Tanggal' },
    { h: 'Kategori Pengeluaran' },
    { h: 'Keterangan' },
    { h: 'Jumlah Pengeluaran', type: 'money', right: true }
  ];

  const rows = expenses.map((e, idx) => [
    idx + 1,
    e.formatted_date || e.expense_date,
    e.category,
    e.description || '-',
    Number(e.amount || 0)
  ]);

  const catName = cat || 'Semua kategori';
  const sub = `${periodText(from, to)} · ${catName} · ${expenses.length} pengeluaran${searchNote(q)}`;
  const footLabel = `Total Pengeluaran (${expenses.length} catatan)`;
  const empty = 'Belum ada data pengeluaran pada rentang ini.';

  setText('spPeriod', sub);
  renderGenericTable('spTable', cols, rows, empty, {
    label: footLabel, labelSpan: 4, value: rupiah(totalFiltered), valueSpan: 1, valueRight: true
  });

  reportExport.pengeluaran = {
    title: 'Laporan Pengeluaran Usaha',
    subtitle: sub,
    summary: [
      { label: 'Total Pengeluaran', value: totalFiltered, money: true },
      { label: 'Jumlah Pengeluaran', value: expenses.length }
    ],
    tables: [{
      title: 'Catatan Pengeluaran',
      cols,
      rows,
      empty,
      foot: [footLabel, '', '', '', totalFiltered]
    }]
  };
}

// ===================== TAB STOCK =====================

function filterStockReport() {
  const from = document.getElementById('stFrom')?.value || '';
  const to   = document.getElementById('stTo')?.value || '';
  const type = document.getElementById('stType')?.value || '';
  const q    = searchQuery('stSearch');

  const moves = (reportBackendData.stock_movements || []).filter(m => {
    if (type && m.type !== type) return false;
    if (q) {
      const name = String(m.item_name || '').toLowerCase();
      const note = String(m.note || '').toLowerCase();
      if (!name.includes(q) && !note.includes(q)) return false;
    }
    return true;
  });

  const masuk = moves.filter(m => m.type === 'in').length;
  const keluar = moves.filter(m => m.type === 'out').length;

  const cols = [
    { h: 'Tanggal' },
    { h: 'Nama Barang' },
    { h: 'Satuan' },
    { h: 'Jenis', type: 'jenis' },
    { h: 'Jumlah', right: true },
    { h: 'Keterangan' },
    { h: 'Petugas' }
  ];

  const rows = moves.map(m => [
    m.date ? m.date.slice(0, 16).replace('T', ' ') : '-',
    m.item_name || '-',
    m.unit || '-',
    m.type === 'in' ? 'Masuk' : 'Keluar',
    m.qty,
    m.note || '-',
    m.user_name || '-'
  ]);

  const typeName = type ? (type === 'in' ? 'Masuk' : 'Keluar') : 'Masuk & keluar';
  const sub = `${periodText(from, to)} · ${typeName} · ${moves.length} catatan${searchNote(q)}`;
  const footValue = `${masuk} pergerakan masuk · ${keluar} pergerakan keluar`;
  const empty = 'Tidak ada pergerakan stok pada periode ini.';

  setText('stPeriod', sub);
  renderGenericTable('stTable', cols, rows, empty, {
    label: 'Total', labelSpan: 4, value: footValue, valueSpan: 3
  });

  reportExport.stok = {
    title: 'Laporan Stok & Pergerakan Barang',
    subtitle: sub,
    summary: [
      { label: 'Barang Masuk (kali)', value: masuk },
      { label: 'Barang Keluar (kali)', value: keluar }
    ],
    tables: [{
      title: 'Pergerakan Stok',
      cols,
      rows,
      empty,
      foot: ['Total', '', '', '', footValue, '', '']
    }]
  };
}

// ===================== TABLE RENDERER GENERIK =====================

function fmtCellValue(col, v) {
  if (v === null || v === undefined || v === '') return '-';
  if (col.type === 'money') return rupiah(v);
  return v;
}

function cellContentHTML(col, v) {
  if (col.type === 'jenis') {
    const isOut = String(v).toLowerCase() === 'keluar';
    return `<span class="pill ${isOut ? 'pill-out' : 'pill-in'}">${isOut ? 'Keluar' : 'Masuk'}</span>`;
  }
  return escapeMenuHTML(String(fmtCellValue(col, v)));
}

function renderGenericTable(tableId, cols, rows, emptyMsg, foot) {
  const el = document.getElementById(tableId);
  if (!el) return;

  const thead = `<thead><tr>${cols.map(c => `<th${c.right ? ' class="tr"' : ''}${c.width ? ` style="width:${c.width};"` : ''}>${escapeMenuHTML(c.h)}</th>`).join('')}</tr></thead>`;

  const tbody = rows.length
    ? rows.map(r => `<tr>${cols.map((c, i) => `<td${c.right ? ' class="tr"' : ''}>${cellContentHTML(c, r[i])}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cols.length}" class="empty">${escapeMenuHTML(emptyMsg)}</td></tr>`;

  const tfoot = foot
    ? `<tfoot><tr><td colspan="${foot.labelSpan}">${escapeMenuHTML(foot.label)}</td><td colspan="${foot.valueSpan}"${foot.valueRight ? ' class="tr"' : ''}>${escapeMenuHTML(foot.value)}</td></tr></tfoot>`
    : '';

  el.innerHTML = thead + `<tbody>${tbody}</tbody>` + tfoot;
}

// ===================== RESET FILTER =====================

function resetReportFilters(tab) {
  const today = localDateStr();
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

  if (tab === 'stok') {
    setVal('stSearch', ''); setVal('stType', ''); setVal('stFrom', today); setVal('stTo', today);
  } else if (tab === 'pemasukan') {
    setVal('repSearch', ''); setVal('repFrom', today); setVal('repTo', today); setVal('repPaymentMethod', '');
    setVal('repSpendFrom', today); setVal('repSpendTo', today);
  } else if (tab === 'pengeluaran') {
    setVal('spSearch', ''); setVal('spCategory', ''); setVal('repSpendFrom', today); setVal('repSpendTo', today);
    setVal('repFrom', today); setVal('repTo', today);
  }

  fetchReportData();
}

// ===================== EXPORT PDF =====================

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
        ? t.rows.map(r => `<tr>${t.cols.map((c, i) => `<td${c.right ? ' class="r"' : ''}>${esc(fmtCellValue(c, r[i]))}</td>`).join('')}</tr>`).join('')
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
  h1 { margin: 0 0 2px; font-size: 20px; color: #1f5e3a; }
  .sub { color: #666; margin-bottom: 4px; }
  .printed { color: #999; font-size: 11px; margin-bottom: 16px; }
  .sums { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
  .s { border: 1px solid #ccc; border-radius: 6px; padding: 8px 14px; min-width: 130px; }
  .s b { display: block; font-size: 16px; color: #1f5e3a; }
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

  const today = localDateStr();
  ['repFrom', 'repTo', 'repSpendFrom', 'repSpendTo', 'stFrom', 'stTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
  ['repPaymentMethod', 'stType', 'stSearch', 'repSearch', 'spSearch', 'spCategory'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const first = allowedTabs().includes('pemasukan') ? 'pemasukan' : allowedTabs()[0];
  applyRoleTabs();
  switchReportTab(first);
  fetchReportData();
}

// Expose fungsi ke window
window.switchReportTab = switchReportTab;
window.fetchReportData = fetchReportData;
window.filterIncomeReport = filterIncomeReport;
window.filterExpenseReport = filterExpenseReport;
window.filterStockReport = filterStockReport;
window.resetReportFilters = resetReportFilters;
window.exportReportPdf = exportReportPdf;
window.exportReportExcel = exportReportExcel;
window.syncDateToPengeluaran = syncDateToPengeluaran;
window.syncDateToPemasukan = syncDateToPemasukan;
window.initReportPage = initReportPage;
