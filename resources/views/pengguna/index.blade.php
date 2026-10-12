@extends('layouts.app')

@section('title', 'Pengguna & Akses - Adem Ayem')
@section('page-title', 'Pengguna & Akses')

@section('content')
  @if(session('success'))
    <div class="panel" style="color:var(--ok);font-weight:600">{{ session('success') }}</div>
  @endif

  @if($errors->any())
    <div class="panel" style="color:var(--danger)">
      @foreach($errors->all() as $e)
        <div>{{ $e }}</div>
      @endforeach
    </div>
  @endif

  <div class="panel">
    <h3 id="formTitle">Tambah Pengguna</h3>
    <form id="userForm" method="POST" action="{{ route('pengguna.store') }}">
      @csrf
      <input type="hidden" name="_method" id="formMethod" value="POST">
      <div class="form-row">
        <div class="field"><label>Nama</label>
          <input name="name" id="fName" value="{{ old('name') }}" placeholder="Nama lengkap" required></div>
        <div class="field"><label>Username</label>
          <input name="username" id="fUser" value="{{ old('username') }}" placeholder="username" required></div>
        <div class="field"><label>Password</label>
          <input name="password" id="fPass" type="text" placeholder="min. 6 karakter" required></div>
        <div class="field"><label>Role</label>
          <select name="role" id="fRole">
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="kasir">Kasir</option>
          </select></div>
        <button type="submit" class="btn btn-primary" id="fSaveBtn">Simpan</button>
        <button type="button" class="btn" id="fCancelBtn" style="display:none" onclick="resetPenggunaForm()">Batal</button>
      </div>
    </form>
  </div>

  <div class="panel"><h3>Daftar Pengguna</h3>
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
                      onclick="editPengguna(this)">Ubah</button>

              <form method="POST" action="{{ route('pengguna.destroy', $u->id_user) }}" style="display:inline"
                    onsubmit="return confirm('Hapus pengguna ini?')">
                @csrf
                @method('DELETE')
                <button type="submit" class="del">Hapus</button>
              </form>
            </td>
          </tr>
        @empty
          <tr><td colspan="4" class="empty">Belum ada pengguna</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>

  <script>
    const PENGGUNA_URL = @json(url('/pengguna'));

    function editPengguna(btn){
      document.getElementById('userForm').action = PENGGUNA_URL + '/' + btn.dataset.id;
      document.getElementById('formMethod').value = 'PUT';
      document.getElementById('fName').value = btn.dataset.name;
      document.getElementById('fUser').value = btn.dataset.username;
      document.getElementById('fRole').value = btn.dataset.role;
      const pass = document.getElementById('fPass');
      pass.value = ''; pass.required = false;
      pass.placeholder = 'kosongkan jika tidak diubah';
      document.getElementById('formTitle').textContent = 'Ubah Pengguna';
      document.getElementById('fSaveBtn').textContent = 'Update';
      document.getElementById('fCancelBtn').style.display = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetPenggunaForm(){
      document.getElementById('userForm').action = @json(route('pengguna.store'));
      document.getElementById('formMethod').value = 'POST';
      ['fName','fUser','fPass'].forEach(id => document.getElementById(id).value = '');
      const pass = document.getElementById('fPass');
      pass.required = true; pass.placeholder = 'min. 6 karakter';
      document.getElementById('fRole').value = 'owner';
      document.getElementById('formTitle').textContent = 'Tambah Pengguna';
      document.getElementById('fSaveBtn').textContent = 'Simpan';
      document.getElementById('fCancelBtn').style.display = 'none';
    }
  </script>
@endsection