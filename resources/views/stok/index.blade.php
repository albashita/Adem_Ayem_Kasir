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
.btn-action-delete {
    padding: 6px 12px;
    border: 1px solid #fca5a5;
    background: #fff5f5;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #dc2626;
    transition: all 0.2s;
}
.btn-action-delete:hover {
    background: #fee2e2;
    border-color: #ef4444;
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
                <option value="ekor">ekor</option>
            </select>
        </div>

        <div class="field">
            <label for="iMinStock">Stok Minimum <span style="color:var(--danger)">*</span></label>
            <input id="iMinStock" type="number" min="0" step="1" placeholder="0">
            <small>Sistem akan menandai status "Menipis" jika stok di bawah angka ini.</small>
        </div>

        {{-- Hanya tampil saat tambah baru, disembunyikan saat edit --}}
        <div class="field" id="iInitialStockField">
            <label for="iStock">Jumlah</label>
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

{{-- Modal Konfirmasi Hapus Bahan/Barang --}}
<div id="deleteStokModal" class="modal-overlay" style="display:none;" onclick="if(event.target === this) closeDeleteStokModal()">
    <div class="modal-box" style="max-width:420px;text-align:center;">
        <div class="modal-close" onclick="closeDeleteStokModal()">✕</div>

        <div style="width:52px;height:52px;margin:0 auto 14px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#dc2626;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </div>

        <h3 style="margin:0 0 10px;font-size:18px;font-weight:700;color:var(--ink, #1e293b);">Hapus Barang?</h3>

        <p style="color:#64748b;font-size:14px;line-height:1.5;margin:0 0 22px;">
            Apakah Anda yakin ingin menghapus barang <strong id="deleteStockItemName"></strong>?
        </p>

        <div style="display:flex;gap:10px;justify-content:center;">
            <button type="button" class="btn btn-outline" id="btnCancelDeleteStock" style="width:auto;padding:8px 18px;" onclick="closeDeleteStokModal()">
                Batal
            </button>
            <button type="button" class="btn btn-primary" id="btnConfirmDeleteStock" style="width:auto;padding:8px 18px;background:#dc2626;border-color:#dc2626;" onclick="executeDeleteStock()">
                Ya, Hapus
            </button>
        </div>
    </div>
</div>

@endsection
