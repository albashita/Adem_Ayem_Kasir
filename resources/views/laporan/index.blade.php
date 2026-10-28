@extends('layouts.app')

@section('title', 'Laporan - Adem Ayem')
@section('page-title', 'Laporan')

@section('content')

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
          <input type="search" id="stSearch" placeholder="Cari barang atau keterangan…" oninput="renderStockReport()">
        </div>
        <div class="field">
          <label>Kategori</label>
          <select id="stCat" onchange="renderStockReport()">
            <option value="">Semua</option>
            <option value="makanan">Makanan</option>
            <option value="minuman">Minuman</option>
            <option value="gudang">Gudang</option>
          </select>
        </div>
        <div class="field">
          <label>Jenis</label>
          <select id="stType" onchange="renderStockReport()">
            <option value="">Semua</option>
            <option value="masuk">Masuk</option>
            <option value="keluar">Keluar</option>
          </select>
        </div>
        <div class="field">
          <label>Dari Tanggal</label>
          <input type="date" id="stFrom" onchange="renderStockReport()">
        </div>
        <div class="field">
          <label>Sampai Tanggal</label>
          <input type="date" id="stTo" onchange="renderStockReport()">
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-compact" onclick="renderStockReport()">Terapkan Filter</button>
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
          <input type="search" id="repSearch" placeholder="Cari menu / item…" oninput="renderReport()">
        </div>
        <div class="field">
          <label>Dari Tanggal</label>
          <input type="date" id="repFrom" onchange="renderReport()">
        </div>
        <div class="field">
          <label>Sampai Tanggal</label>
          <input type="date" id="repTo" onchange="renderReport()">
        </div>
        <div class="field">
          <label>Metode Pembayaran</label>
          <select id="repPaymentMethod" onchange="renderReport()">
            <option value="">Semua Metode</option>
            <option value="tunai">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
          </select>
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-compact" onclick="renderReport()">Terapkan Filter</button>
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-outline btn-compact" onclick="resetReportFilters('pemasukan')">Reset</button>
        </div>
      </div>

      <div class="report-head">
        <div>
          <div class="report-title">Laporan Pemasukan</div>
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
          <input type="search" id="spSearch" placeholder="Cari barang…" oninput="renderExpenseReport()">
        </div>
        <div class="field">
          <label>Dari Tanggal</label>
          <input type="date" id="repSpendFrom" onchange="renderExpenseReport()">
        </div>
        <div class="field">
          <label>Sampai Tanggal</label>
          <input type="date" id="repSpendTo" onchange="renderExpenseReport()">
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-compact" onclick="renderExpenseReport()">Terapkan Filter</button>
        </div>
        <div class="field" style="flex:0 0 auto;">
          <label>&nbsp;</label>
          <button class="btn btn-outline btn-compact" onclick="resetReportFilters('pengeluaran')">Reset</button>
        </div>
      </div>

      <div class="report-head">
        <div>
          <div class="report-title">Laporan Pengeluaran</div>
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