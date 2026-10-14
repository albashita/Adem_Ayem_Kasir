@extends('layouts.app')

@section('title', 'Pengguna & Akses - Adem Ayem')
@section('page-title', 'Pengguna & Akses')

@section('content')
  {{-- Kalau validasi form gagal, modal dibuka lagi dan error tampil di dalam modal --}}
  @php $reopenModal = $errors->any() && old('form_mode'); @endphp

  @if(session('success'))
    <div class="panel" style="color:var(--ok);font-weight:600">{{ session('success') }}</div>
  @endif

  @if($errors->any() && !$reopenModal)
    <div class="panel" style="color:var(--danger)">
      @foreach($errors->all() as $e)
        <div>{{ $e }}</div>
      @endforeach
    </div>
  @endif

  <div class="panel">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--line);">
      <h3 style="margin:0;padding:0;border:0;">Daftar Pengguna</h3>
      <button type="button" class="btn btn-primary btn-compact" onclick="openTambahPengguna()">Tambah Pengguna</button>
    </div>

    <table>
      <thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead>
      <tbody>
        @forelse($users as $u)
          <tr>
            <td>{{ $u->name }}</td>
            <td>{{ $u->username }}</td>
            <td><span class="tag tag-{{ ['owner'=>'superadmin','admin'=>'administrator','kasir'=>'kasir'][$u->role] ?? 'kasir' }}">{{ ucfirst($u->role) }}</span></td>
            <td class="row-actions">
              <button type="button"
                      data-id="{{ $u->id_user }}"
                      data-name="{{ $u->name }}"
                      data-username="{{ $u->username }}"
                      data-role="{{ $u->role }}"
                      onclick="openUbahPengguna(this)">Ubah</button>

              <button type="button" class="del"
                      data-id="{{ $u->id_user }}"
                      data-name="{{ $u->name }}"
                      onclick="openHapusPengguna(this)">Hapus</button>
            </td>
          </tr>
        @empty
          <tr><td colspan="4" class="empty">Belum ada pengguna</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>

  {{-- Modal Tambah / Ubah Pengguna --}}
  <div class="modal-overlay" id="penggunaModal" style="display:none;"
       onclick="if (event.target === this) closePenggunaModal()">
    <div class="modal-box">
      <h3 id="formTitle">Tambah Pengguna</h3>

      @if($reopenModal)
        <div class="error-msg" style="margin:0 0 14px;">
          @foreach($errors->all() as $e)
            <div>{{ $e }}</div>
          @endforeach
        </div>
      @endif

      <form id="userForm" method="POST" action="{{ route('pengguna.store') }}">
        @csrf
        <input type="hidden" name="_method" id="formMethod" value="POST">
        <input type="hidden" name="form_mode" id="fMode" value="{{ old('form_mode', 'add') }}">
        <input type="hidden" name="edit_id" id="fEditId" value="{{ old('edit_id') }}">

        <div class="field"><label>Nama</label>
          <input name="name" id="fName" value="{{ old('name') }}" placeholder="Nama lengkap" required></div>
        <div class="field"><label>Username</label>
          <input name="username" id="fUser" value="{{ old('username') }}" placeholder="username" required></div>
        <div class="field"><label>Password</label>
          <input name="password" id="fPass" type="text" placeholder="min. 6 karakter" required></div>
        <div class="field"><label>Role</label>
          <select name="role" id="fRole">
            <option value="owner" {{ old('role', 'owner') === 'owner' ? 'selected' : '' }}>Owner</option>
            <option value="admin" {{ old('role') === 'admin' ? 'selected' : '' }}>Admin</option>
            <option value="kasir" {{ old('role') === 'kasir' ? 'selected' : '' }}>Kasir</option>
          </select></div>

        <div class="profile-actions">
          <button type="submit" class="btn btn-primary btn-compact" id="fSaveBtn">Simpan</button>
          <button type="button" class="btn btn-outline btn-compact" onclick="closePenggunaModal()">Batal</button>
        </div>
      </form>
    </div>
  </div>

  {{-- Modal Konfirmasi Hapus --}}
  <div class="modal-overlay" id="hapusModal" style="display:none;"
       onclick="if (event.target === this) closeHapusPengguna()">
    <div class="modal-box" style="max-width:380px;">
      <h3>Hapus Pengguna</h3>
      <p style="text-align:center;margin:0 0 22px;font-size:14px;color:var(--muted);">
        Yakin ingin menghapus <b id="hapusNama" style="color:var(--ink);"></b>?
        Tindakan ini tidak bisa dibatalkan.
      </p>
      <form id="hapusForm" method="POST" action="">
        @csrf
        @method('DELETE')
        <div class="profile-actions">
          <button type="submit" class="btn btn-danger btn-compact">Hapus</button>
          <button type="button" class="btn btn-outline btn-compact" onclick="closeHapusPengguna()">Batal</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const PENGGUNA_URL   = @json(url('/pengguna'));
    const PENGGUNA_STORE = @json(route('pengguna.store'));

    // Atur tampilan form untuk mode tambah (editId kosong) atau ubah (editId terisi)
    function setPenggunaMode(editId){
      const edit = !!editId;
      document.getElementById('userForm').action = edit ? PENGGUNA_URL + '/' + editId : PENGGUNA_STORE;
      document.getElementById('formMethod').value = edit ? 'PUT' : 'POST';
      document.getElementById('fMode').value = edit ? 'edit' : 'add';
      document.getElementById('fEditId').value = edit ? editId : '';
      document.getElementById('formTitle').textContent = edit ? 'Ubah Pengguna' : 'Tambah Pengguna';
      document.getElementById('fSaveBtn').textContent = edit ? 'Update' : 'Simpan';
      const pass = document.getElementById('fPass');
      pass.required = !edit;
      pass.placeholder = edit ? 'kosongkan jika tidak diubah' : 'min. 6 karakter';
    }

    function openTambahPengguna(){
      ['fName','fUser','fPass'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('fRole').value = 'owner';
      setPenggunaMode(null);
      document.getElementById('penggunaModal').style.display = 'flex';
      document.getElementById('fName').focus();
    }

    function openUbahPengguna(btn){
      document.getElementById('fName').value = btn.dataset.name;
      document.getElementById('fUser').value = btn.dataset.username;
      document.getElementById('fRole').value = btn.dataset.role;
      document.getElementById('fPass').value = '';
      setPenggunaMode(btn.dataset.id);
      document.getElementById('penggunaModal').style.display = 'flex';
      document.getElementById('fName').focus();
    }

    function closePenggunaModal(){
      document.getElementById('penggunaModal').style.display = 'none';
    }

    function openHapusPengguna(btn){
      document.getElementById('hapusNama').textContent = btn.dataset.name;
      document.getElementById('hapusForm').action = PENGGUNA_URL + '/' + btn.dataset.id;
      document.getElementById('hapusModal').style.display = 'flex';
    }

    function closeHapusPengguna(){
      document.getElementById('hapusModal').style.display = 'none';
    }

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') { closePenggunaModal(); closeHapusPengguna(); }
    });

    @if($reopenModal)
      setPenggunaMode(@json(old('edit_id')));
      document.getElementById('penggunaModal').style.display = 'flex';
    @endif
  </script>
@endsection