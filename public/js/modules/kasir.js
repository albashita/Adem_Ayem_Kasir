/**
 * Adem Ayem - Kasir & POS Module
 * Katalog menu POS, keranjang belanja, perhitungan diskon & pajak PB1 10%, serta penyimpanan pesanan.
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

  if (grid) grid.innerHTML = '<div class="empty">Memuat menu...</div>';
  try {
    const res = await fetch(page.dataset.menuUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Gagal memuat menu.');
    const data = await res.json();
    posMenu = data.map(m => ({
      id: String(m.id),
      code: m.code,
      name: m.name,
      price: Number(m.price),
      category: m.category || 'Lainnya'
    }));
  } catch (e) {
    posMenu = [];
    if (grid) grid.innerHTML = '<div class="empty">' + escapeMenuHTML(e.message) + '</div>';
    return;
  }
  renderPOS();
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
      ? filtered.map(p => `
          <div class="prod-card" onclick="addToCart('${p.id}')">
            <div class="code">${escapeMenuHTML(p.code)}</div>
            <div class="name">${escapeMenuHTML(p.name)}</div>
            <div class="price">${rupiah(p.price)}</div>
          </div>
        `).join('')
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
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
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
          <div>${escapeMenuHTML(c.name)}<br><span style="color:var(--muted);font-size:12px">${rupiah(c.price)} x ${c.qty}</span></div>
          <div class="qty-ctrl">
            <button onclick="changeQty('${c.id}',-1)">−</button>
            <span style="margin:0 6px">${c.qty}</span>
            <button onclick="changeQty('${c.id}',1)">+</button>
            <button onclick="removeFromCart('${c.id}')" style="margin-left:6px;color:var(--danger);border:none;background:none;cursor:pointer">✕</button>
          </div>
        </div>
      `).join('')
    : '<div class="empty">Belum ada item</div>';

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
  if (btn) btn.disabled = true;

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
        invoice: data.invoice_number || '-',
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
    renderCart();

  } catch (e) {
    console.error(e);
    triggerAlertModal('Terjadi kesalahan: ' + e.message, 'Gagal');
  } finally {
    if (btn) btn.disabled = false;
  }
}
