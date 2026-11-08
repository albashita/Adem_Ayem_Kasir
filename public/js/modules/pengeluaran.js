/**
 * Adem Ayem - Modul Pengeluaran (Expense)
 * Digunakan oleh Admin untuk mencatat seluruh uang keluar usaha.
 */

// ─── State Modul ─────────────────────────────────────────────────────────────
let expenseList     = [];
let deletingId      = null;
let searchTimer     = null;

// ─── Utility & Helper ─────────────────────────────────────────────────────────
function getExpensePage() {
  return document.getElementById('pengeluaranPage');
}

function getExpenseBaseUrl() {
  const p = getExpensePage();
  return p ? p.dataset.baseUrl : '/pengeluaran';
}

function getExpenseDataUrl() {
  const p = getExpensePage();
  return p ? p.dataset.dataUrl : '/pengeluaran/data';
}

function getExpenseStoreUrl() {
  const p = getExpensePage();
  return p ? p.dataset.storeUrl : '/pengeluaran';
}

function getLocalTodayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatRupiahVal(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function parseCurrencyNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function getCategoryBadgeClass(cat) {
  const c = String(cat || '').toLowerCase().trim();
  if (c.includes('bahan')) return 'cat-bahan-baku';
  if (c.includes('operasi')) return 'cat-operasional';
  if (c.includes('gaji')) return 'cat-gaji';
  if (c.includes('trans')) return 'cat-transportasi';
  if (c.includes('rawat')) return 'cat-perawatan';
  return 'cat-lain-lain';
}

// ─── Entri Inisialisasi Halaman ──────────────────────────────────────────────
function renderPengeluaran() {
  if (!document.getElementById('pengeluaranPage')) return;

  const today = getLocalTodayStr();
  const fromEl = document.getElementById('expFromDate');
  const toEl   = document.getElementById('expToDate');
  if (fromEl) fromEl.value = today;
  if (toEl)   toEl.value = today;

  const presetEl = document.getElementById('expDatePreset');
  if (presetEl) presetEl.value = 'today';

  loadExpenses();
}

// ─── Filter & Periode ────────────────────────────────────────────────────────
function getExpenseDateRange() {
  const preset = document.getElementById('expDatePreset')?.value || 'today';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const toIso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === 'today') {
    const today = toIso(now);
    return { from: today, to: today, text: 'Hari ini' };
  }

  if (preset === 'week') {
    const end = toIso(now);
    const startD = new Date();
    startD.setDate(startD.getDate() - 6);
    const start = toIso(startD);
    return { from: start, to: end, text: '7 hari terakhir' };
  }

  if (preset === 'month') {
    const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const end = toIso(now);
    return { from: start, to: end, text: 'Bulan ini' };
  }

  if (preset === 'custom') {
    const f = document.getElementById('expFromDate')?.value || '';
    const t = document.getElementById('expToDate')?.value || '';
    let text = 'Rentang tanggal';
    if (f && t) text = `${f} s.d. ${t}`;
    else if (f) text = `Mulai ${f}`;
    else if (t) text = `Sampai ${t}`;
    return { from: f, to: t, text };
  }

  // all
  return { from: '', to: '', text: 'Semua riwayat' };
}

function onExpensePresetChange() {
  const preset = document.getElementById('expDatePreset')?.value;
  const isCustom = preset === 'custom';
  const fromGroup = document.getElementById('expCustomFromGroup');
  const toGroup = document.getElementById('expCustomToGroup');
  if (fromGroup) fromGroup.style.display = isCustom ? 'flex' : 'none';
  if (toGroup)   toGroup.style.display   = isCustom ? 'flex' : 'none';

  loadExpenses();
}

function onExpenseSearchChange() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadExpenses();
  }, 250);
}

function resetExpenseFilters() {
  const today = getLocalTodayStr();
  const sEl = document.getElementById('expSearch');
  const cEl = document.getElementById('expCategoryFilter');
  const pEl = document.getElementById('expDatePreset');
  const fEl = document.getElementById('expFromDate');
  const tEl = document.getElementById('expToDate');

  if (sEl) sEl.value = '';
  if (cEl) cEl.value = '';
  if (pEl) pEl.value = 'today';
  if (fEl) fEl.value = today;
  if (tEl) tEl.value = today;

  onExpensePresetChange();
}

// ─── Fetch Data Pengeluaran ──────────────────────────────────────────────────
async function loadExpenses() {
  const tableBody = document.getElementById('expenseTableBody');
  if (!tableBody) return;

  const { from, to, text: periodText } = getExpenseDateRange();
  const cat = document.getElementById('expCategoryFilter')?.value || '';
  const q   = document.getElementById('expSearch')?.value?.trim() || '';

  const url = new URL(getExpenseDataUrl(), window.location.origin);
  if (from) url.searchParams.set('from', from);
  if (to)   url.searchParams.set('to', to);
  if (cat)  url.searchParams.set('category', cat);
  if (q)    url.searchParams.set('q', q);

  tableBody.innerHTML = '<tr><td colspan="6" class="empty">Memuat data pengeluaran…</td></tr>';

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!res.ok) {
      throw new Error('Gagal memuat data pengeluaran.');
    }

    const data = await res.json();
    expenseList = data.expenses || [];

    // Update KPI summary
    const sumTotalEl = document.getElementById('summaryTotalAmount');
    const sumCountEl = document.getElementById('summaryTotalCount');
    const sumPeriodEl = document.getElementById('summaryPeriodText');

    if (sumTotalEl) sumTotalEl.textContent = formatRupiahVal(data.total_amount || 0);
    if (sumCountEl) sumCountEl.textContent = data.total_count || 0;
    if (sumPeriodEl) sumPeriodEl.textContent = periodText;

    renderExpenseTable(expenseList, data.total_amount || 0);

  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="empty" style="color:var(--danger)">${escapeMenuHTML(err.message)}</td></tr>`;
  }
}

// ─── Render Tabel Pengeluaran ────────────────────────────────────────────────
function renderExpenseTable(items, totalAmount) {
  const body = document.getElementById('expenseTableBody');
  const foot = document.getElementById('expenseTableFoot');
  const footTotal = document.getElementById('footTotalAmount');
  if (!body) return;

  if (!items.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty">Tidak ada data pengeluaran pada periode ini.</td></tr>';
    if (foot) foot.style.display = 'none';
    return;
  }

  body.innerHTML = items.map((item, idx) => {
    const badgeClass = getCategoryBadgeClass(item.category);
    return `
      <tr>
        <td style="color:#64748b;">${idx + 1}</td>
        <td><b>${escapeMenuHTML(item.formatted_date || item.expense_date)}</b></td>
        <td>
          <span class="cat-badge ${badgeClass}">${escapeMenuHTML(item.category)}</span>
        </td>
        <td>${escapeMenuHTML(item.description || '-')}</td>
        <td class="tr" style="font-weight:600;">${formatRupiahVal(item.amount)}</td>
        <td style="text-align:center;">
          <div style="display:inline-flex;gap:6px;">
            <button type="button" class="btn-action-edit" onclick="openExpenseModal(${item.id})">
              Edit
            </button>
            <button type="button" class="btn-action-delete" onclick="openDeleteExpenseModal(${item.id})">
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (foot) foot.style.display = '';
  if (footTotal) footTotal.textContent = formatRupiahVal(totalAmount);
}

// ─── Modal Form Tambah / Edit ────────────────────────────────────────────────
function openExpenseModal(id = null) {
  const modal = document.getElementById('expenseModal');
  const title = document.getElementById('expenseModalTitle');
  const errEl = document.getElementById('expenseModalError');
  const editIdEl = document.getElementById('expEditId');
  const dateEl = document.getElementById('expInputDate');
  const catEl = document.getElementById('expInputCategory');
  const amtEl = document.getElementById('expInputAmount');
  const descEl = document.getElementById('expInputDescription');

  if (!modal) return;
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  if (id) {
    const item = expenseList.find(x => x.id === id);
    if (!item) return;

    if (title) title.textContent = 'Edit Pengeluaran';
    if (editIdEl) editIdEl.value = item.id;
    if (dateEl) dateEl.value = item.expense_date;
    if (catEl) catEl.value = item.category;
    if (amtEl) {
      amtEl.value = Number(item.amount).toLocaleString('id-ID');
    }
    if (descEl) descEl.value = item.description === '-' ? '' : (item.description || '');
  } else {
    if (title) title.textContent = 'Tambah Pengeluaran';
    if (editIdEl) editIdEl.value = '';
    if (dateEl) dateEl.value = getLocalTodayStr();
    if (catEl) catEl.value = '';
    if (amtEl) amtEl.value = '';
    if (descEl) descEl.value = '';
  }

  modal.style.display = 'flex';
  if (amtEl && !id) setTimeout(() => amtEl.focus(), 100);
}

function closeExpenseModal() {
  const modal = document.getElementById('expenseModal');
  if (modal) modal.style.display = 'none';
}

function formatExpenseAmount(input) {
  const num = parseCurrencyNumber(input.value);
  input.value = num > 0 ? num.toLocaleString('id-ID') : '';
}

async function saveExpense(event) {
  event.preventDefault();

  const errEl = document.getElementById('expenseModalError');
  const saveBtn = document.getElementById('btnSaveExpense');
  const editId = document.getElementById('expEditId')?.value;
  const dateVal = document.getElementById('expInputDate')?.value;
  const catVal = document.getElementById('expInputCategory')?.value;
  const amtVal = parseCurrencyNumber(document.getElementById('expInputAmount')?.value);
  const descVal = document.getElementById('expInputDescription')?.value?.trim();

  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  if (!dateVal) {
    showModalError('Tanggal pengeluaran wajib diisi.');
    return;
  }
  if (!catVal) {
    showModalError('Kategori pengeluaran wajib dipilih.');
    return;
  }
  if (!amtVal || amtVal <= 0) {
    showModalError('Jumlah pengeluaran wajib lebih dari 0.');
    return;
  }

  const payload = {
    expense_date: dateVal,
    category: catVal,
    amount: amtVal,
    description: descVal || null
  };

  const isEdit = Boolean(editId);
  const url = isEdit ? `${getExpenseBaseUrl()}/${editId}` : getExpenseStoreUrl();
  const method = isEdit ? 'PUT' : 'POST';

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Menyimpan…';
    }

    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.errors ? Object.values(data.errors)[0][0] : (data.message || 'Gagal menyimpan pengeluaran.');
      showModalError(msg);
      return;
    }

    closeExpenseModal();
    showExpenseAlert(data.message || (isEdit ? 'Pengeluaran berhasil diperbarui.' : 'Pengeluaran berhasil dicatat.'));
    await loadExpenses();

  } catch (err) {
    console.error(err);
    showModalError('Terjadi kesalahan jaringan: ' + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Simpan';
    }
  }
}

function showModalError(msg) {
  const errEl = document.getElementById('expenseModalError');
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.style.display = 'block';
}

// ─── Modal Konfirmasi Hapus ──────────────────────────────────────────────────
function openDeleteExpenseModal(id) {
  const item = expenseList.find(x => x.id === id);
  if (!item) return;

  deletingId = id;
  const modal = document.getElementById('deleteExpenseModal');
  const desc = document.getElementById('deleteExpenseDesc');

  if (desc) {
    desc.innerHTML = `Yakin ingin menghapus pengeluaran <b>${escapeMenuHTML(item.category)}</b> sebesar <b>${formatRupiahVal(item.amount)}</b> tanggal <b>${escapeMenuHTML(item.formatted_date || item.expense_date)}</b>?`;
  }

  if (modal) modal.style.display = 'flex';
}

function closeDeleteExpenseModal() {
  deletingId = null;
  const modal = document.getElementById('deleteExpenseModal');
  if (modal) modal.style.display = 'none';
}

async function confirmDeleteExpense() {
  if (!deletingId) return;

  const btn = document.getElementById('btnConfirmDeleteExpense');
  const url = `${getExpenseBaseUrl()}/${deletingId}`;

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Menghapus…';
    }

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal menghapus pengeluaran.');
    }

    closeDeleteExpenseModal();
    showExpenseAlert(data.message || 'Pengeluaran berhasil dihapus.');
    await loadExpenses();

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Ya, Hapus';
    }
  }
}

// ─── Notifikasi Alert Inline ─────────────────────────────────────────────────
function showExpenseAlert(msg, isError = false) {
  const el = document.getElementById('expenseAlert');
  if (!el) return;

  el.textContent = msg;
  el.style.display = 'block';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.fontWeight = '500';
  el.style.fontSize = '13.5px';
  el.style.background = isError ? '#fee2e2' : '#dcfce7';
  el.style.color = isError ? '#991b1b' : '#166534';
  el.style.border = `1px solid ${isError ? '#f87171' : '#86efac'}`;

  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.style.display = 'none';
    el.textContent = '';
  }, 4500);
}

// Ekspor ke window agar dapat dipanggil dari event inline HTML
window.renderPengeluaran = renderPengeluaran;
window.loadExpenses = loadExpenses;
window.onExpensePresetChange = onExpensePresetChange;
window.onExpenseSearchChange = onExpenseSearchChange;
window.resetExpenseFilters = resetExpenseFilters;
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.formatExpenseAmount = formatExpenseAmount;
window.saveExpense = saveExpense;
window.openDeleteExpenseModal = openDeleteExpenseModal;
window.closeDeleteExpenseModal = closeDeleteExpenseModal;
window.confirmDeleteExpense = confirmDeleteExpense;
