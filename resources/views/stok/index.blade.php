@extends('layouts.app')

@section('title', 'Stok Barang - Adem Ayem')
@section('page-title', 'Stok Barang')

@section('content')
    {{-- Kategori stok --}}
    <div class="cat-tabs" id="stokCatTabs">
        <button class="cat-tab" data-c="makanan"
            onclick="selectStokCat('makanan')">Makanan</button>
        <button class="cat-tab" data-c="minuman"
            onclick="selectStokCat('minuman')">Minuman</button>
        <button class="cat-tab" data-c="gudang"
            onclick="selectStokCat('gudang')">Gudang</button>
    </div>

    {{-- Daftar dan status stok --}}
    <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
            <h3 id="stokListTitle" style="margin:0;">
                Daftar &amp; Status Stok
            </h3>

            <button type="button" class="btn btn-primary"
                style="width:auto;padding:8px 14px;white-space:nowrap;"
                onclick="openTambahStokModal()">
                + Tambah Barang
            </button>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Nama Barang</th>
                    <th>Stok</th>
                    <th>Satuan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody id="stokStatusBody"></tbody>
        </table>
    </div>

    {{-- Riwayat stok dan filter tanggal --}}
    <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
            <h3 style="margin:0;">Riwayat Stok</h3>

            <select id="stokLogFilter"
                onchange="toggleStokCustomDates();renderStok();"
                style="padding:9px 12px;border:1px solid #d5ded8;border-radius:8px;background:white;max-width:100%;">
                <option value="today">Hari ini</option>
                <option value="week">7 hari terakhir</option>
                <option value="month">Bulan ini</option>
                <option value="custom">Pilih tanggal</option>
                <option value="all">Semua riwayat</option>
            </select>
        </div>

        {{-- Pilihan rentang tanggal --}}
        <div id="stokCustomDates"
            style="display:none;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
            <div class="field">
                <label for="stokDateFrom">Dari tanggal</label>
                <input id="stokDateFrom" type="date"
                    onchange="renderStok()">
            </div>

            <div class="field">
                <label for="stokDateTo">Sampai tanggal</label>
                <input id="stokDateTo" type="date"
                    onchange="renderStok()">
            </div>
        </div>

        {{-- Total biaya pembelian pada periode yang dipilih --}}
        <div style="font-size:13px;color:var(--muted);margin-bottom:12px;">
            <span id="stokSpendDescription">Total pembelian stok: </span>
            <b id="stokSpendToday">Rp 0</b>
            <span>(otomatis mengurangi pendapatan bersih)</span>
        </div>

        <div style="overflow-x:auto;">
            <table>
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Barang</th>
                        <th>Jenis</th>
                        <th>Jumlah</th>
                        <th>Satuan</th>
                        <th>Biaya</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody id="stokLogBody"></tbody>
            </table>
        </div>
    </div>

    {{-- Modal tambah dan ubah barang --}}
    <div id="stokItemModal" class="modal-overlay" style="display:none;">
        <div class="modal-box">
            <div class="modal-close" onclick="closeStokItemModal()">✕</div>

            <h3 id="stokFormTitle" style="margin-top:0;">
                Tambah Barang Baru
            </h3>

            <div class="field">
                <label for="iName">Nama Barang</label>
                <input id="iName"
                    placeholder="Cabe / Gas Elpiji / Es Batu">
            </div>

            <div class="field">
                <label for="iUnit">Satuan</label>
                <input id="iUnit"
                    placeholder="kg / tabung / liter / pcs">
            </div>

            <div class="field">
                <label for="iStock">Stok Awal</label>
                <input id="iStock" type="number" min="0"
                    step="any" placeholder="0">
            </div>

            <div class="field">
                <label for="iCost">Total Harga Beli (Rp, opsional)</label>
                <input id="iCost" type="number" min="0"
                    placeholder="20000">
            </div>

            <button type="button" class="btn btn-primary"
                id="iSaveBtn" onclick="saveInventoryItem()">
                Simpan
            </button>
        </div>
    </div>

    {{-- Modal barang masuk --}}
    <div id="stockInModal" class="modal-overlay" style="display:none;">
        <div class="modal-box">
            <div class="modal-close" onclick="closeStockIn()">✕</div>

            <h3 style="margin-top:0;">Barang masuk</h3>

            <div id="stockInName"
                style="font-size:14px;margin-bottom:14px;"></div>

            <div class="field">
                <label for="stockInQty">Jumlah masuk</label>
                <input id="stockInQty" type="number" min="0"
                    step="any" placeholder="1">
            </div>

            <div class="field">
                <label for="stockInCost">Total harga beli (Rp)</label>
                <input id="stockInCost" type="number" min="0"
                    placeholder="20000">
            </div>

            <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">
                Harga ini otomatis mengurangi pendapatan.
                Kosongkan kalau barang tidak dibeli (misal pemberian).
            </div>

            <div class="error-msg" id="stockInError"></div>

            <button type="button" class="btn btn-primary"
                onclick="confirmStockIn()">
                Simpan barang masuk
            </button>
        </div>
    </div>
@endsection
