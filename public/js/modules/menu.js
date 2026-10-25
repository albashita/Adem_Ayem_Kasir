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
  document.getElementById('mCode').value = id ? '' : 'Otomatis';

  buildEmojiPick();
  document.getElementById('menuModal').style.display = 'flex';

  if (id) {
    const menu = dbMenus.find(item => Number(item.id_menu) === Number(id));
    if (!menu) {
      alert('Data menu tidak ditemukan.');
      closeMenuModal();
      return;
    }

    document.getElementById('mCode').value = 'MENU-' + String(menu.id_menu).padStart(3, '0');
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
                MENU-${String(menu.id_menu).padStart(3, '0')}
              </td>
              <td>${escapeMenuHTML(menu.name)}</td>
              <td>
                <span class="tag tag-menu">
                  ${escapeMenuHTML(menu.category?.name || '-')}
                </span>
              </td>
              <td>${rupiah(menu.price)}</td>
              <td class="row-actions">
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

  const name = document.getElementById('mName').value.trim();
  const categoryId = document.getElementById('mCat').value;
  const price = Number(document.getElementById('mPrice').value);
  const description = document.getElementById('mDescription')?.value.trim() || '';

  const imageInput = document.getElementById('mImage');
  const imageFile = imageInput?.files?.[0] || null;

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
