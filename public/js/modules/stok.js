/**
 * Adem Ayem - Stok & Inventory Module
 * Pengelolaan bahan baku: CRUD, stok masuk/keluar, riwayat pergerakan.
 * Data diambil dari backend Laravel (bukan localStorage).
 */

// ─── State ────────────────────────────────────────────────────────────────────
let stokData        = [];   // hasil fetch /stok/data
let movementsData   = [];   // hasil fetch /stok/movements
let editingStokId   = null; // id_stock_item yang sedang diedit
let stockInId       = null; // id_stock_item yang akan ditambah stoknya
let stockOutId      = null; // id_stock_item yang akan dikurangi stoknya
let deletingStockId = null; // id_stock_item yang akan dihapus

// ─── URL Helpers ──────────────────────────────────────────────────────────────
function stokPage() {
  return document.getElementById('stokPage');
}

function stokUrl(action, id = null) {
  const p = stokPage();
  if (!p) throw new Error('Elemen stokPage tidak ditemukan.');

  switch (action) {
    case 'data':       return p.dataset.dataUrl;
    case 'store':      return p.dataset.storeUrl;
    case 'movements':  return p.dataset.movementsUrl;
    case 'update':     return `${p.dataset.updateUrl}/${id}`;
    case 'status':     return `${p.dataset.statusUrl || p.dataset.updateUrl}/${id}/status`;
    case 'deactivate': return `${p.dataset.destroyUrl}/${id}/deactivate`;
    case 'stock-in':   return `${p.dataset.stockInUrl}/${id}/stock-in`;
    case 'stock-out':  return `${p.dataset.stockOutUrl}/${id}/stock-out`;
    default:           throw new Error(`stokUrl: action tidak dikenal "${action}"`);
  }
}

function stokHeaders() {
  return {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': CSRF_TOKEN,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchStokData() {
  const res = await fetch(stokUrl('data'), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Gagal memuat data stok.');
  stokData = await res.json();
}

async function fetchMovements() {
  const { from, to } = getStokFilterRange();
  const url = new URL(stokUrl('movements'), window.location.origin);
  if (from) url.searchParams.set('from', from);
  if (to)   url.searchParams.set('to', to);

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Gagal memuat riwayat stok.');
  movementsData = await res.json();
}

// ─── Entri Utama ──────────────────────────────────────────────────────────────
async function renderStok() {
  try {
    await Promise.all([fetchStokData(), fetchMovements()]);
  } catch (err) {
    showStokMessage(err.message, true);
    return;
  }
  renderStokTable();
  renderMovementsTable();
}

/**
 * Reload lengkap: fetch ulang kedua dataset lalu render.
 * Dipanggil setelah CUD berhasil, atau saat filter tanggal berubah.
 */
async function loadAndRenderStok() {
  try {
    await Promise.all([fetchStokData(), fetchMovements()]);
  } catch (err) {
    showStokMessage(err.message, true);
    return;
  }
  renderStokTable();
  renderMovementsTable();
}

// ─── Render Tabel Stok ────────────────────────────────────────────────────────
function renderStokTable() {
  const body = document.getElementById('stokStatusBody');
  if (!body) return;

  if (!stokData.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty">Belum ada bahan baku.</td></tr>';
    return;
  }

  body.innerHTML = stokData.map(item => {
    const stock = Number(item.current_stock) || 0;
    const minSt = Number(item.minimum_stock) || 0;

    const stockStatus = stock <= 0
      ? '<span class="stock-status-badge badge-danger">Habis</span>'
      : stock <= minSt
        ? '<span class="stock-status-badge badge-warning">Menipis</span>'
        : '<span class="stock-status-badge badge-success">Aman</span>';

    return `<tr id="stockRow_${item.id_stock_item}">
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td><span class="val">${stock}</span></td>
      <td>${escapeHTML(item.unit)}</td>
      <td>${minSt}</td>
      <td class="cell-center">${stockStatus}</td>
      <td class="aksi-cell">
        <div class="aksi-group">
          <button type="button" class="btn-icon btn-icon-add" title="Tambah stok" aria-label="Tambah stok"
                  onclick="openStockIn(${item.id_stock_item})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button type="button" class="btn-icon btn-icon-minus" title="Kurangi stok" aria-label="Kurangi stok"
                  onclick="openStockOut(${item.id_stock_item})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button type="button" class="btn-action-edit" onclick="openEditStokModal(${item.id_stock_item})">Ubah</button>
          <button type="button" class="btn-action-delete" onclick="confirmHapusBahan(${item.id_stock_item})">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── Render Tabel Riwayat ─────────────────────────────────────────────────────
const SOURCE_LABEL = {
  // stok masuk
  purchase: 'Pembelian',
  harvest:  'Panen',
  gift:     'Pemberian',
  // stok keluar
  used:     'Terpakai/terjual',
  spoiled:  'Busuk/rusak',
  expired:  'Kadaluarsa',
  // umum
  other:    'Lainnya',
};

function renderMovementsTable() {
  const body = document.getElementById('stokLogBody');
  if (!body) return;

  if (!movementsData.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty">Tidak ada riwayat pada periode ini.</td></tr>';
    return;
  }

  body.innerHTML = movementsData.map(m => {
    const dateStr = m.date ? new Date(m.date).toLocaleString('id-ID') : '-';
    const typeStr = m.type === 'in' ? 'Masuk' : 'Keluar';
    const srcStr  = SOURCE_LABEL[m.source_type] || m.source_type || '-';
    return `<tr>
      <td>${dateStr}</td>
      <td>${escapeHTML(m.item_name)}</td>
      <td>${typeStr}</td>
      <td>${m.quantity}</td>
      <td>${escapeHTML(m.unit)}</td>
      <td>${escapeHTML(srcStr)}</td>
      <td>${escapeHTML(m.description || '-')}</td>
      <td>${escapeHTML(m.user_name)}</td>
    </tr>`;
  }).join('');
}

// ─── Filter Tanggal ───────────────────────────────────────────────────────────
function toggleStokCustomDates() {
  const filter = document.getElementById('stokLogFilter');
  const dates  = document.getElementById('stokCustomDates');
  if (!filter || !dates) return;
  dates.style.display = filter.value === 'custom' ? 'flex' : 'none';
}

function getStokFilterRange() {
  const toLocalDate = d => {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const today  = new Date();
  const filter = document.getElementById('stokLogFilter')?.value || 'today';
  let from = toLocalDate(today);
  let to   = from;

  if (filter === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    from = toLocalDate(start);
  } else if (filter === 'month') {
    from = toLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
  } else if (filter === 'custom') {
    from = document.getElementById('stokDateFrom')?.value || from;
    to   = document.getElementById('stokDateTo')?.value   || to;
  } else if (filter === 'all') {
    from = '';
    to   = '';
  }

  return { from, to };
}

// ─── Modal Tambah / Edit Bahan ────────────────────────────────────────────────
const ALLOWED_UNITS = ['gram', 'liter', 'pcs'];

function openTambahStokModal() {
  editingStokId = null;

  document.getElementById('stokFormTitle').textContent  = 'Tambah Bahan Baru';
  document.getElementById('iName').value                = '';
  document.getElementById('iUnit').value                = '';
  document.getElementById('iMinStock').value            = '0';
  document.getElementById('iStock').value               = '0';
  document.getElementById('iDesc').value                = '';
  document.getElementById('iSaveBtn').textContent       = 'Simpan';
  document.getElementById('stokItemError').textContent  = '';
  document.getElementById('iInitialStockField').style.display = '';

  document.getElementById('stokItemModal').style.display = 'flex';
  document.getElementById('iName').focus();
}

function openEditStokModal(id) {
  const item = stokData.find(i => Number(i.id_stock_item) === Number(id));
  if (!item) { alert('Bahan tidak ditemukan.'); return; }

  editingStokId = id;

  document.getElementById('stokFormTitle').textContent = 'Ubah Bahan';
  document.getElementById('iName').value               = item.name;
  document.getElementById('iUnit').value               = item.unit || 'gram';
  document.getElementById('iMinStock').value           = item.minimum_stock;
  document.getElementById('iDesc').value               = item.description || '';
  document.getElementById('iSaveBtn').textContent      = 'Update';
  document.getElementById('stokItemError').textContent = '';

  // Sembunyikan field stok awal saat mode edit
  document.getElementById('iInitialStockField').style.display = 'none';

  document.getElementById('stokItemModal').style.display = 'flex';
}

function closeStokItemModal() {
  document.getElementById('stokItemModal').style.display = 'none';
  editingStokId = null;
}

async function saveInventoryItem() {
  const name     = document.getElementById('iName').value.trim();
  const unit     = document.getElementById('iUnit').value.trim();
  const minStock = parseInt(document.getElementById('iMinStock').value, 10);
  const initSt   = parseInt(document.getElementById('iStock').value, 10) || 0;
  const desc     = document.getElementById('iDesc').value.trim();
  const errEl    = document.getElementById('stokItemError');

  errEl.textContent = '';

  if (!name) { errEl.textContent = 'Nama bahan wajib diisi.'; return; }
  if (!unit || !ALLOWED_UNITS.includes(unit)) {
    errEl.textContent = 'Satuan wajib dipilih: gram, liter, atau pcs.';
    return;
  }
  if (isNaN(minStock) || minStock < 0) { errEl.textContent = 'Stok minimum tidak boleh negatif.'; return; }

  const btn = document.getElementById('iSaveBtn');
  btn.disabled = true;

  try {
    let res, result;

    if (editingStokId) {
      // Update — kirim PUT langsung (tidak perlu method spoofing untuk JSON)
      res = await fetch(stokUrl('update', editingStokId), {
        method:  'PUT',
        headers: stokHeaders(),
        body:    JSON.stringify({ name, unit, minimum_stock: minStock, description: desc || null }),
      });
    } else {
      // Create (POST)
      res = await fetch(stokUrl('store'), {
        method:  'POST',
        headers: stokHeaders(),
        body:    JSON.stringify({ name, unit, minimum_stock: minStock, initial_stock: initSt, description: desc || null }),
      });
    }

    result = await res.json();

    if (!res.ok) {
      const DUPLICATE_MSG = 'Nama bahan sudah terdaftar. Silakan gunakan nama bahan lain.';
      let isDuplicate = false;

      if (result.errors && result.errors.name) {
        const nameErrors = Array.isArray(result.errors.name) ? result.errors.name : [result.errors.name];
        if (nameErrors.some(err => typeof err === 'string' && (err.toLowerCase().includes('sudah terdaftar') || err.toLowerCase().includes('already been taken')))) {
          isDuplicate = true;
        }
      } else if (result.message && (result.message.toLowerCase().includes('sudah terdaftar') || result.message.toLowerCase().includes('already been taken') || result.message.toLowerCase().includes('duplicate entry'))) {
        isDuplicate = true;
      }

      if (isDuplicate) {
        errEl.textContent = DUPLICATE_MSG;
        alert(DUPLICATE_MSG);
      } else {
        const msg = result.errors
          ? Object.values(result.errors).flat().join('\n')
          : (result.message || 'Terjadi kesalahan.');
        errEl.textContent = msg;
        alert(msg);
      }
      return;
    }

    closeStokItemModal();
    showStokMessage(result.message || 'Berhasil disimpan.');
    await loadAndRenderStok();

  } catch (err) {
    errEl.textContent = err.message || 'Terjadi kesalahan jaringan.';
  } finally {
    btn.disabled = false;
  }
}

// ─── Hapus Bahan ──────────────────────────────────────────────────────────────
function confirmHapusBahan(id) {
  const item = stokData.find(i => Number(i.id_stock_item) === Number(id));
  if (!item) {
    showStokMessage('Bahan tidak ditemukan.', true);
    return;
  }

  deletingStockId = id;

  const nameEl = document.getElementById('deleteStockItemName');
  if (nameEl) {
    nameEl.textContent = item.name;
  }

  const modal = document.getElementById('deleteStokModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeDeleteStokModal() {
  const modal = document.getElementById('deleteStokModal');
  if (modal) {
    modal.style.display = 'none';
  }
  deletingStockId = null;
}

async function executeDeleteStock() {
  if (!deletingStockId) return;

  const btnConfirm = document.getElementById('btnConfirmDeleteStock');
  const btnCancel  = document.getElementById('btnCancelDeleteStock');

  try {
    if (btnConfirm) {
      btnConfirm.disabled = true;
      btnConfirm.textContent = 'Menghapus...';
    }
    if (btnCancel) {
      btnCancel.disabled = true;
    }

    const res = await fetch(`${stokPage().dataset.destroyUrl}/${deletingStockId}`, {
      method:  'DELETE',
      headers: stokHeaders(),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = result.errors
        ? Object.values(result.errors).flat().join('\n')
        : (result.message || 'Gagal menghapus bahan.');
      closeDeleteStokModal();
      showStokMessage(msg, true);
      return;
    }

    closeDeleteStokModal();
    const successMsg = result.message || 'Bahan berhasil dihapus.';
    showStokMessage(successMsg, false);
    await loadAndRenderStok();
  } catch (err) {
    closeDeleteStokModal();
    const errMsg = err.message || 'Terjadi kesalahan jaringan saat menghapus bahan.';
    showStokMessage(errMsg, true);
  } finally {
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.textContent = 'Ya, Hapus';
    }
    if (btnCancel) {
      btnCancel.disabled = false;
    }
  }
}

// ─── Stok Masuk (icon +) ──────────────────────────────────────────────────────
function openStockIn(id) {
  const item = stokData.find(i => i.id_stock_item === id);
  if (!item) return;

  stockInId = id;
  document.getElementById('stockInName').textContent   = `${item.name} (stok: ${item.current_stock} ${item.unit})`;
  document.getElementById('stockInQty').value          = '1';
  document.getElementById('stockInSource').value       = 'purchase';
  document.getElementById('stockInDesc').value         = '';
  document.getElementById('stockInError').textContent  = '';
  document.getElementById('stockInModal').style.display = 'flex';
  document.getElementById('stockInQty').focus();
}

function closeStockIn() {
  document.getElementById('stockInModal').style.display = 'none';
  stockInId = null;
}

async function confirmStockIn() {
  const qty    = parseInt(document.getElementById('stockInQty').value, 10);
  const source = document.getElementById('stockInSource').value;
  const desc   = document.getElementById('stockInDesc').value.trim();
  const errEl  = document.getElementById('stockInError');
  const btn    = document.getElementById('stockInSaveBtn');

  errEl.textContent = '';

  if (!(qty > 0)) { errEl.textContent = 'Jumlah masuk harus lebih dari 0.'; return; }

  btn.disabled = true;
  try {
    const res = await fetch(stokUrl('stock-in', stockInId), {
      method:  'POST',
      headers: stokHeaders(),
      body:    JSON.stringify({ quantity: qty, source_type: source, description: desc || null }),
    });
    const result = await res.json();
    if (!res.ok) {
      errEl.textContent = result.errors
        ? Object.values(result.errors).flat().join('\n')
        : (result.message || 'Gagal menambah stok.');
      return;
    }

    closeStockIn();
    showStokMessage(result.message || 'Stok berhasil ditambahkan.');
    await loadAndRenderStok();
  } catch (err) {
    errEl.textContent = err.message || 'Terjadi kesalahan jaringan.';
  } finally {
    btn.disabled = false;
  }
}

// ─── Stok Keluar (icon −) ─────────────────────────────────────────────────────
function openStockOut(id) {
  const item = stokData.find(i => i.id_stock_item === id);
  if (!item) return;
  if (Number(item.current_stock) <= 0) {
    showStokMessage('Stok sudah habis, tidak bisa dikurangi.', true);
    return;
  }

  stockOutId = id;
  document.getElementById('stockOutName').textContent  = `${item.name} (stok: ${item.current_stock} ${item.unit})`;
  document.getElementById('stockOutQty').value         = '1';
  document.getElementById('stockOutQty').max           = item.current_stock;
  document.getElementById('stockOutReason').value      = 'used';
  document.getElementById('stockOutDesc').value        = '';
  document.getElementById('stockOutError').textContent = '';
  document.getElementById('stockOutModal').style.display = 'flex';
  document.getElementById('stockOutQty').focus();
}

function closeStockOut() {
  document.getElementById('stockOutModal').style.display = 'none';
  stockOutId = null;
}

async function confirmStockOut() {
  const item   = stokData.find(i => i.id_stock_item === stockOutId);
  const qty    = parseInt(document.getElementById('stockOutQty').value, 10);
  const reason = document.getElementById('stockOutReason').value;
  const desc   = document.getElementById('stockOutDesc').value.trim();
  const errEl  = document.getElementById('stockOutError');
  const btn    = document.getElementById('stockOutSaveBtn');

  errEl.textContent = '';

  if (!item) return;
  if (!(qty > 0))                  { errEl.textContent = 'Jumlah harus lebih dari 0.'; return; }
  if (qty > item.current_stock)    { errEl.textContent = `Jumlah melebihi stok (${item.current_stock}).`; return; }
  if (reason === 'other' && !desc) { errEl.textContent = 'Keterangan wajib diisi untuk alasan "Lainnya".'; return; }

  btn.disabled = true;
  try {
    const res = await fetch(stokUrl('stock-out', stockOutId), {
      method:  'POST',
      headers: stokHeaders(),
      body:    JSON.stringify({ quantity: qty, source_type: reason, description: desc || null }),
    });
    const result = await res.json();
    if (!res.ok) {
      errEl.textContent = result.errors
        ? Object.values(result.errors).flat().join('\n')
        : (result.message || 'Gagal mengurangi stok.');
      return;
    }

    closeStockOut();
    showStokMessage(result.message || 'Stok berhasil dikurangi.');
    await loadAndRenderStok();
  } catch (err) {
    errEl.textContent = err.message || 'Terjadi kesalahan jaringan.';
  } finally {
    btn.disabled = false;
  }
}

// ─── Notifikasi Inline ────────────────────────────────────────────────────────
function showStokMessage(msg, isError = false) {
  const el = document.getElementById('stokMessage');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? 'var(--danger)' : '#3E7A52';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = ''; }, 5000);
}

// ─── Tutup semua modal dengan tombol Esc ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !stokPage()) return;
  closeStokItemModal();
  closeStockIn();
  closeStockOut();
  closeDeleteStokModal();
});

// Ekspor ke window agar dapat dipanggil dari event handler inline HTML
window.renderStok = renderStok;
window.loadAndRenderStok = loadAndRenderStok;
window.openTambahStokModal = openTambahStokModal;
window.openEditStokModal = openEditStokModal;
window.closeStokItemModal = closeStokItemModal;
window.saveInventoryItem = saveInventoryItem;
window.confirmHapusBahan = confirmHapusBahan;
window.closeDeleteStokModal = closeDeleteStokModal;
window.executeDeleteStock = executeDeleteStock;
window.openStockIn = openStockIn;
window.closeStockIn = closeStockIn;
window.confirmStockIn = confirmStockIn;
window.openStockOut = openStockOut;
window.closeStockOut = closeStockOut;
window.confirmStockOut = confirmStockOut;
window.toggleStokCustomDates = toggleStokCustomDates;