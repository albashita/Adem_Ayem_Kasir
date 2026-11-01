@extends('layouts.app')

@section('title', 'Stok Barang - Adem Ayem')
@section('page-title', 'Stok Barang')

@section('content')

{{-- Kontainer URL endpoint (dibaca oleh stok.js) --}}
<div id="stokPage"
     data-data-url="{{ route('stok.data') }}"
     data-store-url="{{ route('stok.store') }}"
     data-update-url="{{ url('/stok') }}"
     data-status-url="{{ url('/stok') }}"
     data-destroy-url="{{ url('/stok') }}"
     data-stock-in-url="{{ url('/stok') }}"
     data-stock-out-url="{{ url('/stok') }}"
     data-movements-url="{{ route('stok.movements') }}"
     style="display:none;">
</div>

<style>
/* Switch Toggle Component */
.switch-control-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    user-select: none;
}
.switch-control-wrap.is-loading {
    pointer-events: none;
    opacity: 0.7;
}
.switch-toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    margin: 0;
    cursor: pointer;
    vertical-align: middle;
}
.switch-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
}
.switch-toggle .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.25s ease-in-out;
    border-radius: 24px;
}
.switch-toggle .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.25s ease-in-out;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.switch-toggle input:checked + .slider {
    background-color: #10b981;
}
.switch-toggle input:checked + .slider:before {
    transform: translateX(20px);
}
.switch-toggle input:disabled + .slider {
    opacity: 0.6;
    cursor: not-allowed;
}
.switch-spinner {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    border-top-color: #2563eb;
    animation: switchSpin 0.7s linear infinite;
    z-index: 2;
    pointer-events: none;
}
@keyframes switchSpin {
    to { transform: rotate(360deg); }
}
.switch-text {
    font-size: 13px;
    font-weight: 600;
}
.switch-text.text-active {
    color: #166534;
}
.switch-text.text-inactive {
    color: #64748b;
}

/* Status Pills & Indicators */
.status-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}
.status-pill-active {
    background: #dcfce7;
    color: #166534;
}
.status-pill-inactive {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #cbd5e1;
}
.stock-status-badge {
    font-weight: 600;
    font-size: 13px;
}
.stock-status-badge.badge-danger {
    color: var(--danger, #dc2626);
}
.stock-status-badge.badge-warning {
    color: var(--accent, #d97706);
}
.stock-status-badge.badge-success {
    color: #3E7A52;
}

.row-dimmed {
    background-color: #fbfbfb;
    color: #64748b;
}
.row-dimmed td:first-child strong {
    color: #64748b;
}

.btn-action-edit {
    padding: 6px 12px;
    border: 1px solid #d5ded8;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink, #1e293b);
    transition: all 0.2s;
}
.btn-action-edit:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}
</style>

{{-- Daftar bahan baku --}}
<div class="panel">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <h3 id="stokListTitle" style="margin:0;">Daftar &amp; Status Stok Bahan Baku</h3>

        <button type="button" class="btn btn-primary"
                style="width:auto;padding:8px 14px;white-space:nowrap;"
                onclick="openTambahStokModal()">
            + Tambah Bahan
        </button>
    </div>

    <div id="stokMessage" style="margin-bottom:10px;"></div>

    <div style="overflow-x:auto;">
        <table>
            <thead>
                <tr>
                    <th>Nama Bahan</th>
                    <th>Stok</th>
                    <th>Satuan</th>
                    <th>Min. Stok</th>
                    <th>Status</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody id="stokStatusBody">
                <tr><td colspan="6">Memuat data stok...</td></tr>
            </tbody>
        </table>
    </div>
</div>

{{-- Riwayat pergerakan stok --}}
<div class="panel">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
        <h3 style="margin:0;">Riwayat Stok</h3>

        <select id="stokLogFilter"
                onchange="toggleStokCustomDates();loadAndRenderStok();"
                style="padding:9px 12px;border:1px solid #d5ded8;border-radius:8px;background:white;max-width:100%;">
            <option value="today">Hari ini</option>
            <option value="week">7 hari terakhir</option>
            <option value="month">Bulan ini</option>
            <option value="custom">Pilih tanggal</option>
            <option value="all">Semua riwayat</option>
        </select>
    </div>

    {{-- Rentang tanggal kustom --}}
    <div id="stokCustomDates"
         style="display:none;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
        <div class="field">
            <label for="stokDateFrom">Dari tanggal</label>
            <input id="stokDateFrom" type="date" onchange="loadAndRenderStok()">
        </div>
        <div class="field">
            <label for="stokDateTo">Sampai tanggal</label>
            <input id="stokDateTo" type="date" onchange="loadAndRenderStok()">
        </div>
    </div>

    <div style="overflow-x:auto;">
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Bahan</th>
                    <th>Jenis</th>
                    <th>Jumlah</th>
                    <th>Satuan</th>
                    <th>Sumber</th>
                    <th>Keterangan</th>
                    <th>Petugas</th>
                </tr>
            </thead>
            <tbody id="stokLogBody">
                <tr><td colspan="8">Memuat riwayat...</td></tr>
            </tbody>
        </table>
    </div>
</div>

{{-- Modal tambah / ubah bahan --}}
<div id="stokItemModal" class="modal-overlay" style="display:none;">
    <div class="modal-box">
        <div class="modal-close" onclick="closeStokItemModal()">✕</div>

        <h3 id="stokFormTitle" style="margin-top:0;">Tambah Bahan Baru</h3>

        <div class="field">
            <label for="iName">Nama Bahan <span style="color:var(--danger)">*</span></label>
            <input id="iName" type="text" maxlength="35"
                   placeholder="Cabe / Beras / Es Batu">
        </div>

        <div class="field">
            <label for="iUnit">Satuan <span style="color:var(--danger)">*</span></label>
            <select id="iUnit" style="width:100%;padding:9px 12px;border:1px solid #d5ded8;border-radius:8px;background:white;font-size:14px;">
                <option value="">-- Pilih Satuan --</option>
                <option value="gram">gram</option>
                <option value="liter">liter</option>
                <option value="pcs">pcs</option>
            </select>
        </div>

        <div class="field">
            <label for="iMinStock">Stok Minimum <span style="color:var(--danger)">*</span></label>
            <input id="iMinStock" type="number" min="0" step="1" placeholder="0">
            <small>Sistem akan menandai status "Menipis" jika stok di bawah angka ini.</small>
        </div>

        {{-- Hanya tampil saat tambah baru, disembunyikan saat edit --}}
        <div class="field" id="iInitialStockField">
            <label for="iStock">Stok Awal</label>
            <input id="iStock" type="number" min="0" step="1" placeholder="0">
        </div>

        <div class="field">
            <label for="iDesc">Keterangan (opsional)</label>
            <input id="iDesc" type="text" maxlength="150"
                   placeholder="Bahan baku untuk masakan...">
        </div>

        <div id="stokItemError" class="error-msg" style="margin-bottom:10px;"></div>

        <button type="button" class="btn btn-primary"
                id="iSaveBtn" onclick="saveInventoryItem()">
            Simpan
        </button>
    </div>
</div>

{{-- Modal stok masuk --}}
<div id="stockInModal" class="modal-overlay" style="display:none;">
    <div class="modal-box">
        <div class="modal-close" onclick="closeStockIn()">✕</div>

        <h3 style="margin-top:0;">Tambah Stok Masuk</h3>

        <div id="stockInName"
             style="font-size:14px;font-weight:600;margin-bottom:14px;"></div>

        <div class="field">
            <label for="stockInQty">Jumlah Masuk <span style="color:var(--danger)">*</span></label>
            <input id="stockInQty" type="number" min="1" step="1" placeholder="1">
        </div>

        <div class="field">
            <label for="stockInSource">Sumber</label>
            <select id="stockInSource"
                    style="width:100%;padding:9px 12px;border:1px solid #d5ded8;border-radius:8px;background:white;">
                <option value="purchase">Pembelian</option>
                <option value="harvest">Panen</option>
                <option value="gift">Pemberian</option>
                <option value="other">Lainnya</option>
            </select>
        </div>

        <div class="field">
            <label for="stockInDesc">Keterangan (opsional)</label>
            <input id="stockInDesc" type="text" maxlength="150" placeholder="">
        </div>

        <div class="error-msg" id="stockInError"></div>

        <button type="button" class="btn btn-primary"
                onclick="confirmStockIn()">
            Simpan Stok Masuk
        </button>
    </div>
</div>


@endsection
