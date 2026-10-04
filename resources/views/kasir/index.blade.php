@extends('layouts.app')

@section('title', 'Kasir - Adem Ayem')
@section('page-title', 'Kasir')

@section('content')
      <div class="pos-layout">
        <div class="pos-products panel"><h3>Pesanan Pelanggan — Pilih Menu</h3>
          <div class="pos-toolbar"><input id="posSearch" class="pos-search" placeholder="Cari menu..." oninput="renderPOS()"><button class="btn btn-outline btn-compact" onclick="openMenuQr()">QR Menu</button></div>
          <div class="cat-tabs" id="posCatTabs"></div>
          <div class="prod-grid" id="posProductGrid"></div>
        </div>
        <div class="pos-cart panel"><h3>Pesanan Saat Ini</h3>
          <div class="paymethods" id="orderTypeToggle" style="margin-bottom:12px;">
            <button data-t="dine-in" onclick="selectOrderType('dine-in')">Makan di Tempat</button>
            <button data-t="takeaway" onclick="selectOrderType('takeaway')">Bawa Pulang</button>
          </div>
          <div class="field"><label>Nama Pelanggan (opsional)</label><input id="custName" placeholder="mis. Bu Rina"></div>
          <div id="cartBody"><div class="empty">Belum ada item</div></div>
          <div class="form-row" style="margin-bottom:8px;">
            <div class="field"><label>Diskon (Rp)</label><input id="discountInput" type="number" placeholder="0"></div>
            <button class="btn btn-outline" onclick="applyDiscount()">Terapkan</button>
          </div>
          <div class="rline-mini"><span>Subtotal</span><span id="cartSubtotal">Rp 0</span></div>
          <div class="rline-mini" id="cartDiscountRow" style="display:none;"><span>Diskon</span><span id="cartDiscount">- Rp 0</span></div>
          <div class="rline-mini"><span>Pajak PB1 (10%)</span><span id="cartTax">Rp 0</span></div>
          <div class="total-row"><span>Total</span><span id="cartTotal">Rp 0</span></div>
          <button class="btn btn-accent" style="width:100%" onclick="openPaymentModal()">Bayar</button>
        </div>
      </div>
    
<div id="paymentModal" class="modal-overlay" style="display:none;">
      <div class="modal-box">
        <div class="modal-close" onclick="closePaymentModal()">✕</div>
        <div style="text-align:center;color:var(--muted);font-size:13px;">Total yang harus dibayar</div>
        <div style="text-align:center;font-size:30px;font-weight:700;color:var(--brand);margin:4px 0 18px;" id="payModalTotal">Rp 0</div>
        <div class="paymethod-grid" id="payMethodGrid">
          <div class="paymethod-card" data-m="tunai" onclick="selectPayModal('tunai')"><div class="pm-ic">💵</div><div><b>Tunai</b><div class="pm-sub">Uang kembali otomatis</div></div></div>
          <div class="paymethod-card" data-m="qris" onclick="selectPayModal('qris')"><div class="pm-ic">📱</div><div><b>QRIS</b><div class="pm-sub">Semua e-wallet & bank</div></div></div>
          <div class="paymethod-card" data-m="kartu" onclick="selectPayModal('kartu')"><div class="pm-ic">💳</div><div><b>Kartu Debit/Kredit</b><div class="pm-sub">Mesin EDC</div></div></div>
          <div class="paymethod-card" data-m="transfer" onclick="selectPayModal('transfer')"><div class="pm-ic">🏦</div><div><b>Transfer Bank</b><div class="pm-sub">BCA · Mandiri · BRI</div></div></div>
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
        <button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="confirmPayment()">Konfirmasi & Cetak Struk</button>
      </div>
    </div>
<div id="receiptModal" class="modal-overlay" style="display:none;">
      <div class="modal-box">
        <div class="modal-close" onclick="closeReceiptModal()">✕</div>
        <h3 style="margin-top:0;">Pembayaran berhasil</h3>
        <div class="receipt-onscreen" id="receiptModalBody"></div>
        <div id="fakeQr" style="text-align:center;margin:14px 0;"></div>
        <div class="form-row" style="margin-top:10px;">
          <button class="btn btn-outline" style="flex:1;" onclick="sendWhatsApp()">Kirim via WhatsApp</button>
          <button class="btn btn-primary" style="flex:1;" onclick="printLastReceipt()">Cetak Struk</button>
        </div>
        <button class="btn btn-outline" style="width:100%;margin-top:8px;" onclick="closeReceiptModal()">Transaksi Baru</button>
      </div>
    </div>
<div id="menuQrModal" class="modal-overlay" style="display:none;">
      <div class="modal-box" style="text-align:center;">
        <div class="modal-close" onclick="closeMenuQr()">✕</div>
        <h3 style="margin-top:0;">QR Menu</h3>
        <div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Scan untuk melihat daftar menu</div>
        <div id="menuQrBox"></div>
        <pre id="menuQrText" class="menu-qr-text"></pre>
        <button class="btn btn-primary" style="margin-top:14px;" onclick="printMenuQr()">Cetak QR Menu</button>
      </div>
    </div>
@endsection