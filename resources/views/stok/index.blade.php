@extends('layouts.app')

@section('title', 'Stok Barang - Adem Ayem')
@section('page-title', 'Stok Barang')

@section('content')

      {{-- Tab kategori --}}
      <div class="cat-tabs" id="stokCatTabs">
        <button class="cat-tab active" data-c="makanan" onclick="selectStokCat('makanan')">Makanan</button>
        <button class="cat-tab" data-c="minuman" onclick="selectStokCat('minuman')">Minuman</button>
        <button class="cat-tab" data-c="gudang" onclick="selectStokCat('gudang')">Gudang</button>
      </div>

      {{-- Tambah / ubah barang --}}
      <div class="panel">
        <h3 id="stokFormTitle">Tambah Barang Baru</h3>
        <div class="form-row">
          <div class="field">
            <label>Nama Barang</label>
            <input id="iName" placeholder="Cabe / Gas Elpiji / Es Batu">
          </div>
          <div class="field">
            <label>Satuan</label>
            <input id="iUnit" placeholder="kg / tabung / liter / pcs">
          </div>
          <div class="field">
            <label>Stok Awal</label>
            <input id="iStock" type="number" placeholder="0">
          </div>
          <div class="field">
            <label>Total Harga Beli (Rp)</label>
            <input id="iCost" type="number" min="0" placeholder="20000">
          </div>
          <button class="btn btn-primary" id="iSaveBtn" onclick="saveInventoryItem()">Simpan</button>
        </div>
      </div>

      {{-- Catat stok masuk (belanja): mengurangi pendapatan --}}
      <div class="panel" id="stokInPanel">
        <h3>Catat Stok Masuk (Belanja)</h3>
        <div class="form-row">
          <div class="field">
            <label>Barang</label>
            <select id="inItem"></select>
          </div>
          <div class="field">
            <label>Jumlah</label>
            <input id="inQty" type="number" min="0" step="any" placeholder="1">
          </div>
          <div class="field">
            <label>Total Harga (Rp)</label>
            <input id="inCost" type="number" min="0" placeholder="20000">
          </div>
          <button class="btn btn-primary" onclick="saveStockIn()">Simpan</button>
        </div>
        <div class="error-msg" id="inMsg"></div>
        <div class="hint" style="margin-top:6px;">Total harga belanja otomatis mengurangi pendapatan di dashboard dan laporan.</div>
      </div>

      {{-- Daftar & status stok --}}
      <div class="panel">
        <h3 id="stokListTitle">Daftar &amp; Status Stok</h3>
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

      {{-- Riwayat --}}
      <div class="panel">
        <h3>Riwayat Stok</h3>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Barang</th>
              <th>Jenis</th>
              <th>Jumlah</th>
              <th>Satuan</th>
              <th>Harga Beli</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody id="stokLogBody"></tbody>
        </table>
      </div>

@endsection