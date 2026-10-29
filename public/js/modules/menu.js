/**
 * Adem Ayem - Menu Management Module
 * Pengelolaan katalog menu (CRUD menu, upload gambar, emoji picker, kode menu).
 */

const EMOJIS = ['🍚', '🍜', '🍗', '🍔', '🍟', '🥗', '🍕', '🥤', '☕', '🧋', '🍵', '🧃'];
let menuEmoji = '🍽️';
let editingMenuId = null;
let dbMenus = [];

// Kode menu otomatis dari kategori (mis. NAS-01, MIN-02)
function genMenuCode(category, menu) {
  const pre = (category || 'MNU').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  let n = 1, code;
  do {
    code = pre + '-' + String(n).padStart(2, '0');
    n++;
  } while (menu.some(p => p.code === code));
  return code;
}

function ensureMenuCodes() {
  const menu = getMenu();
  let changed = false;
  menu.forEach(p => {
    if (!p.code) {
      p.code = genMenuCode(p.category, menu);
      changed = true;
    }
  });
  if (changed) setMenu(menu);
}

function menuHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
  };
}

function menuUrl(action, id = null) {
  const page = document.getElementById('menuPage');
  if (!page) {
    throw new Error('Elemen menuPage tidak ditemukan di Blade.');
  }

  if (action === 'list') return page.dataset.listUrl;
  if (action === 'store') return page.dataset.storeUrl;
  if (action === 'recipe') return `${page.dataset.recipeUrl || '/menu'}/${id}/recipe`;

  const base = action === 'update'
    ? page.dataset.updateUrl
    : page.dataset.deleteUrl;

  return `${base}/${id}`;
}

function buildEmojiPick() {
  const picker = document.getElementById('emojiPick');
  if (!picker) return;

  picker.innerHTML = EMOJIS.map(emoji => `
    <span
      class="${emoji === menuEmoji ? 'sel' : ''}"
      style="cursor:pointer"
      onclick="pickEmoji('${emoji}')"
    >${emoji}</span>
  `).join('');
}

function pickEmoji(emoji) {
  menuEmoji = emoji;
  buildEmojiPick();
}

function openMenuModal(id = null) {
  const form = document.getElementById('menuForm');
  if (!form) {
    alert('Form menu tidak ditemukan.');
    return;
  }

  editingMenuId = id;
  menuEmoji = '🍽️';
  form.reset();

  document.getElementById('menuModalTitle').textContent = id ? 'Ubah Menu' : 'Tambah Menu';
  document.getElementById('mSaveBtn').textContent = id ? 'Update' : 'Simpan';
  document.getElementById('mCode').value = '';

  buildEmojiPick();
  document.getElementById('menuModal').style.display = 'flex';

  if (id) {
    const menu = dbMenus.find(item => Number(item.id_menu) === Number(id));
    if (!menu) {
      alert('Data menu tidak ditemukan.');
      closeMenuModal();
      return;
    }

    document.getElementById('mCode').value = menu.kode_menu || menu.code || ('MENU-' + String(menu.id_menu).padStart(3, '0'));
    document.getElementById('mName').value = menu.name || '';
    document.getElementById('mCat').value = String(menu.categories_id_categorie ?? '');
    document.getElementById('mPrice').value = menu.price ?? '';

    const description = document.getElementById('mDescription');
    if (description) {
      description.value = menu.description || '';
    }

    menuEmoji = menu.image || '🍽️';
    buildEmojiPick();
  }
}

function closeMenuModal() {
  const modal = document.getElementById('menuModal');
  if (modal) {
    modal.style.display = 'none';
  }
  editingMenuId = null;
}

async function renderMenuAdmin() {
  const body = document.getElementById('menuBody');
  if (!body || !document.getElementById('menuPage')) return;

  body.innerHTML = '<tr><td colspan="6">Memuat data menu...</td></tr>';

  try {
    const response = await fetch(menuUrl('list'), {
      headers: { 'Accept': 'application/json' }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal memuat menu.');
    }

    dbMenus = Array.isArray(result) ? result : (result.menus || []);

    const isOwner = (typeof SERVER_USER !== 'undefined') && (
      SERVER_USER.db_role === 'owner' ||
      SERVER_USER.role === 'superadmin' ||
      SERVER_USER.role === 'owner'
    );

    body.innerHTML = dbMenus.length
      ? dbMenus.map(menu => {
          const imageUrl = menu.image_url || null;
          const imageHTML = imageUrl
            ? `<img
                src="${escapeMenuHTML(imageUrl)}"
                alt="${escapeMenuHTML(menu.name)}"
                style="width:60px;height:50px;object-fit:cover;border-radius:8px;"
                onerror="this.style.display='none';this.nextElementSibling.style.display='inline';"
              >
              <span style="display:none;font-size:22px;">🍽️</span>`
            : '<span style="font-size:22px;">🍽️</span>';

          return `
            <tr>
              <td>${imageHTML}</td>
              <td style="font-family: inherit; font-size: 14px; font-weight: 500; letter-spacing: normal;">
                ${escapeMenuHTML(menu.kode_menu || menu.code || ('MENU-' + String(menu.id_menu).padStart(3, '0')))}
              </td>
              <td>${escapeMenuHTML(menu.name)}</td>
              <td>
                <span class="tag tag-menu">
                  ${escapeMenuHTML(menu.category?.name || '-')}
                </span>
              </td>
              <td>${rupiah(menu.price)}</td>
              <td class="row-actions">
                ${isOwner ? `
                  <button
                    type="button"
                    class="btn-recipe"
                    onclick="openRecipeModal(${Number(menu.id_menu)})"
                    title="Atur resep bahan baku untuk menu ini"
                  >Atur Resep</button>
                ` : ''}
                <button
                  type="button"
                  onclick="openMenuModal(${Number(menu.id_menu)})"
                >Ubah</button>
                <button
                  type="button"
                  class="del"
                  onclick="deleteMenu(${Number(menu.id_menu)})"
                >Hapus</button>
              </td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="6">Belum ada menu.</td></tr>';
  } catch (error) {
    body.innerHTML = `
      <tr>
        <td colspan="6">
          Gagal memuat menu: ${escapeMenuHTML(error.message)}
        </td>
      </tr>
    `;
  }
}

async function saveMenu(event) {
  if (event) event.preventDefault();

  const code = document.getElementById('mCode').value.trim();
  const name = document.getElementById('mName').value.trim();
  const categoryId = document.getElementById('mCat').value;
  const price = Number(document.getElementById('mPrice').value);
  const description = document.getElementById('mDescription')?.value.trim() || '';

  const imageInput = document.getElementById('mImage');
  const imageFile = imageInput?.files?.[0] || null;

  if (!code) {
    alert('Kode menu wajib diisi.');
    document.getElementById('mCode').focus();
    return;
  }

  if (!name || !categoryId || !Number.isInteger(price) || price < 1) {
    alert('Nama menu, kategori, dan harga wajib diisi dengan benar.');
    return;
  }

  if (imageFile && !['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
    alert('Foto harus berformat JPG, PNG, atau WEBP.');
    return;
  }

  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    alert('Ukuran foto maksimal 2 MB.');
    return;
  }

  const button = document.getElementById('mSaveBtn');
  button.disabled = true;

  const formData = new FormData();
  formData.append('kode_menu', code);
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', String(price));
  formData.append('categories_id_categorie', String(categoryId));

  if (imageFile) {
    formData.append('image', imageFile);
  }

  const isEditing = Boolean(editingMenuId);
  if (isEditing) {
    formData.append('_method', 'PUT');
  }

  try {
    const response = await fetch(
      isEditing ? menuUrl('update', editingMenuId) : menuUrl('store'),
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: formData
      }
    );

    const result = await response.json();
    if (!response.ok) {
      const message = result.errors
        ? Object.values(result.errors).flat().join('\n')
        : (result.message || 'Gagal menyimpan menu.');
      throw new Error(message);
    }

    closeMenuModal();

    const message = document.getElementById('menuMessage');
    if (message) {
      message.textContent = result.message || 'Menu berhasil disimpan.';
    }

    await renderMenuAdmin();
  } catch (error) {
    alert(error.message || 'Terjadi kesalahan saat menyimpan menu.');
  } finally {
    button.disabled = false;
  }
}

async function deleteMenu(id) {
  const menu = dbMenus.find(item => Number(item.id_menu) === Number(id));
  if (!menu) {
    alert('Data menu tidak ditemukan.');
    return;
  }

  const modal = document.getElementById('deleteMenuModal');
  const nameElement = document.getElementById('deleteMenuName');
  const confirmButton = document.getElementById('confirmDeleteMenu');

  if (!modal || !nameElement || !confirmButton) {
    alert('Modal konfirmasi hapus belum tersedia.');
    return;
  }

  nameElement.textContent = menu.name;
  modal.style.display = 'flex';

  confirmButton.onclick = async function () {
    confirmButton.disabled = true;
    try {
      const response = await fetch(menuUrl('delete', id), {
        method: 'DELETE',
        headers: menuHeaders()
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus menu.');
      }

      modal.style.display = 'none';

      const message = document.getElementById('menuMessage');
      if (message) {
        message.textContent = result.message || 'Menu berhasil dihapus.';
      }

      await renderMenuAdmin();
    } catch (error) {
      alert(error.message || 'Terjadi kesalahan saat menghapus menu.');
    } finally {
      confirmButton.disabled = false;
    }
  };
}

function closeDeleteMenuModal() {
  const modal = document.getElementById('deleteMenuModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/*
|--------------------------------------------------------------------------
| Pengaturan Resep Menu (Owner / Superadmin)
|--------------------------------------------------------------------------
*/
let currentRecipeMenuId = null;
let currentRecipeMenu = null;
let recipeIngredients = [];
let availableStockItems = [];
let initialRecipeSnapshot = null;

function getRecipeSnapshot(ingredients) {
  return (ingredients || [])
    .map(item => ({
      id_stock_item: Number(item.id_stock_item),
      quantity_required: parseFloat(item.quantity_required) || 0
    }))
    .filter(item => item.id_stock_item > 0)
    .sort((a, b) => a.id_stock_item - b.id_stock_item);
}

function isRecipeChanged() {
  if (initialRecipeSnapshot === null) return false;
  const current = getRecipeSnapshot(recipeIngredients);
  if (current.length !== initialRecipeSnapshot.length) return true;
  for (let i = 0; i < current.length; i++) {
    if (current[i].id_stock_item !== initialRecipeSnapshot[i].id_stock_item) {
      return true;
    }
    if (Math.abs(current[i].quantity_required - initialRecipeSnapshot[i].quantity_required) > 0.0001) {
      return true;
    }
  }
  return false;
}

function updateSaveRecipeButtonState() {
  const saveBtn = document.getElementById('btnSaveRecipe');
  if (!saveBtn) return;
  const changed = isRecipeChanged();
  saveBtn.disabled = !changed;
}

function showRecipeAlert(type, message) {
  const alertEl = document.getElementById('recipeAlert');
  if (!alertEl) return;
  alertEl.style.display = 'block';
  if (type === 'error') {
    alertEl.style.background = '#fef2f2';
    alertEl.style.color = '#991b1b';
    alertEl.style.border = '1px solid #fecaca';
  } else if (type === 'success') {
    alertEl.style.background = '#f0fdf4';
    alertEl.style.color = '#166534';
    alertEl.style.border = '1px solid #bbf7d0';
  } else {
    alertEl.style.background = '#eff6ff';
    alertEl.style.color = '#1e40af';
    alertEl.style.border = '1px solid #bfdbfe';
  }
  alertEl.textContent = message;
}

function clearRecipeAlert() {
  const alertEl = document.getElementById('recipeAlert');
  if (alertEl) {
    alertEl.style.display = 'none';
    alertEl.textContent = '';
  }
}

async function openRecipeModal(menuId) {
  currentRecipeMenuId = menuId;
  currentRecipeMenu = null;
  recipeIngredients = [];
  availableStockItems = [];
  initialRecipeSnapshot = null;

  clearRecipeAlert();

  const modal = document.getElementById('recipeModal');
  if (!modal) return;
  modal.style.display = 'flex';

  const nameEl = document.getElementById('recipeMenuName');
  const codeEl = document.getElementById('recipeMenuCode');
  const tbody = document.getElementById('recipeTableBody');
  const stockSelect = document.getElementById('recipeStockSelect');
  const qtyInput = document.getElementById('recipeQtyInput');
  const unitDisplay = document.getElementById('recipeUnitDisplay');
  const saveBtn = document.getElementById('btnSaveRecipe');

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Simpan Resep';
  }

  if (nameEl) nameEl.textContent = 'Memuat...';
  if (codeEl) codeEl.textContent = '...';
  if (stockSelect) stockSelect.innerHTML = '<option value="">-- Memuat Bahan Baku --</option>';
  if (qtyInput) qtyInput.value = '';
  if (unitDisplay) unitDisplay.textContent = '-';
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px; color:#64748b;">Memuat data resep...</td></tr>';
  }

  try {
    const response = await fetch(menuUrl('recipe', menuId), {
      headers: menuHeaders()
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal memuat data resep.');
    }

    currentRecipeMenu = result.menu || {};
    if (nameEl) nameEl.textContent = currentRecipeMenu.name || '-';
    if (codeEl) codeEl.textContent = currentRecipeMenu.kode_menu || currentRecipeMenu.code || `MENU-${String(menuId).padStart(3, '0')}`;

    availableStockItems = Array.isArray(result.available_stock_items) ? result.available_stock_items : [];
    recipeIngredients = (result.ingredients || []).map(item => ({
      id_menu_ingredient: item.id_menu_ingredient || null,
      id_stock_item: Number(item.id_stock_item),
      name: item.name,
      unit: item.unit,
      quantity_required: Number(item.quantity_required)
    }));

    initialRecipeSnapshot = getRecipeSnapshot(recipeIngredients);

    populateRecipeStockSelect();
    renderRecipeTable();
    updateSaveRecipeButtonState();
  } catch (error) {
    showRecipeAlert('error', error.message || 'Terjadi kesalahan saat memuat resep.');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px; color:#dc2626;">${escapeMenuHTML(error.message)}</td></tr>`;
    }
    if (saveBtn) saveBtn.disabled = true;
  }
}

function closeRecipeModal() {
  const modal = document.getElementById('recipeModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentRecipeMenuId = null;
  currentRecipeMenu = null;
  recipeIngredients = [];
  availableStockItems = [];
  initialRecipeSnapshot = null;
  clearRecipeAlert();

  const saveBtn = document.getElementById('btnSaveRecipe');
  if (saveBtn) saveBtn.disabled = true;
}

function populateRecipeStockSelect() {
  const select = document.getElementById('recipeStockSelect');
  if (!select) return;

  const currentSelectedStockIds = new Set(recipeIngredients.map(i => Number(i.id_stock_item)));

  const options = ['<option value="">-- Pilih Bahan Baku --</option>'];
  availableStockItems.forEach(item => {
    const isAlreadyInRecipe = currentSelectedStockIds.has(Number(item.id_stock_item));
    options.push(`
      <option value="${item.id_stock_item}" ${isAlreadyInRecipe ? 'disabled' : ''}>
        ${escapeMenuHTML(item.name)} (${escapeMenuHTML(item.unit)})${isAlreadyInRecipe ? ' - Sudah dalam resep' : ''}
      </option>
    `);
  });

  select.innerHTML = options.join('');
  onRecipeStockSelectChange();
}

function onRecipeStockSelectChange() {
  const select = document.getElementById('recipeStockSelect');
  const unitDisplay = document.getElementById('recipeUnitDisplay');
  if (!select || !unitDisplay) return;

  const selectedId = Number(select.value);
  const found = availableStockItems.find(i => Number(i.id_stock_item) === selectedId);

  unitDisplay.textContent = found ? found.unit : '-';
}

function addRecipeIngredient() {
  clearRecipeAlert();

  const select = document.getElementById('recipeStockSelect');
  const qtyInput = document.getElementById('recipeQtyInput');

  if (!select || !qtyInput) return;

  const stockId = Number(select.value);
  if (!stockId) {
    showRecipeAlert('error', 'Pilih bahan baku dari data Stok Barang terlebih dahulu.');
    select.focus();
    return;
  }

  const stockItem = availableStockItems.find(i => Number(i.id_stock_item) === stockId);
  if (!stockItem) {
    showRecipeAlert('error', 'Data bahan baku tidak valid.');
    return;
  }

  // Cegah bahan baku yang sama dimasukkan dua kali dalam resep
  if (recipeIngredients.some(i => Number(i.id_stock_item) === stockId)) {
    showRecipeAlert('error', `Bahan baku "${stockItem.name}" sudah ada dalam resep menu ini.`);
    return;
  }

  const qty = parseFloat(qtyInput.value);
  if (isNaN(qty) || qty <= 0) {
    showRecipeAlert('error', 'Jumlah bahan baku harus berupa angka lebih besar dari nol.');
    qtyInput.focus();
    return;
  }

  recipeIngredients.push({
    id_stock_item: stockItem.id_stock_item,
    name: stockItem.name,
    unit: stockItem.unit,
    quantity_required: qty
  });

  // Reset input form
  select.value = '';
  qtyInput.value = '';
  onRecipeStockSelectChange();

  populateRecipeStockSelect();
  renderRecipeTable();
  updateSaveRecipeButtonState();
  showRecipeAlert('success', `Bahan "${stockItem.name}" berhasil ditambahkan ke daftar.`);
}

function updateRecipeQuantity(stockItemId, newQty) {
  clearRecipeAlert();
  const parsed = parseFloat(newQty);
  const item = recipeIngredients.find(i => Number(i.id_stock_item) === Number(stockItemId));
  if (item) {
    item.quantity_required = isNaN(parsed) ? 0 : parsed;
  }
  updateSaveRecipeButtonState();
}

function removeRecipeIngredient(stockItemId) {
  clearRecipeAlert();
  const found = recipeIngredients.find(i => Number(i.id_stock_item) === Number(stockItemId));
  const itemName = found ? found.name : 'Bahan';

  recipeIngredients = recipeIngredients.filter(i => Number(i.id_stock_item) !== Number(stockItemId));

  populateRecipeStockSelect();
  renderRecipeTable();
  updateSaveRecipeButtonState();
  showRecipeAlert('info', `Bahan "${itemName}" dihapus dari daftar resep.`);
}

function renderRecipeTable() {
  const tbody = document.getElementById('recipeTableBody');
  if (!tbody) return;

  if (!recipeIngredients.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:18px; color:#64748b;">
          Belum ada bahan baku yang diatur untuk resep menu ini.<br>
          <small style="color:#94a3b8;">Pilih bahan baku dari form di atas untuk menambahkannya ke resep.</small>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recipeIngredients.map((item, index) => `
    <tr>
      <td style="text-align:center; font-weight:500; color:#64748b;">${index + 1}</td>
      <td style="font-weight:600; color:#1e293b;">${escapeMenuHTML(item.name)}</td>
      <td style="text-align:center;">
        <input
          type="number"
          step="any"
          min="0.001"
          value="${item.quantity_required}"
          oninput="updateRecipeQuantity(${Number(item.id_stock_item)}, this.value)"
          onchange="updateRecipeQuantity(${Number(item.id_stock_item)}, this.value)"
          style="width:90px; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; text-align:right; font-size:13px;"
          title="Ubah jumlah bahan baku"
        >
      </td>
      <td style="text-align:center;">
        <span class="tag" style="background:#f1f5f9; color:#475569; font-size:12px;">
          ${escapeMenuHTML(item.unit)}
        </span>
      </td>
      <td style="text-align:center;">
        <button
          type="button"
          class="del"
          onclick="removeRecipeIngredient(${Number(item.id_stock_item)})"
          style="padding:5px 10px; font-size:12px; border-radius:4px;"
          title="Hapus dari resep"
        >
          Hapus
        </button>
      </td>
    </tr>
  `).join('');
}

async function saveRecipe() {
  clearRecipeAlert();

  if (!currentRecipeMenuId) {
    showRecipeAlert('error', 'Menu tidak dipilih.');
    return;
  }

  if (!isRecipeChanged()) {
    showRecipeAlert('info', 'Tidak ada perubahan pada resep.');
    return;
  }

  // Validasi: jumlah bahan harus lebih besar dari 0
  for (const item of recipeIngredients) {
    const qty = parseFloat(item.quantity_required);
    if (isNaN(qty) || qty <= 0) {
      showRecipeAlert('error', `Jumlah bahan "${item.name}" harus lebih besar dari nol.`);
      return;
    }
  }

  // Validasi duplikasi
  const stockIds = recipeIngredients.map(i => Number(i.id_stock_item));
  if (new Set(stockIds).size !== stockIds.length) {
    showRecipeAlert('error', 'Terdapat bahan baku duplikat dalam resep.');
    return;
  }

  const saveBtn = document.getElementById('btnSaveRecipe');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';
  }

  try {
    const payload = {
      ingredients: recipeIngredients.map(i => ({
        id_stock_item: Number(i.id_stock_item),
        quantity_required: Number(i.quantity_required)
      }))
    };

    const response = await fetch(menuUrl('recipe', currentRecipeMenuId), {
      method: 'POST',
      headers: menuHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result.errors
        ? Object.values(result.errors).flat().join('\n')
        : (result.message || 'Gagal menyimpan resep menu.');
      throw new Error(message);
    }

    recipeIngredients = (result.ingredients || []).map(item => ({
      id_menu_ingredient: item.id_menu_ingredient || null,
      id_stock_item: Number(item.id_stock_item),
      name: item.name,
      unit: item.unit,
      quantity_required: Number(item.quantity_required)
    }));

    // Perbarui snapshot awal sesuai data terbaru agar tombol Simpan nonaktif
    initialRecipeSnapshot = getRecipeSnapshot(recipeIngredients);
    closeRecipeModal();

    populateRecipeStockSelect();
    renderRecipeTable();
    updateSaveRecipeButtonState();

    // Notifikasi keberhasilan HANYA ditampilkan di dalam modal
    showRecipeAlert('success', result.message || 'Resep menu berhasil disimpan!');
  } catch (error) {
    showRecipeAlert('error', error.message || 'Terjadi kesalahan saat menyimpan resep.');
    updateSaveRecipeButtonState();
  } finally {
    if (saveBtn) {
      saveBtn.textContent = 'Simpan Resep';
    }
  }
}
