@extends('layouts.app')

@section('title', 'Stok Barang - Adem Ayem')
@section('page-title', 'Stok Barang')

@section('content')
      <div class="cat-tabs" id="stokCatTabs">
        <button class="cat-tab" data-c="makanan" onclick="selectStokCat('makanan')">Makanan</button>
        <button class="cat-tab" data-c="minuman" onclick="selectStokCat('minuman')">Minuman</button>
        <button class="cat-tab" data-c="gudang" onclick="selectStokCat('gudang')">Gudang</button>
      </div>
      <div class="panel"><h3 id="stokFormTitle">Tambah Barang Baru</h3>
        <div class="form-row">
          <div class="field"><label>Nama Barang</label><input id="iName" placeholder="Cabe / Gas Elpiji / Es Batu"></div>
          <div class="field"><label>Satuan</label><input id="iUnit" placeholder="kg / tabung / liter / pcs"></div>
          <div class="field"><label>Stok Awal</label><input id="iStock" type="number" min="0" placeholder="0"></div>
          <div class="field"><label>Total Harga Beli (Rp, opsional)</label><input id="iCost" type="number" min="0" placeholder="20000"></div>
          <button class="btn btn-primary" id="iSaveBtn" onclick="saveInventoryItem()">Simpan</button>
        </div>
      </div>
      <div class="panel"><h3 id="stokListTitle">Daftar & Status Stok</h3>
      <table><thead><tr><th>Nama Barang</th><th>Stok</th><th>Satuan</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="stokStatusBody"></tbody></table></div>
      <div class="panel"><h3>Riwayat Stok</h3>
      <div style="font-size:13px;color:var(--muted);margin:-6px 0 12px;">Pembelian stok hari ini: <b id="stokSpendToday">Rp 0</b> (otomatis mengurangi pendapatan bersih)</div>
      <table><thead><tr><th>Tanggal</th><th>Barang</th><th>Jenis</th><th>Jumlah</th><th>Satuan</th><th>Biaya</th><th>Catatan</th></tr></thead><tbody id="stokLogBody"></tbody></table></div>
      <div id="stockInModal" class="modal-overlay" style="display:none;">
        <div class="modal-box">
          <div class="modal-close" onclick="closeStockIn()">✕</div>
          <h3 style="margin-top:0;">Barang masuk</h3>
          <div style="font-size:14px;margin-bottom:14px;" id="stockInName"></div>
          <div class="field"><label>Jumlah masuk</label><input id="stockInQty" type="number" min="0" step="any" placeholder="1"></div>
          <div class="field"><label>Total harga beli (Rp)</label><input id="stockInCost" type="number" min="0" placeholder="20000"></div>
          <div style="font-size:12px;color:var(--muted);margin:-8px 0 12px;">Harga ini otomatis mengurangi pendapatan. Kosongkan kalau barang tidak dibeli (misal pemberian).</div>
          <div class="error-msg" id="stockInError"></div>
          <button class="btn btn-primary" onclick="confirmStockIn()">Simpan barang masuk</button>
        </div>
      </div>

@endsection