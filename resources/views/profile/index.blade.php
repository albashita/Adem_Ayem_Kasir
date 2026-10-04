@extends('layouts.app')

@section('title', 'Profil Saya - Adem Ayem')
@section('page-title', 'Profil Saya')

@section('content')
      <div class="panel" style="max-width:400px;"><h3>Profil Saya</h3>
        <div class="field"><label>Nama</label><input id="myName"></div>
        <div class="field"><label>Username</label><input id="myUser"></div>
        <div class="field"><label>Password Baru (opsional)</label><input id="myPass" type="text" placeholder="Biarkan kosong jika tidak diubah"></div>
        <button class="btn btn-primary" onclick="saveProfile()">Simpan Perubahan</button>
        <div class="error-msg" id="profileMsg" style="color:var(--brand)"></div>
      </div>
    

@endsection