@extends('layouts.app')

@section('title', 'Profil Saya - Adem Ayem')
@section('page-title', 'Profil Saya')

@section('content')
      <div class="panel profile-card">

        <div class="profile-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B8892B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/>
          </svg>
        </div>

        <div id="profileView">
          <dl class="profile-info">
            <div><dt>Nama</dt><dd id="viewName">-</dd></div>
            <div><dt>Username</dt><dd id="viewUser">-</dd></div>
            <div><dt>Password</dt>
              <dd><span id="viewPass">••••••••</span>
                <button type="button" class="link-btn" id="togglePassBtn" onclick="togglePass()">Tampilkan</button>
              </dd>
            </div>
          </dl>
          <button class="btn btn-outline btn-compact" onclick="editProfile(true)">Ubah Profil</button>
        </div>

        <div id="profileEdit" style="display:none;">
          <div class="field"><label>Nama</label><input id="myName"></div>
          <div class="field"><label>Username</label><input id="myUser"></div>
          <div class="field"><label>Password Baru (opsional)</label><input id="myPass" type="text" placeholder="Biarkan kosong jika tidak diubah"></div>
          <div class="profile-actions">
            <button class="btn btn-primary btn-compact" onclick="saveProfile()">Simpan</button>
            <button class="btn btn-outline btn-compact" onclick="editProfile(false)">Batal</button>
          </div>
        </div>

        <div class="error-msg" id="profileMsg" style="color:var(--brand)"></div>
      </div>

@endsection