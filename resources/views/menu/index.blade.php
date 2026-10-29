@extends('layouts.app')

@section('title', 'Kelola Menu - Adem Ayem')
@section('page-title', 'Kelola Menu')

@section('content')
<div class="menu-page"
     id="menuPage"
     data-list-url="{{ route('menu.data') }}"
     data-store-url="{{ route('menu.store') }}"
     data-update-url="{{ url('/menu') }}"
     data-delete-url="{{ url('/menu') }}"
     data-recipe-url="{{ url('/menu') }}">


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
                <input id="mCode" type="text" maxlength="30" placeholder="Contoh: MNU-001" required>
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

{{-- MODAL ATUR RESEP MENU --}}
<div id="recipeModal"
     style="display:none; position:fixed; inset:0; z-index:9999;
            background:rgba(0,0,0,.5); padding:20px;
            align-items:center; justify-content:center;">

    <div class="panel"
         style="width:100%; max-width:680px; max-height:90vh;
                overflow-y:auto; margin:0; display:flex; flex-direction:column; gap:16px;">

        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
            <div>
                <h3 style="margin:0 0 4px; font-size:18px; font-weight:700; color:#1e293b;">Atur Resep Menu</h3>
                <div style="font-size:13px; color:#64748b; display:flex; gap:10px; align-items:center;">
                    <span>Menu: <strong id="recipeMenuName" style="color:#0f172a;">-</strong></span>
                    <span>•</span>
                    <span>Kode: <strong id="recipeMenuCode" style="color:#0f172a;">-</strong></span>
                </div>
            </div>
            <button type="button"
                    onclick="closeRecipeModal()"
                    style="background:none; border:none; font-size:24px; cursor:pointer; color:#94a3b8; line-height:1; padding:0 4px;"
                    aria-label="Tutup">
                &times;
            </button>
        </div>

        <div id="recipeAlert" style="display:none; padding:10px 14px; border-radius:6px; font-size:13px;"></div>

        {{-- FORM TAMBAH BAHAN BAKU --}}
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
            <div style="font-size:13px; font-weight:600; color:#334155; margin-bottom:10px;">
                + Tambah Bahan Baku ke Resep
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end;">
                <div style="flex:2; min-width:180px;">
                    <label for="recipeStockSelect" style="display:block; font-size:12px; font-weight:500; color:#475569; margin-bottom:4px;">
                        Pilih Bahan Baku (dari Stok Barang)
                    </label>
                    <select id="recipeStockSelect" onchange="onRecipeStockSelectChange()" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px;">
                        <option value="">-- Pilih Bahan Baku --</option>
                    </select>
                </div>

                <div style="flex:1; min-width:130px;">
                    <label for="recipeQtyInput" style="display:block; font-size:12px; font-weight:500; color:#475569; margin-bottom:4px;">
                        Jumlah per Porsi
                    </label>
                    <div style="display:flex; align-items:center;">
                        <input id="recipeQtyInput"
                               type="number"
                               step="any"
                               min="0.001"
                               placeholder="Contoh: 1"
                               style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:6px 0 0 6px; font-size:13px;">
                        <span id="recipeUnitDisplay"
                              style="background:#e2e8f0; color:#475569; padding:8px 10px; border:1px solid #cbd5e1; border-left:none; border-radius:0 6px 6px 0; font-size:12px; font-weight:600; white-space:nowrap; min-width:48px; text-align:center;">
                            -
                        </span>
                    </div>
                </div>

                <div>
                    <button type="button"
                            class="btn btn-primary btn-compact"
                            onclick="addRecipeIngredient()"
                            style="padding:8px 16px; height:37px; font-size:13px;">
                        + Tambah
                    </button>
                </div>
            </div>
            <div style="font-size:11.5px; color:#64748b; margin-top:6px;">
                * Jumlah bahan baku yang ditentukan adalah kebutuhan untuk membuat 1 porsi menu. Satuan otomatis mengikuti data Stok Barang.
            </div>
        </div>

        {{-- DAFTAR BAHAN BAKU --}}
        <div>
            <div style="font-size:13.5px; font-weight:600; color:#334155; margin-bottom:8px;">
                Daftar Bahan Baku Yang Digunakan
            </div>
            <div style="overflow-x:auto; border:1px solid #e2e8f0; border-radius:8px;">
                <table style="width:100%; margin:0; font-size:13px;">
                    <thead style="background:#f8fafc;">
                        <tr>
                            <th style="width:44px; text-align:center;">No</th>
                            <th>Bahan Baku</th>
                            <th style="width:150px; text-align:center;">Jumlah per Porsi</th>
                            <th style="width:90px; text-align:center;">Satuan</th>
                            <th style="width:70px; text-align:center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="recipeTableBody">
                        <tr>
                            <td colspan="5" style="text-align:center; padding:16px; color:#64748b;">
                                Memuat data resep...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:14px; margin-top:4px;">
            <div style="font-size:12px; color:#64748b;">
                * Resep ini tidak langsung memotong stok barang saat disimpan.
            </div>
            <div style="display:flex; gap:10px;">
                <button type="button" class="btn" onclick="closeRecipeModal()">
                    Batal
                </button>
                <button type="button" class="btn btn-primary" id="btnSaveRecipe" onclick="saveRecipe()" disabled>
                    Simpan Resep
                </button>
            </div>
        </div>
    </div>
</div>

<style>
.row-actions button.btn-recipe {
    color: #1d4ed8;
    border: 1px solid #93c5fd;
    background: #eff6ff;
}
.row-actions button.btn-recipe:hover {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1e40af;
}
#btnSaveRecipe:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: #94a3b8 !important;
    border-color: #94a3b8 !important;
}
</style>

@endsection
