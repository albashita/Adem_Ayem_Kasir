@extends('layouts.app')

@section('title', 'Pengeluaran - Adem Ayem')
@section('page-title', 'Pengeluaran')

@section('content')

{{-- URL Endpoint Meta (digunakan oleh pengeluaran.js) --}}
<div id="pengeluaranPage"
     data-data-url="{{ route('pengeluaran.data') }}"
     data-store-url="{{ route('pengeluaran.store') }}"
     data-base-url="{{ url('/pengeluaran') }}"
     style="display:none;">
</div>

<style>
    /* Styling Kategori & Status */
    .cat-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 600;
        letter-spacing: 0.2px;
    }
    .cat-bahan-baku   { background: #e0f2fe; color: #0369a1; }
    .cat-operasional  { background: #fef3c7; color: #92400e; }
    .cat-gaji         { background: #dcfce7; color: #15803d; }
    .cat-transportasi { background: #f3e8ff; color: #7e22ce; }
    .cat-perawatan    { background: #ffedd5; color: #c2410c; }
    .cat-lain-lain    { background: #f1f5f9; color: #475569; }

    /* Summary Card Widget */
    .exp-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
        margin-bottom: 16px;
    }
    .exp-summary-card {
        background: #ffffff;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 2px 8px rgba(20, 60, 40, .06);
        border: 1px solid #eef2ef;
    }
    .exp-summary-card .exp-lbl {
        font-size: 12.5px;
        color: #5f6b64;
        font-weight: 500;
    }
    .exp-summary-card .exp-val {
        font-size: 22px;
        font-weight: 700;
        color: #1f5e3a;
        margin-top: 4px;
        line-height: 1.2;
    }
    .exp-summary-card .exp-note {
        font-size: 11.5px;
        color: #88968e;
        margin-top: 3px;
    }

    /* Filter Toolbar */
    .exp-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-end;
        margin-bottom: 16px;
    }
    .exp-toolbar .field {
        margin-bottom: 0;
    }

    .btn-action-edit {
        padding: 6px 12px;
        border: 1px solid #d5ded8;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: var(--ink, #1e293b);
        transition: all 0.2s;
    }
    .btn-action-edit:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
    }
    .btn-action-delete {
        padding: 6px 12px;
        border: 1px solid #fca5a5;
        background: #fff5f5;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #dc2626;
        transition: all 0.2s;
    }
    .btn-action-delete:hover {
        background: #fee2e2;
        border-color: #ef4444;
    }
    .tr {
        text-align: right;
    }
</style>

{{-- Ringkasan Pengeluaran Sesuai Periode --}}
<div class="exp-summary-grid">
    <div class="exp-summary-card">
        <div class="exp-lbl">Total Pengeluaran</div>
        <div class="exp-val" id="summaryTotalAmount">Rp 0</div>
        <div class="exp-note" id="summaryPeriodText">Periode terpilih</div>
    </div>
    <div class="exp-summary-card">
        <div class="exp-lbl">Jumlah Transaksi Pengeluaran</div>
        <div class="exp-val" id="summaryTotalCount" style="color:#2f7d4f;">0</div>
        <div class="exp-note">Total transaksi tercatat</div>
    </div>
</div>

{{-- Panel Utama Pengeluaran --}}
<div class="panel">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <h3 style="margin:0;font-size:16px;font-weight:700;">Daftar Pengeluaran Usaha</h3>

        <button type="button" class="btn btn-primary"
                style="width:auto;padding:8px 16px;white-space:nowrap;"
                onclick="openExpenseModal()">
            + Tambah Pengeluaran
        </button>
    </div>

    {{-- Notifikasi / Alert --}}
    <div id="expenseAlert" style="margin-bottom:12px;display:none;"></div>

    {{-- Filter & Pencarian --}}
    <div class="exp-toolbar">
        <div class="field" style="flex:1 1 200px;">
            <label for="expSearch">Pencarian</label>
            <input type="search" id="expSearch" placeholder="Cari keterangan atau kategori…" oninput="onExpenseSearchChange()">
        </div>

        <div class="field" style="flex:0 0 160px;">
            <label for="expCategoryFilter">Kategori</label>
            <select id="expCategoryFilter" onchange="loadExpenses()">
                <option value="">Semua Kategori</option>
                @foreach ($categories as $cat)
                    <option value="{{ $cat }}">{{ $cat }}</option>
                @endforeach
            </select>
        </div>

        <div class="field" style="flex:0 0 150px;">
            <label for="expDatePreset">Periode</label>
            <select id="expDatePreset" onchange="onExpensePresetChange()">
                <option value="today">Hari ini</option>
                <option value="week">7 hari terakhir</option>
                <option value="month">Bulan ini</option>
                <option value="custom">Rentang tanggal</option>
                <option value="all">Semua</option>
            </select>
        </div>

        <div class="field" id="expCustomFromGroup" style="display:none;flex:0 0 140px;">
            <label for="expFromDate">Dari Tanggal</label>
            <input type="date" id="expFromDate" onchange="loadExpenses()">
        </div>

        <div class="field" id="expCustomToGroup" style="display:none;flex:0 0 140px;">
            <label for="expToDate">Sampai Tanggal</label>
            <input type="date" id="expToDate" onchange="loadExpenses()">
        </div>

        <div class="field" style="flex:0 0 auto;">
            <label>&nbsp;</label>
            <button type="button" class="btn btn-outline" style="padding:9px 14px;" onclick="resetExpenseFilters()">
                Reset
            </button>
        </div>
    </div>

    {{-- Tabel Pengeluaran --}}
    <div style="overflow-x:auto;">
        <table class="rpt" style="width:100%;">
            <thead>
                <tr>
                    <th style="width:50px;">No.</th>
                    <th style="width:130px;">Tanggal</th>
                    <th style="width:140px;">Kategori Pengeluaran</th>
                    <th>Keterangan</th>
                    <th class="tr" style="width:160px;">Jumlah Pengeluaran</th>
                    <th style="width:150px;text-align:center;">Aksi</th>
                </tr>
            </thead>
            <tbody id="expenseTableBody">
                <tr><td colspan="6" class="empty">Memuat data pengeluaran…</td></tr>
            </tbody>
            <tfoot id="expenseTableFoot" style="display:none;">
                <tr>
                    <td colspan="4" style="font-weight:700;text-align:right;">Total Pengeluaran:</td>
                    <td class="tr" id="footTotalAmount" style="font-weight:700;color:#1f5e3a;">Rp 0</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>
</div>

{{-- Modal Tambah / Edit Pengeluaran --}}
<div id="expenseModal" class="modal-overlay" style="display:none;">
    <div class="modal-box" style="max-width:480px;">
        <div class="modal-close" onclick="closeExpenseModal()">✕</div>

        <h3 id="expenseModalTitle" style="margin-top:0;">Tambah Pengeluaran</h3>

        <form id="expenseForm" onsubmit="saveExpense(event)">
            <input type="hidden" id="expEditId" value="">

            <div class="field">
                <label for="expInputDate">Tanggal Pengeluaran <span style="color:var(--danger)">*</span></label>
                <input type="date" id="expInputDate" required>
            </div>

            <div class="field">
                <label for="expInputCategory">Kategori Pengeluaran <span style="color:var(--danger)">*</span></label>
                <select id="expInputCategory" required style="width:100%;padding:9px 12px;border:1px solid #d5ded8;border-radius:8px;background:white;font-size:14px;">
                    <option value="">-- Pilih Kategori --</option>
                    @foreach ($categories as $cat)
                        <option value="{{ $cat }}">{{ $cat }}</option>
                    @endforeach
                </select>
            </div>

            <div class="field">
                <label for="expInputAmount">Jumlah Pengeluaran (Rp) <span style="color:var(--danger)">*</span></label>
                <input type="text" id="expInputAmount" inputmode="numeric" placeholder="Contoh: 150.000" required oninput="formatExpenseAmount(this)">
                <small style="color:#64748b;">Nominal wajib lebih dari 0.</small>
            </div>

            <div class="field">
                <label for="expInputDescription">Keterangan</label>
                <textarea id="expInputDescription" rows="3" maxlength="500" placeholder="Keterangan pengeluaran (opsional)..." style="width:100%;padding:9px 12px;border:1px solid #d5ded8;border-radius:8px;font-family:inherit;font-size:14px;resize:vertical;"></textarea>
            </div>

            <div id="expenseModalError" class="error-msg" style="margin-bottom:12px;display:none;"></div>

            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button type="button" class="btn btn-outline" style="width:auto;padding:8px 16px;" onclick="closeExpenseModal()">
                    Batal
                </button>
                <button type="submit" class="btn btn-primary" id="btnSaveExpense" style="width:auto;padding:8px 20px;">
                    Simpan
                </button>
            </div>
        </form>
    </div>
</div>

{{-- Modal Konfirmasi Hapus --}}
<div id="deleteExpenseModal" class="modal-overlay" style="display:none;">
    <div class="modal-box" style="max-width:400px;text-align:center;">
        <div style="font-size:36px;color:#dc2626;margin-bottom:8px;">⚠️</div>
        <h3 style="margin:0 0 8px;">Hapus Pengeluaran?</h3>
        <p style="color:#64748b;font-size:13.5px;margin-bottom:20px;" id="deleteExpenseDesc">
            Data pengeluaran yang dihapus tidak dapat dikembalikan.
        </p>

        <div style="display:flex;gap:10px;justify-content:center;">
            <button type="button" class="btn btn-outline" style="width:auto;padding:8px 18px;" onclick="closeDeleteExpenseModal()">
                Batal
            </button>
            <button type="button" class="btn btn-primary" id="btnConfirmDeleteExpense" style="width:auto;padding:8px 18px;background:#dc2626;border-color:#dc2626;" onclick="confirmDeleteExpense()">
                Ya, Hapus
            </button>
        </div>
    </div>
</div>

@endsection
