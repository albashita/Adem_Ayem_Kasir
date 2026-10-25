/**
 * Adem Ayem - Stok & Inventory Module
 * Pengelolaan inventaris bahan baku, barang masuk/keluar, log pergerakan stok, dan filter tanggal.
 */

let currentStokCategory = 'makanan';
let editingInvId = null;
let stockInId = null;

function selectStokCat(c) {
  currentStokCategory = c;
  renderStok();
}

function openTambahStokModal() {
  editingInvId = null;

  document.getElementById('stokFormTitle').textContent =
    'Tambah Barang ' + (CAT_LABEL[currentStokCategory] || currentStokCategory) + ' Baru';

  document.getElementById('iName').value = '';
  document.getElementById('iUnit').value = '';
  document.getElementById('iStock').value = '';
  document.getElementById('iCost').value = '';
  document.getElementById('iCost').disabled = false;
  document.getElementById('iSaveBtn').textContent = 'Simpan';

  document.getElementById('stokItemModal').style.display = 'flex';
}

function closeStokItemModal() {
  document.getElementById('stokItemModal').style.display = 'none';
}

function addStockLog(itemId, type, qty, note, cost) {
  const log = getLog();
  log.push({
    id: 'l' + Date.now() + Math.floor(Math.random() * 1000),
    date: new Date().toISOString(),
    itemId,
    type,
    qty,
    cost: Number(cost) || 0,
    note: note || ''
  });
  setLog(log);
}

function saveInventoryItem() {
  const name = document.getElementById('iName').value.trim();
  const unit = document.getElementById('iUnit').value.trim();
  const stock = Number(document.getElementById('iStock').value) || 0;
  const cost = Number(document.getElementById('iCost').value) || 0;

  if (!name || !unit) {
    alert('Nama barang dan satuan wajib diisi.');
    return;
  }
  if (stock < 0 || cost < 0) {
    alert('Stok dan harga tidak boleh minus.');
    return;
  }

  let inv = getInv();
  if (editingInvId) {
    const old = inv.find(p => p.id === editingInvId);
    const diff = old ? stock - old.stock : 0;
    inv = inv.map(p => p.id === editingInvId ? { ...p, name, unit, stock } : p);
    if (diff !== 0) addStockLog(editingInvId, diff > 0 ? 'masuk' : 'keluar', Math.abs(diff), 'Koreksi stok');
    editingInvId = null;
    document.getElementById('iSaveBtn').textContent = 'Simpan';
    document.getElementById('iCost').disabled = false;
  } else {
    const id = 'i' + Date.now();
    inv.push({ id, name, category: currentStokCategory, unit, stock });
    if (stock > 0) addStockLog(id, 'masuk', stock, 'Stok awal', cost);
  }

  setInv(inv);
  document.getElementById('iName').value = '';
  document.getElementById('iUnit').value = '';
  document.getElementById('iStock').value = '';
  document.getElementById('iCost').value = '';
  renderStok();
  closeStokItemModal();
}

function toggleStokCustomDates() {
  const filter = document.getElementById('stokLogFilter');
  const dates = document.getElementById('stokCustomDates');
  if (!filter || !dates) return;

  dates.style.display = filter.value === 'custom' ? 'flex' : 'none';
}

function getStokFilterRange() {
  const today = new Date();
  const toLocalDate = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const filter = document.getElementById('stokLogFilter')?.value || 'today';
  let from = toLocalDate(today);
  let to = from;

  if (filter === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    from = toLocalDate(start);
  } else if (filter === 'month') {
    from = toLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
  } else if (filter === 'custom') {
    from = document.getElementById('stokDateFrom')?.value || from;
    to = document.getElementById('stokDateTo')?.value || to;
  } else if (filter === 'all') {
    from = '0000-01-01';
    to = '9999-12-31';
  }

  return { from, to };
}

function renderStok() {
  document.querySelectorAll('#stokCatTabs .cat-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.c === currentStokCategory)
  );

  const catLabel = CAT_LABEL[currentStokCategory] || currentStokCategory;
  const listTitle = document.getElementById('stokListTitle');
  if (listTitle) {
    listTitle.textContent = 'Daftar & Status Stok ' + catLabel;
  }

  const inv = getInv().filter(p => p.category === currentStokCategory);
  const statusBody = document.getElementById('stokStatusBody');
  if (statusBody) {
    statusBody.innerHTML = inv.length
      ? inv.map(p => {
          const status = p.stock <= 0
            ? '<span style="color:var(--danger);font-weight:600">Habis</span>'
            : p.stock <= 5
              ? '<span style="color:var(--accent);font-weight:600">Menipis</span>'
              : '<span style="color:#3E7A52;font-weight:600">Aman</span>';

          return `<tr>
            <td>${escapeMenuHTML(p.name)}</td>
            <td>
              <div class="stock-adjust">
                <button onclick="quickAdjust('${p.id}',-1)">−</button>
                <span class="val">${p.stock}</span>
                <button onclick="openStockIn('${p.id}')">+</button>
              </div>
            </td>
            <td>${escapeMenuHTML(p.unit)}</td>
            <td>${status}</td>
            <td class="row-actions">
              <button onclick="editInventoryItem('${p.id}')">Ubah</button>
              <button class="del" onclick="deleteInventoryItem('${p.id}')">Hapus</button>
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="5" class="empty">Belum ada barang ${catLabel.toLowerCase()}</td></tr>`;
  }

  const allInv = getInv();
  const { from, to } = getStokFilterRange();

  const log = getLog().filter(l => {
    const item = allInv.find(x => x.id === l.itemId);
    if (!item || item.category !== currentStokCategory) return false;

    const date = new Date(l.date);
    if (Number.isNaN(date.getTime())) return false;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const logDate = `${y}-${m}-${d}`;

    return logDate >= from && logDate <= to;
  }).slice().reverse();

  const logBody = document.getElementById('stokLogBody');
  if (logBody) {
    logBody.innerHTML = log.length
      ? log.map(l => {
          const item = allInv.find(x => x.id === l.itemId);
          return `<tr>
            <td>${new Date(l.date).toLocaleString('id-ID')}</td>
            <td>${item ? escapeMenuHTML(item.name) : '-'}</td>
            <td>${l.type === 'masuk' ? 'Masuk' : 'Keluar'}</td>
            <td>${l.qty}</td>
            <td>${item ? escapeMenuHTML(item.unit) : '-'}</td>
            <td>${l.type === 'masuk' && l.cost > 0 ? rupiah(l.cost) : '-'}</td>
            <td>${escapeMenuHTML(l.note || '-')}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="7" class="empty">Tidak ada riwayat pada periode ini</td></tr>';
  }

  const totalCost = log.reduce((sum, l) => {
    return l.type === 'masuk' ? sum + (Number(l.cost) || 0) : sum;
  }, 0);

  const spendLabel = document.getElementById('stokSpendToday');
  if (spendLabel) {
    spendLabel.textContent = rupiah(totalCost);
  }

  const spendDescription = document.getElementById('stokSpendDescription');
  if (spendDescription) {
    spendDescription.textContent = `Total pembelian stok (${from} s.d. ${to}): `;
  }
}

function editInventoryItem(id) {
  const p = getInv().find(x => x.id === id);
  if (!p) return;

  document.getElementById('iName').value = p.name;
  document.getElementById('iUnit').value = p.unit;
  document.getElementById('iStock').value = p.stock;
  document.getElementById('iCost').value = '';
  document.getElementById('iCost').disabled = true;
  editingInvId = id;
  document.getElementById('iSaveBtn').textContent = 'Update';
  document.getElementById('stokFormTitle').textContent = 'Ubah Barang';
  document.getElementById('stokItemModal').style.display = 'flex';
}

function deleteInventoryItem(id) {
  if (!confirm('Hapus barang stok ini? Riwayat terkait akan tetap tersimpan.')) return;
  setInv(getInv().filter(p => p.id !== id));
  renderStok();
}

function quickAdjust(id, delta) {
  let inv = getInv();
  const item = inv.find(p => p.id === id);
  if (!item) return;
  if (delta < 0 && item.stock <= 0) return;

  inv = inv.map(p => p.id === id ? { ...p, stock: Math.round((p.stock + delta) * 1000) / 1000 } : p);
  setInv(inv);
  addStockLog(id, delta > 0 ? 'masuk' : 'keluar', 1, '');
  renderStok();
}

function openStockIn(id) {
  const it = getInv().find(p => p.id === id);
  if (!it) return;

  stockInId = id;
  document.getElementById('stockInName').textContent = it.name + ' (' + it.unit + ')';
  document.getElementById('stockInQty').value = '1';
  document.getElementById('stockInCost').value = '';
  document.getElementById('stockInError').textContent = '';
  document.getElementById('stockInModal').style.display = 'flex';
  document.getElementById('stockInQty').focus();
}

function closeStockIn() {
  document.getElementById('stockInModal').style.display = 'none';
  stockInId = null;
}

function confirmStockIn() {
  const qty = Number(document.getElementById('stockInQty').value);
  const cost = Number(document.getElementById('stockInCost').value) || 0;
  const err = document.getElementById('stockInError');

  if (!(qty > 0)) {
    err.textContent = 'Jumlah masuk harus lebih dari 0.';
    return;
  }
  if (cost < 0) {
    err.textContent = 'Harga tidak boleh minus.';
    return;
  }

  const inv = getInv().map(p => p.id === stockInId ? { ...p, stock: Math.round((p.stock + qty) * 1000) / 1000 } : p);
  setInv(inv);
  addStockLog(stockInId, 'masuk', qty, '', cost);
  closeStockIn();
  renderStok();
}
