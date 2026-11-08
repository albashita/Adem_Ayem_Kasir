@extends('layouts.app')

@section('title', 'Laporan - Adem Ayem')
@section('page-title', 'Laporan')

@section('content')

{{-- URL Endpoint Meta (digunakan oleh laporan.js) --}}
<div id="laporanPage"
     data-data-url="{{ route('laporan.data') }}"
     style="display:none;">
</div>

<style>
  .report-tabs { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
  .report-tab {
    border: 1px solid #d9d9d9; background: #fff; color: var(--muted);
    border-radius: 999px; padding: 9px 26px; font: inherit; font-weight: 600;
    cursor: pointer; transition: background .15s, color .15s, border-color .15s;
  }
  .report-tab:hover { border-color: #2F7D50; color: #2F7D50; }
  .report-tab.active { background: #2F7D50; border-color: #2F7D50; color: #fff; }

  .report-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin: 6px 0 14px; }
  .report-title { font-size: 16px; font-weight: 700; }
  .report-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .report-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .rpt-wrap { overflow-x: auto; }
  table.rpt .tr { text-align: right; }
  table.rpt tfoot td { font-weight: 700; background: #F4F8F5; }
  .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 600; }
  .pill-in { background: #E3F1E8; color: #1F6B3F; }
  .pill-out { background: #FBEBD3; color: #8A4B08; }

  .fin-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .fin-kpi-card {
    background: #fff;
    border-radius: 12px;
    padding: 14px 18px;
    box-shadow: 0 1px 4px rgba(20, 60, 40, .05);
    border: 1px solid #eef2ef;
  }
  .fin-kpi-lbl { font-size: 12.5px; color: #5f6b64; font-weight: 500; }
  .fin-kpi-val { font-size: 21px; font-weight: 700; margin-top: 4px; line-height: 1.2; }
  .fin-kpi-sub { font-size: 11.5px; color: #88968e; margin-top: 3px; }

  .cat-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
  }
  .cat-bahan-baku   { background: #e0f2fe; color: #0369a1; }
  .cat-operasional  { background: #fef3c7; color: #92400e; }
  .cat-gaji         { background: #dcfce7; color: #15803d; }
  .cat-transportasi { background: #f3e8ff; color: #7e22ce; }
  .cat-perawatan    { background: #ffedd5; color: #c2410c; }
  .cat-lain-lain    { background: #f1f5f9; color: #475569; }
</style>

<div id="reportTabs">

  <div class="report-tabs" id="reportTabBar">
    <button type="button" class="report-tab" data-tab="stok" onclick="switchReportTab('stok')">Stock</button>
    <button type="button" class="report-tab active" data-tab="pemasukan" onclick="switchReportTab('pemasukan')">Pemasukan</button>
    <button type="button" class="report-tab" data-tab="pengeluaran" onclick="switchReportTab('pengeluaran')">Pengeluaran</button>
  </div>

  {{-- ===================== TAB STOCK ===================== --}}
  <div id="tab-stok" style="display:none;">
    <div class="panel">
      <div class="filter-row">
        <div class="field">
          <label>Cari</label>
          <input type="search" id="stSearch" placeholder="Cari barang atau keterangan…" oninput="filterStockReport()">
        </div>
        <div class="field">
          <label>Jenis</label>
          <select id="stType" onchange="filterStockReport()">
            <option value="">Semua</option>
            <option value="in">Masuk</option>
            <option value="out">Keluar</option>
          </select>
        </div>
        <div class="field">
          <label>Dari Tanggal</label>
          <input type="date" id="stFrom" onchange="fetchReportData()">
        </div>
        <div class="field">
          <label>Sampai Tanggal</label>
          <input type="date" id="stTo" onchange="fetchReportData()">
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-compact" onclick="fetchReportData()">Terapkan Filter</button>
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-outline btn-compact" onclick="resetReportFilters('stok')">Reset</button>
        </div>
      </div>

      <div class="report-head">
        <div>
          <div class="report-title">Laporan Stock</div>
          <div class="report-sub" id="stPeriod"></div>
        </div>
        <div class="report-actions">
          <button class="btn btn-primary btn-compact" onclick="exportReportPdf('stok')">Cetak PDF</button>
          <button class="btn btn-outline btn-compact" onclick="exportReportExcel('stok')">Unduh Excel</button>
        </div>
      </div>

      <div class="rpt-wrap"><table class="rpt" id="stTable"></table></div>
    </div>
  </div>

  {{-- ===================== TAB PEMASUKAN ===================== --}}
  <div id="tab-pemasukan">
    <div class="panel">
      <div class="filter-row">
        <div class="field">
          <label>Cari</label>
          <input type="search" id="repSearch" placeholder="Cari menu, no. nota, pelanggan…" oninput="filterIncomeReport()">
        </div>
        <div class="field">
          <label>Dari Tanggal</label>
          <input type="date" id="repFrom" onchange="syncDateToPengeluaran('income')">
        </div>
        <div class="field">
          <label>Sampai Tanggal</label>
          <input type="date" id="repTo" onchange="syncDateToPengeluaran('income')">
        </div>
        <div class="field">
          <label>Metode Pembayaran</label>
          <select id="repPaymentMethod" onchange="filterIncomeReport()">
            <option value="">Semua Metode</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
          </select>
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-compact" onclick="fetchReportData()">Terapkan Filter</button>
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-outline btn-compact" onclick="resetReportFilters('pemasukan')">Reset</button>
        </div>
      </div>

      {{-- Ringkasan Laporan Keuangan Terpadu --}}
      <div class="fin-kpi-grid">
        <div class="fin-kpi-card">
          <div class="fin-kpi-lbl">Total Pendapatan</div>
          <div class="fin-kpi-val" id="finSummaryIncome" style="color:#1f5e3a;">Rp 0</div>
          <div class="fin-kpi-sub">Transaksi pesanan lunas</div>
        </div>
        <div class="fin-kpi-card">
          <div class="fin-kpi-lbl">Total Pengeluaran</div>
          <div class="fin-kpi-val" id="finSummaryExpense" style="color:#8a6a12;">Rp 0</div>
          <div class="fin-kpi-sub">Biaya operasional &amp; usaha</div>
        </div>
        <div class="fin-kpi-card" style="border-left:4px solid #1f5e3a;">
          <div class="fin-kpi-lbl">Pendapatan Bersih</div>
          <div class="fin-kpi-val" id="finSummaryNet" style="color:#1f5e3a;">Rp 0</div>
          <div class="fin-kpi-sub">Total Pendapatan - Total Pengeluaran</div>
        </div>
      </div>

      <div class="report-head">
        <div>
          <div class="report-title">Laporan Pemasukan &amp; Transaksi</div>
          <div class="report-sub" id="repPeriod"></div>
        </div>
        <div class="report-actions">
          <button class="btn btn-primary btn-compact" onclick="exportReportPdf('pemasukan')">Cetak PDF</button>
          <button class="btn btn-outline btn-compact" onclick="exportReportExcel('pemasukan')">Unduh Excel</button>
        </div>
      </div>

      <div class="rpt-wrap"><table class="rpt" id="repTable"></table></div>
    </div>
  </div>

  {{-- ===================== TAB PENGELUARAN ===================== --}}
  <div id="tab-pengeluaran" style="display:none;">
    <div class="panel">
      <div class="filter-row">
        <div class="field">
          <label>Cari</label>
          <input type="search" id="spSearch" placeholder="Cari keterangan / kategori…" oninput="filterExpenseReport()">
        </div>
        <div class="field">
          <label>Kategori</label>
          <select id="spCategory" onchange="filterExpenseReport()">
            <option value="">Semua Kategori</option>
            <option value="Bahan Baku">Bahan Baku</option>
            <option value="Operasional">Operasional</option>
            <option value="Gaji">Gaji</option>
            <option value="Transportasi">Transportasi</option>
            <option value="Perawatan">Perawatan</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
        </div>
        <div class="field">
          <label>Dari Tanggal</label>
          <input type="date" id="repSpendFrom" onchange="syncDateToPemasukan('spend')">
        </div>
        <div class="field">
          <label>Sampai Tanggal</label>
          <input type="date" id="repSpendTo" onchange="syncDateToPemasukan('spend')">
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-compact" onclick="fetchReportData()">Terapkan Filter</button>
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-outline btn-compact" onclick="resetReportFilters('pengeluaran')">Reset</button>
        </div>
      </div>

      <div class="fin-kpi-grid" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));">
        <div class="fin-kpi-card">
          <div class="fin-kpi-lbl">Total Pengeluaran Periode Ini</div>
          <div class="fin-kpi-val" id="spTabTotalAmount" style="color:#8a6a12;">Rp 0</div>
          <div class="fin-kpi-sub" id="spTabCount">0 pengeluaran tercatat</div>
        </div>
      </div>

      <div class="report-head">
        <div>
          <div class="report-title">Laporan Pengeluaran Usaha</div>
          <div class="report-sub" id="spPeriod"></div>
        </div>
        <div class="report-actions">
          <button class="btn btn-primary btn-compact" onclick="exportReportPdf('pengeluaran')">Cetak PDF</button>
          <button class="btn btn-outline btn-compact" onclick="exportReportExcel('pengeluaran')">Unduh Excel</button>
        </div>
      </div>

      <div class="rpt-wrap"><table class="rpt" id="spTable"></table></div>
    </div>
  </div>

</div>

{{-- Library Excel (SheetJS) --}}
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

@endsection
