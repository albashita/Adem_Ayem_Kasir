@extends('layouts.app')

@section('title', 'Pengguna & Akses - Adem Ayem')
@section('page-title', 'Pengguna & Akses')

@section('content')
      <div class="panel"><h3>Tambah / Ubah Pengguna</h3>
        <div class="form-row">
          <div class="field"><label>Nama</label><input id="uName" placeholder="Nama lengkap"></div>
          <div class="field"><label>Username</label><input id="uUser" placeholder="username"></div>
          <div class="field"><label>Password</label><input id="uPass" type="text" placeholder="password"></div>
          <div class="field"><label>Role</label>
            <select id="uRole"><option value="superadmin">Superadmin</option><option value="administrator">Administrator</option><option value="kasir">Kasir</option></select>
          </div>
          <button class="btn btn-primary" id="uSaveBtn" onclick="saveUser()">Simpan</button>
        </div>
      </div>
      <div class="panel"><h3>Daftar Pengguna</h3>
      <table><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead><tbody id="userBody"></tbody></table></div>
    

@endsection