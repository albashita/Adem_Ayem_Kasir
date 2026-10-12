@extends('layouts.app')

@section('title', 'Profil Saya - Adem Ayem')
@section('page-title', 'Profil Saya')

@section('content')
<div class="panel profile-card">

    <div class="profile-hero">
        <div class="profile-avatar">
            <svg viewBox="0 0 24 24" fill="none"
                stroke="#F2CF74" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/>
            </svg>
        </div>

        <h2 class="profile-name" id="heroName">-</h2>
    </div>

    <div class="profile-body">
        <div id="profileView">

            <div class="pass-row">
                <span class="pass-label">Password</span>

                <div class="pass-box">
                    <span class="pass-value">••••••••</span>
                </div>
            </div>

            <button
                type="button"
                class="btn btn-outline btn-compact profile-edit-btn"
                onclick="editProfile(true)">
                Ubah Profil
            </button>
        </div>

        <div id="profileEdit" style="display:none;">
            <div class="field">
                <label>Nama</label>
                <input id="myName">
            </div>

            <div class="field">
                <label>Username</label>
                <input id="myUser">
            </div>

            <div class="field">
    <label>Password Lama (wajib jika ganti password)</label>
    <div style="display:flex;gap:10px;align-items:center;">
        <input id="myOldPass" type="password" placeholder="Password saat ini" style="flex:1;">
        <button type="button" class="eye-btn" onclick="togglePw('myOldPass', this)" aria-label="Tampilkan password">
            <svg class="ic-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg class="ic-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5.6 19 2 12 2 12a18.5 18.5 0 0 1 4.1-5.1"/>
                <path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2"/>
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
                <path d="M1 1l22 22"/>
            </svg>
        </button>
    </div>
</div>

<div class="field">
    <label>Password Baru (opsional)</label>
    <div style="display:flex;gap:10px;align-items:center;">
        <input id="myPass" type="password" placeholder="Biarkan kosong jika tidak diubah" style="flex:1;">
        <button type="button" class="eye-btn" onclick="togglePw('myPass', this)" aria-label="Tampilkan password">
            <svg class="ic-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg class="ic-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5.6 19 2 12 2 12a18.5 18.5 0 0 1 4.1-5.1"/>
                <path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2"/>
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
                <path d="M1 1l22 22"/>
            </svg>
        </button>
    </div>
</div>

            <div class="profile-actions">
                <button
                    type="button"
                    class="btn btn-primary btn-compact"
                    onclick="saveProfile()">
                    Simpan
                </button>

                <button
                    type="button"
                    class="btn btn-outline btn-compact"
                    onclick="editProfile(false)">
                    Batal
                </button>
            </div>
        </div>

        <div class="error-msg" id="profileMsg"
            style="color:var(--brand)">
        </div>
    </div>
</div>
@endsection