@extends('layouts.app')

@section('title', 'Kelola Menu - Adem Ayem')
@section('page-title', 'Kelola Menu')

@section('content')
<div class="menu-page"
     id="menuPage"
     data-list-url="{{ route('menu.data') }}"
     data-store-url="{{ route('menu.store') }}"
     data-update-url="{{ url('/menu') }}"
     data-delete-url="{{ url('/menu') }}">


    <div class="panel">
        
        <div class="menu-header">
            <h3>Daftar Menu</h3>

            <button type="button"
                    class="btn btn-primary btn-compact"
                    onclick="openMenuModal()">
                + Tambah Menu
            </button>
        </div>

        <div id="menuMessage" style="margin:12px 0;"></div>

        <div style="overflow-x:auto;">
            <table>
              <thead>
                  <tr>
                      <th>Foto</th>
                      <th>Kode</th>
                      <th>Nama</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Aksi</th>
                  </tr>
              </thead>

                <tbody id="menuBody">
                    <tr>
                        <td colspan="6">Memuat data menu...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

{{-- MODAL TAMBAH / EDIT MENU --}}
<div id="menuModal"
     style="display:none; position:fixed; inset:0; z-index:9999;
            background:rgba(0,0,0,.5); padding:20px;
            align-items:center; justify-content:center;">

    <div class="panel"
         style="width:100%; max-width:550px; max-height:90vh;
                overflow-y:auto; margin:0;">

          <div class="menu-modal-header">
              <h3 id="menuModalTitle">Tambah Menu</h3>
          </div>

        <form id="menuForm" class="menu-form-grid" onsubmit="saveMenu(event)">
            <div class="field">
                <label for="mCode">Kode Menu</label>
                <input id="mCode" type="text" value="Otomatis" readonly>
                <small>Kode dibuat otomatis berdasarkan ID menu.</small>
            </div>

            <div class="field">
                <label for="mName">Nama Menu</label>
                <input id="mName" type="text" maxlength="20"
                       placeholder="Contoh: Nasi Goreng" required>
            </div>

            <div class="field">
                <label for="mCat">Kategori</label>
                <select id="mCat" required>
                    <option value="">Pilih kategori</option>
                    @foreach ($categories as $category)
                        <option value="{{ $category->id_categorie }}">
                            {{ $category->name }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div class="field">
                <label for="mPrice">Harga (Rp)</label>
                <input id="mPrice" type="number" min="1" step="1"
                       placeholder="15000" required>
            </div>

            <div class="field">
                <label for="mDescription">Deskripsi</label>
                <input
                    id="mDescription"
                    type="text"
                    maxlength="200"
                   placeholder="Contoh: Gurame goreng dengan sambal pedas"
                >
            </div>

            <div class="field">
                 <label for="mImage">Foto Menu</label>
                 <input
                     id="mImage"
                     type="file"
                     accept="image/jpeg,image/png,image/webp"
                  >
                <small>Format JPG, PNG, atau WEBP.</small>

           <div style="margin-top:12px;">
           <img
            id="mImagePreview"
            src=""
            alt="Preview foto menu"
            style="display:none; width:140px; height:110px;
                   object-fit:cover; border-radius:10px;"
        >
        </div>
        </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button type="button" class="btn" onclick="closeMenuModal()">
                    Batal
                </button>
                <button type="submit" class="btn btn-primary" id="mSaveBtn">
                    Simpan
                </button>
            </div>
        </form>
    </div>
</div>

<div id="deleteMenuModal"
     style="display:none; position:fixed; inset:0; z-index:10000;
            background:rgba(0,0,0,.5); padding:20px;
            align-items:center; justify-content:center;">

    <div class="panel"
         style="width:100%; max-width:420px; margin:auto;">

        <h3>Hapus Menu</h3>

        <p>
            Yakin ingin menghapus menu
            <strong id="deleteMenuName"></strong>?
        </p>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn"
                    onclick="closeDeleteMenuModal()">
                Batal
            </button>

            <button type="button" id="confirmDeleteMenu"
                    class="btn"
                    style="background:#dc2626; color:white;">
                Ya, Hapus
            </button>
        </div>
    </div>
</div>
</escape>

@endsection
