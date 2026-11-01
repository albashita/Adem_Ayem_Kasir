/**
 * Adem Ayem - Stok & Inventory Module
 * Pengelolaan bahan baku: CRUD, stok masuk/keluar, riwayat pergerakan.
 * Data diambil dari backend Laravel (bukan localStorage).
 */

// ─── State ────────────────────────────────────────────────────────────────────
let stokData      = [];   // hasil fetch /stok/data
let movementsData = [];   // hasil fetch /stok/movements
let editingStokId = null; // id_stock_item yang sedang diedit
let stockInId     = null; // id_stock_item yang akan ditambah stoknya

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
    const stock    = Number(item.current_stock) || 0;
    const minSt    = Number(item.minimum_stock) || 0;
    const isActive = Boolean(item.is_active);

    const stockStatus = stock <= 0
      ? '<span class="stock-status-badge badge-danger">Habis</span>'
      : stock <= minSt
        ? '<span class="stock-status-badge badge-warning">Menipis</span>'
        : '<span class="stock-status-badge badge-success">Aman</span>';

    const activeStatusBadge = isActive
      ? `<span class="status-pill status-pill-active" id="statusBadge_${item.id_stock_item}">Aktif</span>`
      : `<span class="status-pill status-pill-inactive" id="statusBadge_${item.id_stock_item}">Nonaktif</span>`;

    return `<tr id="stockRow_${item.id_stock_item}" class="${isActive ? '' : 'row-dimmed'}">
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td>
        <div class="stock-adjust">
          <button onclick="quickStockOut(${item.id_stock_item})">−</button>
          <span class="val">${stock}</span>
          <button onclick="openStockIn(${item.id_stock_item})">+</button>
        </div>
      </td>
      <td>${escapeHTML(item.unit)}</td>
      <td>${minSt}</td>
      <td id="statusCell_${item.id_stock_item}">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          ${activeStatusBadge}
          ${isActive ? stockStatus : ''}
        </div>
      </td>
      <td class="row-actions" style="display:flex;align-items:center;gap:12px;">
        <button type="button" class="btn-action-edit" onclick="openEditStokModal(${item.id_stock_item})">Ubah</button>
        <div class="switch-control-wrap" id="switchWrap_${item.id_stock_item}">
          <label class="switch-toggle" title="${isActive ? 'Klik untuk menonaktifkan bahan' : 'Klik untuk mengaktifkan bahan'}">
            <input type="checkbox"
                   id="switch_${item.id_stock_item}"
                   ${isActive ? 'checked' : ''}
                   onchange="handleToggleStatus(${item.id_stock_item}, this)">
            <span class="slider"></span>
            <span class="switch-spinner" id="spinner_${item.id_stock_item}" style="display:none;"></span>
          </label>
          <span class="switch-text ${isActive ? 'text-active' : 'text-inactive'}" id="switchText_${item.id_stock_item}">
            ${isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── Render Tabel Riwayat ─────────────────────────────────────────────────────
const SOURCE_LABEL = {
  purchase: 'Pembelian',
  harvest:  'Panen',
  gift:     'Pemberian',
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
    const srcStr  = SOURCE_LABEL[m.source_type] || m.source_type;
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
      const msg = result.errors
        ? Object.values(result.errors).flat().join('\n')
        : (result.message || 'Terjadi kesalahan.');
      errEl.textContent = msg;
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

// ─── Ubah Status Bahan (Switch Toggle) ─────────────────────────────────────────
async function handleToggleStatus(id, inputEl) {
  const item = stokData.find(i => Number(i.id_stock_item) === Number(id));
  if (!item) return;

  const previousState = !inputEl.checked;
  const targetState = inputEl.checked; // true = aktif, false = nonaktif

  const wrapEl = document.getElementById(`switchWrap_${id}`);
  const spinnerEl = document.getElementById(`spinner_${id}`);
  const textEl = document.getElementById(`switchText_${id}`);
  const cellEl = document.getElementById(`statusCell_${id}`);
  const rowEl = document.getElementById(`stockRow_${id}`);

  // Cegah klik berulang selama proses perubahan berlangsung & beri indikator loading sementara
  inputEl.disabled = true;
  if (wrapEl) wrapEl.classList.add('is-loading');
  if (spinnerEl) spinnerEl.style.display = 'inline-block';

  try {
    const res = await fetch(stokUrl('status', id), {
      method:  'POST',
      headers: stokHeaders(),
      body:    JSON.stringify({ is_active: targetState }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || 'Gagal mengubah status bahan.');
    }

    // Perubahan status berhasil dan langsung tersimpan ke database
    item.is_active = targetState;

    // Update teks switch
    if (textEl) {
      textEl.textContent = targetState ? 'Aktif' : 'Nonaktif';
      textEl.className = `switch-text ${targetState ? 'text-active' : 'text-inactive'}`;
    }

    // Update gaya visual baris tabel
    if (rowEl) {
      if (targetState) {
        rowEl.classList.remove('row-dimmed');
      } else {
        rowEl.classList.add('row-dimmed');
      }
    }

    // Update tampilan status kolom tabel
    if (cellEl) {
      const stock = Number(item.current_stock) || 0;
      const minSt = Number(item.minimum_stock) || 0;
      const stockStatus = stock <= 0
        ? '<span class="stock-status-badge badge-danger">Habis</span>'
        : stock <= minSt
          ? '<span class="stock-status-badge badge-warning">Menipis</span>'
          : '<span class="stock-status-badge badge-success">Aman</span>';

      const activeBadge = targetState
        ? `<span class="status-pill status-pill-active" id="statusBadge_${id}">Aktif</span>`
        : `<span class="status-pill status-pill-inactive" id="statusBadge_${id}">Nonaktif</span>`;

      cellEl.innerHTML = `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        ${activeBadge}
        ${targetState ? stockStatus : ''}
      </div>`;
    }

    showStokMessage(result.message || `Bahan berhasil ${targetState ? 'diaktifkan' : 'dinonaktifkan'}.`);

  } catch (err) {
    // Jika permintaan gagal, kembalikan posisi switch ke status sebelumnya dan tampilkan pesan kesalahan
    inputEl.checked = previousState;
    if (textEl) {
      textEl.textContent = previousState ? 'Aktif' : 'Nonaktif';
      textEl.className = `switch-text ${previousState ? 'text-active' : 'text-inactive'}`;
    }
    showStokMessage(err.message || 'Gagal mengubah status bahan baku.', true);
  } finally {
    // Selesai: hilangkan indikator loading & aktifkan kembali kontrol
    if (spinnerEl) spinnerEl.style.display = 'none';
    if (wrapEl) wrapEl.classList.remove('is-loading');
    inputEl.disabled = false;
  }
}

// ─── Stok Masuk ───────────────────────────────────────────────────────────────
function openStockIn(id) {
  const item = stokData.find(i => i.id_stock_item === id);
  if (!item) return;

  stockInId = id;
  document.getElementById('stockInName').textContent   = `${item.name} (${item.unit})`;
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

  errEl.textContent = '';

  if (!(qty > 0)) { errEl.textContent = 'Jumlah masuk harus lebih dari 0.'; return; }

  try {
    const res = await fetch(stokUrl('stock-in', stockInId), {
      method:  'POST',
      headers: stokHeaders(),
      body:    JSON.stringify({ quantity: qty, source_type: source, description: desc || null }),
    });
    const result = await res.json();
    if (!res.ok) { errEl.textContent = result.message || 'Gagal menambah stok.'; return; }

    closeStockIn();
    showStokMessage(result.message || 'Stok berhasil ditambahkan.');
    await loadAndRenderStok();
  } catch (err) {
    errEl.textContent = err.message || 'Terjadi kesalahan jaringan.';
  }
}

// ─── Quick Stock Out (tombol −) ───────────────────────────────────────────────
async function quickStockOut(id) {
  const item = stokData.find(i => i.id_stock_item === id);
  if (!item) return;
  if (item.current_stock <= 0) {
    showStokMessage('Stok sudah habis, tidak bisa dikurangi.', true);
    return;
  }

  try {
    const res = await fetch(stokUrl('stock-out', id), {
      method:  'POST',
      headers: stokHeaders(),
      body:    JSON.stringify({ quantity: 1, description: 'Koreksi stok' }),
    });
    const result = await res.json();
    if (!res.ok) {
      showStokMessage(result.message || 'Gagal mengurangi stok.', true);
      return;
    }
    showStokMessage(result.message || 'Stok berhasil dikurangi.');
    await loadAndRenderStok();
  } catch (err) {
    showStokMessage(err.message || 'Terjadi kesalahan jaringan.', true);
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
