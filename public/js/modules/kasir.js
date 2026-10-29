/**
 * Adem Ayem - Kasir & POS Module
 * Katalog menu POS, keranjang belanja, pembatasan stok berbasis resep bahan baku,
 * perhitungan diskon & pajak PB1 10%, serta penyimpanan pesanan.
 */

let cart = [];
let selectedOrderType = 'dine-in';
let appliedDiscount = 0;
let currentPosCategory = 'semua';
let posMenu = [];
const TAX_RATE = 0.10;

// Helper modal alert dengan fallback alert()
function triggerAlertModal(message, title = 'Perhatian') {
  if (typeof showAlertModal === 'function') {
    showAlertModal(message, title);
  } else {
    const alertModal = document.getElementById('alertModal');
    const msgEl = document.getElementById('alertModalMsg');
    const titleEl = document.getElementById('alertModalTitle');
    if (alertModal && msgEl) {
      msgEl.textContent = message;
      if (titleEl) titleEl.textContent = title;
      alertModal.style.display = 'flex';
    } else {
      alert(message);
    }
  }
}

function closeAlertModal() {
  const alertModal = document.getElementById('alertModal');
  if (alertModal) alertModal.style.display = 'none';
}

async function loadPosMenu() {
  const grid = document.getElementById('posProductGrid');
  const page = document.getElementById('kasirPage');
  if (!page) return;

  if (grid) grid.innerHTML = '<div class="empty">Memuat katalog menu & stok...</div>';
  try {
    const res = await fetch(page.dataset.menuUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Gagal memuat katalog menu.');
    const data = await res.json();
    posMenu = data.map(m => ({
      id: String(m.id),
      code: m.code,
      kode_menu: m.kode_menu || m.code,
      name: m.name,
      price: Number(m.price),
      category: m.category || 'Lainnya',
      has_recipe: Boolean(m.has_recipe),
      stock_estimate: m.stock_estimate !== null && m.stock_estimate !== undefined ? Number(m.stock_estimate) : null,
      image_url: m.image_url || null,
    }));
  } catch (e) {
    posMenu = [];
    if (grid) grid.innerHTML = '<div class="empty">' + escapeMenuHTML(e.message) + '</div>';
    return;
  }
  renderPOS();
}

/**
 * Endpoint polling / refresh estimasi stok terbaru tanpa me-reload seluruh katalog
 */
async function refreshStockEstimates() {
  const page = document.getElementById('kasirPage');
  if (!page || !page.dataset.stockUrl) return;

  try {
    const res = await fetch(page.dataset.stockUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return;
    const estimates = await res.json();

    const estimateMap = new Map();
    estimates.forEach(item => {
      estimateMap.set(String(item.id), {
        has_recipe: Boolean(item.has_recipe),
        stock_estimate: item.stock_estimate !== null && item.stock_estimate !== undefined ? Number(item.stock_estimate) : null,
      });
    });

    posMenu.forEach(menu => {
      if (estimateMap.has(menu.id)) {
        const est = estimateMap.get(menu.id);
        menu.has_recipe = est.has_recipe;
        menu.stock_estimate = est.stock_estimate;
      }
    });

    renderPOS();
  } catch (err) {
    console.warn('Gagal memperbarui estimasi stok:', err);
  }
}

function renderPOS() {
  const menu = posMenu;
  const cats = ['semua', ...new Set(menu.map(p => p.category))];

  const catTabs = document.getElementById('posCatTabs');
  if (catTabs) {
    catTabs.innerHTML = cats.map(c => `
      <button class="cat-tab ${c === currentPosCategory ? 'active' : ''}" onclick="selectPosCat('${c}')">
        ${c === 'semua' ? 'Semua' : escapeMenuHTML(c)}
      </button>
    `).join('');
  }

  const search = (document.getElementById('posSearch')?.value || '').toLowerCase();
  const filtered = menu.filter(p =>
    (currentPosCategory === 'semua' || p.category === currentPosCategory) &&
    (p.name.toLowerCase().includes(search) || (p.code || '').toLowerCase().includes(search))
  );

  const grid = document.getElementById('posProductGrid');
  if (grid) {
    grid.innerHTML = filtered.length
      ? filtered.map(p => {
          const isOutOfStock = p.has_recipe && p.stock_estimate === 0;
          let stockHtml = '';

          if (!p.has_recipe) {
            stockHtml = `<span class="stock-badge stock-norecipe">Tanpa resep</span>`;
          } else if (p.stock_estimate === 0) {
            stockHtml = `<span class="stock-badge stock-out">Stok Habis</span>`;
          } else if (p.stock_estimate <= 3) {
            stockHtml = `<span class="stock-badge stock-low">Tersedia: ${p.stock_estimate} porsi</span>`;
          } else {
            stockHtml = `<span class="stock-badge stock-ok">Tersedia: ${p.stock_estimate} porsi</span>`;
          }

          const cardClass = `prod-card ${isOutOfStock ? 'out-of-stock' : ''}`;
          const clickHandler = isOutOfStock
            ? `onclick="triggerAlertModal('Menu ${escapeMenuHTML(p.name)} sedang habis karena stok bahan baku tidak mencukupi.', 'Stok Habis')"`
            : `onclick="addToCart('${p.id}')"`;

          return `
            <div class="${cardClass}" ${clickHandler} title="${isOutOfStock ? 'Stok bahan baku habis' : 'Klik untuk tambah ke pesanan'}">
              <div class="code">${escapeMenuHTML(p.code)}</div>
              <div class="name">${escapeMenuHTML(p.name)}</div>
              <div class="price">${rupiah(p.price)}</div>
              <div class="stock">${stockHtml}</div>
            </div>
          `;
        }).join('')
      : `<div class="empty">Menu tidak ditemukan</div>`;
  }

  highlightOrderType();
  renderCart();
}

function selectPosCat(c) {
  currentPosCategory = c;
  renderPOS();
}

function highlightOrderType() {
  document.querySelectorAll('#orderTypeToggle button')
    .forEach(b => b.classList.toggle('sel', b.dataset.t === selectedOrderType));
}

function selectOrderType(t) {
  selectedOrderType = t;
  highlightOrderType();
}

function addToCart(id) {
  const p = posMenu.find(x => x.id === id);
  if (!p) return;

  // Jika menu memiliki resep dan stok habis, cegah penambahan
  if (p.has_recipe && p.stock_estimate === 0) {
    triggerAlertModal(`Menu "${p.name}" tidak dapat dipilih karena stok bahan baku habis.`, 'Stok Habis');
    return;
  }

  const existing = cart.find(c => c.id === id);
  const currentQty = existing ? existing.qty : 0;

  // Batasi jumlah pesanan agar tidak melebihi estimasi stok yang tersedia
  if (p.has_recipe && p.stock_estimate !== null && (currentQty + 1) > p.stock_estimate) {
    triggerAlertModal(`Stok bahan baku untuk menu "${p.name}" hanya cukup untuk ${p.stock_estimate} porsi. Jumlah pesanan tidak dapat ditambah lagi.`, 'Batas Stok Tercapai');
    return;
  }

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  }

  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;

  if (delta > 0) {
    const p = posMenu.find(x => x.id === id);
    if (p && p.has_recipe && p.stock_estimate !== null && (item.qty + delta) > p.stock_estimate) {
      triggerAlertModal(`Stok bahan baku untuk menu "${p.name}" hanya tersedia ${p.stock_estimate} porsi.`, 'Batas Stok Tercapai');
      return;
    }
  }

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
}

function cartSubtotal() {
  return cart.reduce((s, c) => s + c.price * c.qty, 0);
}

function computeTotals() {
  const sub = cartSubtotal();
  const disc = Math.min(appliedDiscount || 0, sub);
  const tax = Math.round(sub * TAX_RATE);
  return { sub, disc, tax, total: sub - disc + tax };
}

function applyDiscount() {
  const sub = cartSubtotal();
  let v = Number(document.getElementById('discountInput').value) || 0;
  if (v < 0) v = 0;
  if (v > sub) v = sub;
  appliedDiscount = v;
  renderCart();
}

function renderCart() {
  const body = document.getElementById('cartBody');
  if (!body) return;

  body.innerHTML = cart.length
    ? cart.map(c => `
        <div class="cart-item">
          <div>
            ${escapeMenuHTML(c.name)}<br>
            <span style="color:var(--muted);font-size:12px">${rupiah(c.price)} x ${c.qty} = ${rupiah(c.price * c.qty)}</span>
          </div>
          <div class="qty-ctrl">
            <button onclick="changeQty('${c.id}',-1)" title="Kurangi">−</button>
            <span style="margin:0 6px;min-width:20px;text-align:center;font-weight:600;">${c.qty}</span>
            <button onclick="changeQty('${c.id}',1)" title="Tambah">+</button>
            <button onclick="removeFromCart('${c.id}')" style="margin-left:6px;color:var(--danger);border:none;background:none;cursor:pointer" title="Hapus item">✕</button>
          </div>
        </div>
      `).join('')
    : '<div class="empty">Belum ada item pesanan</div>';

  const t = computeTotals();
  const subEl = document.getElementById('cartSubtotal');
  if (subEl) subEl.textContent = rupiah(t.sub);

  const taxEl = document.getElementById('cartTax');
  if (taxEl) taxEl.textContent = rupiah(t.tax);

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = rupiah(t.total);

  const discRow = document.getElementById('cartDiscountRow');
  if (discRow) discRow.style.display = t.disc > 0 ? 'flex' : 'none';

  const discEl = document.getElementById('cartDiscount');
  if (discEl) discEl.textContent = '- ' + rupiah(t.disc);
}

async function saveOrder() {
  if (!cart.length) {
    triggerAlertModal('Belum ada pesanan. Pilih menu terlebih dahulu.');
    return;
  }

  const btn = document.getElementById('saveOrderBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
  }

  try {
    const totals = computeTotals();
    const custName = document.getElementById('custName')?.value.trim() || '';
    const typeNow = selectedOrderType;

    const res = await fetch(document.getElementById('kasirPage').dataset.orderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      },
      body: JSON.stringify({
        customer_name: custName || null,
        service_type: typeNow,
        discount: totals.disc,
        items: cart.map(c => ({ menu_id: c.id, qty: c.qty }))
      })
    });

    const data = await res.json();
    if (!res.ok) {
      triggerAlertModal(
        data.errors ? Object.values(data.errors)[0][0] : (data.message || 'Gagal menyimpan pesanan.'),
        'Gagal'
      );
      return;
    }

    if (typeof showOrderSaved === 'function') {
      showOrderSaved({
        invoice: data.invoice_number || data.order_no || '-',
        type: typeNow,
        customer: custName,
        total: rupiah(totals.total)
      });
    }

    // Reset keranjang belanja setelah sukses simpan
    cart = [];
    appliedDiscount = 0;
    const discInput = document.getElementById('discountInput');
    if (discInput) discInput.value = '';
    const custInput = document.getElementById('custName');
    if (custInput) custInput.value = '';
    renderCart();

    // Perbarui estimasi stok katalog menu
    refreshStockEstimates();

  } catch (e) {
    console.error(e);
    triggerAlertModal('Terjadi kesalahan jaringan: ' + e.message, 'Gagal');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Simpan Pesanan';
    }
  }
}

// Inisialisasi otomatis jika berada di halaman kasir
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('kasirPage')) {
    loadPosMenu();
  }
});
