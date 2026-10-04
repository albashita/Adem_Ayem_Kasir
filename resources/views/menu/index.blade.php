@extends('layouts.app')

@section('title', 'Kelola Menu - Adem Ayem')
@section('page-title', 'Kelola Menu')

@section('content')
      <div class="panel"><h3>Tambah / Ubah Menu</h3>
        <div class="form-row">
          <div class="field"><label>Nama Menu</label><input id="mName" placeholder="Nasi Goreng"></div>
          <div class="field"><label>Kategori</label><input id="mCat" placeholder="Nasi / Ikan / Ayam / Sayur / Minuman"></div>
          <div class="field"><label>Harga (Rp)</label><input id="mPrice" type="number" placeholder="15000"></div>
          <button class="btn btn-primary" id="mSaveBtn" onclick="saveMenu()">Simpan</button>
        </div>
        <div class="field"><label>Gambar (pilih ikon)</label>
          <div class="emoji-pick" id="emojiPick"></div>
        </div>
      </div>
      <div class="panel"><h3>Daftar Menu</h3>
      <table><thead><tr><th>Gbr</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Aksi</th></tr></thead><tbody id="menuBody"></tbody></table></div>
    

@endsection