@extends('layouts.app')

@section('title', 'Transaksi Pembayaran - Adem Ayem')
@section('page-title', 'Transaksi Pembayaran')

@section('content')
<div class="panel" id="riwayatPage"
     data-list-url="{{ route('riwayat.data', [], false) }}"
     data-pay-url="{{ url('/riwayat', [], false) }}">
  <div class="panel-header-row">
    <h3>Transaksi Pembayaran</h3>
  </div>

  {{-- Tab Filter Status Pembayaran --}}
  <div class="cat-tabs" id="histTabs">
    <button class="cat-tab active" data-f="semua" onclick="setHistFilter('semua')">Semua Transaksi</button>
    <button class="cat-tab" data-f="belum" onclick="setHistFilter('belum')">Menunggu Pembayaran</button>
    <button class="cat-tab" data-f="sudah" onclick="setHistFilter('sudah')">Berhasil Dibayar</button>
  </div>

  {{-- Area Filter dan Pencarian Berlabel Eksplisit --}}
  <div class="hist-filter-card">
    <div class="filter-grid">
      <div class="filter-item filter-search">
        <label for="fSearch">Cari Transaksi</label>
        <input id="fSearch" type="text" placeholder="Ketik invoice atau nama pelanggan..." oninput="renderHistory()">
      </div>

      <div class="filter-item">
        <label for="fTipe">Tipe Layanan</label>
        <select id="fTipe" onchange="renderHistory()">
          <option value="">Semua Tipe</option>
          <option value="dine-in">Makan di Tempat</option>
          <option value="takeaway">Bawa Pulang</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="fMetode">Metode Bayar</label>
        <select id="fMetode" onchange="renderHistory()">
          <option value="">Semua Metode</option>
          <option value="cash">Tunai</option>
          <option value="qris">QRIS</option>
          <option value="transfer">Transfer Bank</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="fFrom">Dari Tanggal</label>
        <input id="fFrom" type="date" onchange="onDateFilterChange()">
      </div>

      <div class="filter-item">
        <label for="fTo">Sampai Tanggal</label>
        <input id="fTo" type="date" onchange="onDateFilterChange()">
      </div>

      <div class="filter-item filter-action">
        <label>&nbsp;</label>
        <button class="btn btn-outline btn-reset" onclick="resetHistFilter()" title="Hapus semua kriteria filter">
          Reset Filter
        </button>
      </div>
    </div>
  </div>

  {{-- Tabel Riwayat Transaksi --}}
  <div style="overflow-x:auto;margin-top:14px;">
    <table class="hist-table">
      <thead>
        <tr>
          <th>Waktu</th>
          <th>No. Invoice</th>
          <th>Pelanggan</th>
          <th>Tipe Layanan</th>
          <th>Total Tagihan</th>
          <th>Metode Bayar</th>
          <th>Status Pembayaran</th>
          <th style="text-align:center;">Aksi</th>
        </tr>
      </thead>
      <tbody id="histBody">
        <tr><td colspan="8" class="empty">Memuat data transaksi...</td></tr>
      </tbody>
    </table>
  </div>
</div>

{{-- Modal Pembayaran --}}
<div id="paymentModal" class="modal-overlay" style="display:none;">
  <div class="modal-box pay-modal-wide">
    <div class="modal-close" onclick="closePaymentModal()">✕</div>
    <h3 style="margin:0 0 16px;">Konfirmasi Pembayaran</h3>

    {{-- Detail Tagihan Transaksi --}}
    <div class="pay-bill-details" id="payBillCard">
      <div class="pay-bill-row">
        <span>No. Invoice</span>
        <b id="payBillInvoice">-</b>
      </div>
      <div class="pay-bill-row">
        <span>Pelanggan</span>
        <span id="payBillCustomer">-</span>
      </div>
      <div class="pay-bill-row">
        <span>Tipe Layanan</span>
        <span id="payBillType">-</span>
      </div>
      <div class="pay-bill-divider"></div>
      <div class="pay-bill-row">
        <span>Subtotal</span>
        <span id="payBillSubtotal">Rp 0</span>
      </div>
      <div class="pay-bill-row" id="payBillDiscRow" style="display:none;">
        <span>Diskon</span>
        <span id="payBillDiscount" style="color:var(--danger);">- Rp 0</span>
      </div>
      <div class="pay-bill-row">
        <span>Pajak PB1 (10%)</span>
        <span id="payBillTax">Rp 0</span>
      </div>
      <div class="pay-bill-row total-highlight">
        <span>Total Pembayaran</span>
        <b id="payModalTotal">Rp 0</b>
      </div>
    </div>

    {{-- Pilihan Metode Pembayaran --}}
    <div style="margin:16px 0 8px;font-size:13px;font-weight:600;color:var(--ink);">Metode Pembayaran</div>
    <div class="paymethod-grid" id="payMethodGrid">
      <div class="paymethod-card" data-m="tunai" onclick="selectPayModal('tunai')">
        <div>
          <b>Tunai</b>
          <div class="pm-sub">Uang pas / hitung kembalian</div>
        </div>
      </div>
      <div class="paymethod-card" data-m="qris" onclick="selectPayModal('qris')">
        <div>
          <b>QRIS</b>
          <div class="pm-sub">Semua e-wallet & mobile bank</div>
        </div>
      </div>
      <div class="paymethod-card" data-m="transfer" onclick="selectPayModal('transfer')">
        <div>
          <b>Transfer Bank</b>
          <div class="pm-sub">BCA · Mandiri · BRI</div>
        </div>
      </div>
    </div>

    {{-- Bagian Tunai: Input Uang Diterima & Kembalian --}}
    <div id="cashSection" style="display:none;">
      <div class="field" style="margin-bottom:10px;">
        <label for="cashReceived">Jumlah Uang Diterima (Rp)</label>
        <input id="cashReceived" type="number" oninput="updateChange()" placeholder="0">
      </div>
      <div class="quick-amt-row">
        <button type="button" onclick="setQuickAmt('exact')">Uang Pas</button>
        <button type="button" onclick="setQuickAmt(50000)">Rp 50.000</button>
        <button type="button" onclick="setQuickAmt(100000)">Rp 100.000</button>
        <button type="button" onclick="setQuickAmt(150000)">Rp 150.000</button>
        <button type="button" onclick="setQuickAmt(200000)">Rp 200.000</button>
      </div>
      <div class="change-box">
        <span>Kembalian</span>
        <b id="changeAmt">Rp 0</b>
      </div>
    </div>

    {{-- Tombol Aksi Modal --}}
    <div class="form-row" style="margin-top:20px;gap:10px;">
      <button type="button" class="btn btn-outline" style="flex:1;" onclick="closePaymentModal()">Batal</button>
      <button type="button" class="btn btn-primary" id="payConfirmBtn" style="flex:2;" onclick="confirmPayOrder()">
        Konfirmasi & Cetak Struk
      </button>
    </div>
  </div>
</div>

{{-- Modal Struk Pembayaran --}}
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

{{-- Modal Alert / Notifikasi --}}
<div id="alertModal" class="modal-overlay" style="display:none;">
  <div class="modal-box" style="text-align:center;max-width:360px;">
    <h3 id="alertModalTitle" style="margin:0 0 8px;">Perhatian</h3>
    <div id="alertModalMsg" style="font-size:14px;color:var(--muted);margin-bottom:18px;"></div>
    <button class="btn btn-primary" style="width:100%;" onclick="closeAlertModal()">OK</button>
  </div>
</div>
@endsection
