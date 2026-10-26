@extends('layouts.app')

@section('title', 'Riwayat Transaksi - Adem Ayem')
@section('page-title', 'Riwayat Transaksi')

@section('content')
<div class="panel" id="riwayatPage"
     data-list-url="{{ route('riwayat.data') }}"
     data-pay-url="{{ url('/riwayat') }}">
  <h3>Riwayat Transaksi</h3>

  <div class="cat-tabs" id="histTabs">
    <button class="cat-tab active" data-f="semua" onclick="setHistFilter('semua')">Semua</button>
    <button class="cat-tab" data-f="belum" onclick="setHistFilter('belum')">Belum Bayar</button>
    <button class="cat-tab" data-f="sudah" onclick="setHistFilter('sudah')">Sudah Bayar</button>
  </div>

  <div class="form-row" style="margin:12px 0;gap:8px;flex-wrap:wrap;align-items:center;">
    <input id="fSearch" type="text" placeholder="Cari invoice / pelanggan..." style="flex:2;min-width:180px;" oninput="renderHistory()">
    <select id="fTipe" onchange="renderHistory()" style="flex:1;min-width:140px;">
      <option value="">Semua Tipe</option>
      <option value="dinein">Makan di Tempat</option>
      <option value="takeaway">Bawa Pulang</option>
    </select>
    <input id="fFrom" type="date" onchange="renderHistory()" style="flex:1;min-width:130px;" title="Dari tanggal">
    <input id="fTo" type="date" onchange="renderHistory()" style="flex:1;min-width:130px;" title="Sampai tanggal">
    <button class="btn btn-outline" onclick="resetHistFilter()">Reset</button>
  </div>

  <div style="overflow-x:auto;">
    <table>
      <thead>
        <tr><th>Waktu</th><th>No. Invoice</th><th>Pelanggan</th><th>Tipe</th><th>Total</th><th>Status</th><th>Aksi</th></tr>
      </thead>
      <tbody id="histBody"><tr><td colspan="7" class="empty">Memuat...</td></tr></tbody>
    </table>
  </div>
</div>

<div id="paymentModal" class="modal-overlay" style="display:none;">
  <div class="modal-box">
    <div class="modal-close" onclick="closePaymentModal()">✕</div>
    <div style="text-align:center;color:var(--muted);font-size:13px;" id="payModalInfo"></div>
    <div style="text-align:center;font-size:30px;font-weight:700;color:var(--brand);margin:4px 0 18px;" id="payModalTotal">Rp 0</div>
    <div class="paymethod-grid" id="payMethodGrid">
      <div class="paymethod-card" data-m="tunai" onclick="selectPayModal('tunai')"><div><b>Tunai</b><div class="pm-sub">Uang kembali otomatis</div></div></div>
      <div class="paymethod-card" data-m="qris" onclick="selectPayModal('qris')"><div><b>QRIS</b><div class="pm-sub">Semua e-wallet & bank</div></div></div>
      <div class="paymethod-card" data-m="transfer" onclick="selectPayModal('transfer')"><div><b>Transfer Bank</b><div class="pm-sub">BCA · Mandiri · BRI</div></div></div>
    </div>
    <div id="cashSection" style="display:none;">
      <div class="field"><label>Uang Diterima</label><input id="cashReceived" type="number" oninput="updateChange()" placeholder="0"></div>
      <div class="quick-amt-row">
        <button onclick="setQuickAmt('exact')">Uang pas</button>
        <button onclick="setQuickAmt(50000)">Rp 50.000</button>
        <button onclick="setQuickAmt(100000)">Rp 100.000</button>
        <button onclick="setQuickAmt(150000)">Rp 150.000</button>
        <button onclick="setQuickAmt(200000)">Rp 200.000</button>
      </div>
      <div class="change-box"><span>Kembalian</span><b id="changeAmt">Rp 0</b></div>
    </div>
    <button class="btn btn-primary" id="payConfirmBtn" style="width:100%;margin-top:16px;" onclick="confirmPayOrder()">Konfirmasi & Cetak Struk</button>
  </div>
</div>

<div id="receiptModal" class="modal-overlay" style="display:none;">
  <div class="modal-box">
    <div class="modal-close" onclick="closeReceiptModal()">✕</div>
    <h3 style="margin-top:0;">Struk Pembayaran</h3>
    <div class="receipt-onscreen" id="receiptModalBody"></div>
    <div id="fakeQr" style="text-align:center;margin:14px 0;"></div>
    <div class="form-row" style="margin-top:10px;">
      <button class="btn btn-outline" style="flex:1;" onclick="sendWhatsApp()">Kirim via WhatsApp</button>
      <button class="btn btn-primary" style="flex:1;" onclick="printLastReceipt()">Cetak Struk</button>
    </div>
    <button class="btn btn-outline" style="width:100%;margin-top:8px;" onclick="closeReceiptModal()">Tutup</button>
  </div>
</div>
@endsection