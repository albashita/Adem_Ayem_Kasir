
@extends('layouts.app')

@section('title', 'Kasir - Adem Ayem')
@section('page-title', 'Kasir')

@section('content')
@php
    // Ubah IP dan port server di sini jika diperlukan.
    $qrMenuUrl = 'http://192.168.1.136:8000/qr-menu';
@endphp

<div class="pos-layout" id="kasirPage"
     data-menu-url="{{ route('kasir.menu-data') }}"
     data-stock-url="{{ route('kasir.stock-estimates') }}"
     data-order-url="{{ route('kasir.orders.store') }}"
     data-qr-url="{{ $qrMenuUrl }}">

    <div class="pos-products panel">
        <h3>Pilih Menu</h3>

        <div class="pos-toolbar">
            <input id="posSearch" class="pos-search"
                   placeholder="Cari menu..."
                   oninput="renderPOS()">

            <button class="btn btn-outline btn-compact"
                    type="button"
                    onclick="openMenuQr()">
                QR Menu
            </button>
        </div>

        <div class="cat-tabs" id="posCatTabs"></div>
        <div class="prod-grid" id="posProductGrid"></div>
    </div>

    <div class="pos-cart panel">
        <h3>Pesanan Saat Ini</h3>

        <div class="paymethods" id="orderTypeToggle" style="margin-bottom:12px;">
            <button type="button" data-t="dine-in"
                    onclick="selectOrderType('dine-in')">
                Makan di Tempat
            </button>

            <button type="button" data-t="takeaway"
                    onclick="selectOrderType('takeaway')">
                Bawa Pulang
            </button>
        </div>

        <div class="field">
            <label>Nama Pelanggan (opsional)</label>
            <input id="custName" maxlength="30"
                   placeholder="mis. Bu Rina">
        </div>

        <div id="cartBody">
            <div class="empty">Belum ada item</div>
        </div>

        <div class="form-row" style="margin-bottom:8px;">
            <div class="field">
                <label>Diskon (Rp)</label>
                <input id="discountInput" type="number"
                       min="0" placeholder="0">
            </div>

            <button class="btn btn-outline" type="button"
                    onclick="applyDiscount()">
                Terapkan
            </button>
        </div>

        <div class="rline-mini">
            <span>Subtotal</span>
            <span id="cartSubtotal">Rp 0</span>
        </div>

        <div class="rline-mini" id="cartDiscountRow" style="display:none;">
            <span>Diskon</span>
            <span id="cartDiscount">Rp 0</span>
        </div>

        <div class="rline-mini">
            <span>Pajak PB1 (10%)</span>
            <span id="cartTax">Rp 0</span>
        </div>

        <div class="total-row">
            <span>Total</span>
            <span id="cartTotal">Rp 0</span>
        </div>

        <button class="btn btn-accent" id="saveOrderBtn"
                type="button"
                style="width:100%"
                onclick="saveOrder()">
            Simpan Pesanan
        </button>
    </div>
</div>

{{-- Modal QR Menu --}}
<div id="menuQrModal" class="modal-overlay" style="display:none;">
    <div class="modal-box" style="text-align:center;max-width:440px;">

        <div class="modal-close" onclick="closeMenuQr()">✕</div>

        <h3 style="margin-top:0;">QR Menu</h3>

        <div style="font-size:13px;color:var(--muted);margin-bottom:12px;">
            Scan untuk melihat daftar menu pelanggan
        </div>

        {{-- QR Code --}}
        <div id="menuQrBox"></div>

        <pre id="menuQrText" class="menu-qr-text"></pre>

        <div style="display:flex;gap:8px;margin-top:14px;">

            <button
                type="button"
                class="btn btn-outline"
                style="flex:1;"
                onclick="copyMenuQrUrl(this)"
            >
                Salin URL
            </button>

            <button
                type="button"
                class="btn btn-primary"
                style="flex:2;"
                onclick="printMenuQr()"
            >
                Cetak QR Menu
            </button>

        </div>
    </div>
</div>

{{-- Modal Pesanan Tersimpan --}}
<div id="orderSavedModal" class="modal-overlay" style="display:none;">
    <div class="modal-box" style="text-align:center;max-width:380px;">

        <div class="saved-check">✓</div>

        <h3 style="margin:12px 0 4px;">Pesanan tersimpan</h3>

        <div style="font-size:13px;color:var(--muted);">
            Nomor pesanan
        </div>

        <div class="saved-inv" id="savedInvNo">-</div>

        <div class="saved-summary">

            <div class="rline-mini">
                <span>Tipe</span>
                <span id="savedType">-</span>
            </div>

            <div class="rline-mini">
                <span>Pelanggan</span>
                <span id="savedCust">-</span>
            </div>

            <div class="rline-mini">
                <span>Total</span>
                <b id="savedTotal">Rp 0</b>
            </div>

        </div>

        <div class="form-row" style="margin-top:16px;">

            <button
                class="btn btn-outline"
                type="button"
                style="flex:1;"
                onclick="closeOrderSaved()"
            >
                Pesanan Baru
            </button>

            <button
                class="btn btn-primary"
                type="button"
                style="flex:1;"
                onclick="payFromSaved()"
            >
                Lanjut ke Pembayaran
            </button>

        </div>
    </div>
</div>

{{-- Modal Alert --}}
<div id="alertModal" class="modal-overlay" style="display:none;">
    <div class="modal-box" style="text-align:center;max-width:340px;">

        <h3 id="alertModalTitle" style="margin:0 0 8px;">
            Perhatian
        </h3>

        <div id="alertModalMsg"
             style="font-size:14px;color:var(--muted);margin-bottom:18px;">
        </div>

        <button
            class="btn btn-primary"
            type="button"
            style="width:100%;"
            onclick="closeAlertModal()"
        >
            OK
        </button>

    </div>
</div>

@push('scripts')
<script>
let lastSavedOrder = null;

function showOrderSaved(order) {
    lastSavedOrder = order;

    document.getElementById('savedInvNo').textContent =
        order.invoice ?? '-';

    document.getElementById('savedType').textContent =
        order.type === 'takeaway'
            ? 'Bawa Pulang'
            : 'Makan di Tempat';

    document.getElementById('savedCust').textContent =
        order.customer || '-';

    document.getElementById('savedTotal').textContent =
        order.total ?? 'Rp 0';

    document.getElementById('orderSavedModal').style.display = 'flex';
}

function closeOrderSaved() {
    document.getElementById('orderSavedModal').style.display = 'none';
}

function payFromSaved() {
    closeOrderSaved();
    window.location.href = ROUTE_URLS.riwayat;
}
</script>
@endpush

@endsection
