@extends('layouts.app')

@section('title', 'Laporan - Adem Ayem')
@section('page-title', 'Laporan')

@section('content')
      <div id="reportAnalyticsSection">
      <div class="grid">
        <div class="stat-card"><div class="lbl">Penjualan Hari Ini</div><div class="num" id="repTodaySales">Rp 0</div><div class="delta" id="repTodayDelta">–</div></div>
        <div class="stat-card"><div class="lbl">Jumlah Transaksi</div><div class="num" id="repTodayCount">0</div><div class="delta" id="repCountDelta">–</div></div>
        <div class="stat-card"><div class="lbl">Rata-rata per Struk</div><div class="num" id="repAvgTrx">Rp 0</div><div class="delta" id="repAvgDelta">–</div></div>
        <div class="stat-card"><div class="lbl">Pajak Terkumpul Hari Ini</div><div class="num" id="repTodayTax">Rp 0</div><div class="delta" style="color:var(--muted)">PB1 10%</div></div>
      </div>
      <div class="pos-layout" style="margin-bottom:18px;">
        <div class="panel" style="flex:2;min-width:280px;"><h3>Penjualan 7 Hari Terakhir</h3>
          <div class="bar-chart" id="weeklyBarChart"></div>
        </div>
        <div class="panel" style="flex:1;min-width:240px;"><h3>Metode Pembayaran</h3>
          <div class="donut-wrap">
            <div class="donut" id="paymentDonut"></div>
            <div id="paymentLegend"></div>
          </div>
        </div>
      </div>
      <div class="pos-layout" style="margin-bottom:18px;">
        <div class="panel" style="flex:1;min-width:260px;"><h3>Menu Terlaris Bulan Ini</h3>
          <table><thead><tr><th>Menu</th><th>Porsi</th><th>Omzet</th></tr></thead><tbody id="topMenuBody"></tbody></table>
        </div>
        <div class="panel" style="flex:1;min-width:260px;"><h3>Jam Tersibuk</h3>
          <table><thead><tr><th>Rentang Jam</th><th>Transaksi</th><th>Omzet</th></tr></thead><tbody id="topHoursBody"></tbody></table>
        </div>
      </div>
      </div>
      <div class="panel">
        <div class="filter-row">
          <div class="field"><label>Dari Tanggal</label><input type="date" id="repFrom"></div>
          <div class="field"><label>Sampai Tanggal</label><input type="date" id="repTo"></div>
          <div class="field" style="flex:0 0 auto;"><label>&nbsp;</label><button class="btn btn-outline btn-compact" onclick="renderReport()">Terapkan Filter</button></div>
          <div class="field" style="flex:0 0 auto;"><label>&nbsp;</label><button class="btn btn-primary btn-compact" onclick="window.print()">Unduh / Cetak PDF</button></div>
        </div>
        <div class="grid">
          <div class="stat-card"><div class="num" id="repTotalSales">Rp 0</div><div class="lbl">Total Penjualan</div></div>
          <div class="stat-card"><div class="num" id="repTotalTrx">0</div><div class="lbl">Jumlah Transaksi</div></div>
        </div>
        <h3 class="section-title">Metode Pembayaran</h3>
        <table><thead><tr><th>Metode</th><th>Jumlah Transaksi</th><th>Total</th></tr></thead><tbody id="repPayBody"></tbody></table>
        <h3 class="section-title">Riwayat Transaksi</h3>
        <table><thead><tr><th>Tanggal</th><th>Item</th><th>Bayar</th><th>Total</th></tr></thead><tbody id="repBody"></tbody></table>
      </div>
    

@endsection