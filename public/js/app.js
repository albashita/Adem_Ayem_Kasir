const LSU='kasir_users', LSM='kasir_menu', LST='kasir_transactions', LSL='kasir_stocklog', LSI='kasir_inventory', LSS='kasir_session';
let cart=[], selectedPay='tunai', selectedOrderType='dine-in', appliedDiscount=0, currentPosCategory='semua', menuEmoji='🍽️', lastTrx=null;
const EMOJIS=['🍚','🍜','🍗','🍔','🍟','🥗','🍕','🥤','☕','🧋','🍵','🧃'];

function seedIfEmpty(){
  { const us=JSON.parse(localStorage.getItem(LSU)||'[]'); let ch=false; us.forEach(u=>{ if(u.username==='kasir'&&u.name==='Kasir Toko'){u.name='Adem Ayem';ch=true;} }); if(ch) localStorage.setItem(LSU,JSON.stringify(us)); }
  if(!localStorage.getItem(LSU)){
    localStorage.setItem(LSU, JSON.stringify([
      {id:'u1',name:'Super Admin',username:'superadmin',password:'super123',role:'superadmin'},
      {id:'u2',name:'Administrator',username:'administrator',password:'admin123',role:'administrator'},
      {id:'u3',name:'Adem Ayem',username:'kasir',password:'kasir123',role:'kasir'}
    ]));
  }
  if(!localStorage.getItem(LSM)){
    localStorage.setItem(LSM, JSON.stringify([
      {id:'m1',name:'Nasi Goreng',category:'Nasi',price:18000,stock:25,emoji:'🍚'},
      {id:'m2',name:'Mie Ayam',category:'Ayam',price:15000,stock:20,emoji:'🍜'},
      {id:'m3',name:'Ayam Geprek',category:'Ayam',price:20000,stock:4,emoji:'🍗'},
      {id:'m4',name:'Ikan Nila Bakar',category:'Ikan',price:28000,stock:12,emoji:'🐟'},
      {id:'m5',name:'Sayur Asem',category:'Sayur',price:12000,stock:18,emoji:'🥬'},
      {id:'m6',name:'Es Teh Manis',category:'Minuman',price:5000,stock:40,emoji:'🍵'},
      {id:'m7',name:'Es Jeruk',category:'Minuman',price:6000,stock:3,emoji:'🧃'},
      {id:'m8',name:'Kopi Susu',category:'Minuman',price:10000,stock:15,emoji:'☕'}
    ]));
  }
  if(!localStorage.getItem(LST)) localStorage.setItem(LST, JSON.stringify([]));
  if(!localStorage.getItem(LSL)) localStorage.setItem(LSL, JSON.stringify([]));
  if(!localStorage.getItem(LSI)){
    localStorage.setItem(LSI, JSON.stringify([
      {id:'i1',name:'Cabe',category:'makanan',unit:'kg',stock:1},
      {id:'i2',name:'Beras',category:'makanan',unit:'kg',stock:25},
      {id:'i3',name:'Sirup',category:'minuman',unit:'botol',stock:8},
      {id:'i4',name:'Es Batu',category:'minuman',unit:'kg',stock:15},
      {id:'i5',name:'Gas Elpiji',category:'gudang',unit:'tabung',stock:5},
      {id:'i6',name:'Galon Air',category:'gudang',unit:'galon',stock:10}
    ]));
  }
}
function getUsers(){return JSON.parse(localStorage.getItem(LSU)||'[]');}
function setUsers(u){localStorage.setItem(LSU, JSON.stringify(u));}
function getMenu(){return JSON.parse(localStorage.getItem(LSM)||'[]');}
function setMenu(m){localStorage.setItem(LSM, JSON.stringify(m));}
function getTrx(){return JSON.parse(localStorage.getItem(LST)||'[]');}
function setTrx(t){localStorage.setItem(LST, JSON.stringify(t));}
function getLog(){return JSON.parse(localStorage.getItem(LSL)||'[]');}
function setLog(l){localStorage.setItem(LSL, JSON.stringify(l));}
function getInv(){return JSON.parse(localStorage.getItem(LSI)||'[]');}
function setInv(i){localStorage.setItem(LSI, JSON.stringify(i));}
function rupiah(n){return 'Rp ' + Number(n).toLocaleString('id-ID');}
function currentUser(){const id=sessionStorage.getItem(LSS); return getUsers().find(u=>u.id===id);}

const NAV=[
  {key:'dashboard',label:'Dashboard',roles:['superadmin','administrator']},
  {key:'pengguna',label:'Pengguna & Akses',roles:['superadmin']},
  {key:'menu',label:'Kelola Menu',roles:['superadmin']},
  {key:'stok',label:'Stok Barang',roles:['administrator']},
  {key:'kasir',label:'Kasir',roles:['kasir']},
  {key:'laporan',label:'Laporan',roles:['superadmin','administrator','kasir']},
  {key:'profil',label:'Profil Saya',roles:['superadmin','administrator','kasir']}
];
const titles={}; NAV.forEach(n=>titles[n.key]=n.label);
const CAT_LABEL={makanan:'Makanan',minuman:'Minuman',gudang:'Gudang'};
let currentStokCategory='makanan';

function doLogin(){
  const u=document.getElementById('loginUser').value.trim();
  const p=document.getElementById('loginPass').value;
  const err=document.getElementById('loginError');
  const found=getUsers().find(x=>x.username===u && x.password===p);
  if(found){
    sessionStorage.setItem(LSS, found.id);
    err.textContent='';
    const first=NAV.find(n=>n.roles.includes(found.role));
    window.location.href = ROUTE_URLS[first.key] || ROUTE_URLS.dashboard;
  } else {
    err.textContent='Username atau password salah.';
  }
}
function logoutUser(){
  sessionStorage.removeItem(LSS);
  window.location.href = ROUTE_URLS.login;
}

// Membangun sidebar sesuai role yang login, dengan link <a href> sungguhan
// (bukan tombol SPA) karena tiap menu di Laravel adalah route/URL sendiri.
function buildSidebar(role){
  const nav=document.getElementById('sidebarNav');
  nav.innerHTML=`<div class="brand">Adem<span> Ayem</span></div><div class="rolechip" id="roleChip">${role}</div>`;
  NAV.filter(n=>n.roles.includes(role)).forEach(n=>{
    const a=document.createElement('a');
    a.className='navbtn'+(n.key===PAGE_KEY?' active':'');
    a.href=ROUTE_URLS[n.key];
    a.textContent=n.label;
    nav.appendChild(a);
  });
  const lo=document.createElement('button');
  lo.className='navbtn logout'; lo.textContent='Keluar'; lo.onclick=logoutUser;
  nav.appendChild(lo);
}

// Dipanggil sekali di tiap halaman aplikasi (lihat bagian paling bawah file ini).
// Mengecek sesi login & hak akses role untuk PAGE_KEY halaman ini, lalu
// menyiapkan sidebar/topbar dan memanggil fungsi render khusus halaman tsb.
function bootstrapPage(){
  const user=currentUser();
  if(!user){ window.location.href = ROUTE_URLS.login; return; }

  const navItem = NAV.find(n=>n.key===PAGE_KEY);
  if(!navItem || !navItem.roles.includes(user.role)){
    const first=NAV.find(n=>n.roles.includes(user.role));
    window.location.href = first ? ROUTE_URLS[first.key] : ROUTE_URLS.login;
    return;
  }

  buildSidebar(user.role);
  document.getElementById('userChip').textContent=user.name+' ('+user.role+')';
  const titleEl=document.getElementById('pageTitle');
  if(titleEl) titleEl.textContent=titles[PAGE_KEY];

  if(PAGE_KEY==='dashboard') renderDashboard();
  if(PAGE_KEY==='pengguna') renderUsers();
  if(PAGE_KEY==='menu') renderMenuAdmin();
  if(PAGE_KEY==='stok') renderStok();
  if(PAGE_KEY==='kasir') renderPOS();
  if(PAGE_KEY==='profil') renderProfil();
  if(PAGE_KEY==='laporan'){
    const isSuper=user.role==='superadmin';
    const sec=document.getElementById('reportAnalyticsSection');
    if(sec) sec.style.display = isSuper ? 'block' : 'none';
    if(isSuper) renderReportAnalytics();
    const from=document.getElementById('repFrom');
    if(from && !from.value){
      const today=new Date().toISOString().slice(0,10);
      from.value=today; document.getElementById('repTo').value=today;
    }
    renderReport();
  }
}

function selectStokCat(c){ currentStokCategory=c; renderStok(); }

function renderDashboard(){
  const menu=getMenu(), trx=getTrx();
  const today=new Date().toISOString().slice(0,10);
  const todayTrx=trx.filter(t=>t.date.slice(0,10)===today);
  const todaySales=todayTrx.reduce((s,t)=>s+t.total,0);
  const lowStock=menu.filter(p=>p.stock<=5);
  document.getElementById('dashStats').innerHTML=`
    <div class="stat-card"><div class="num">${menu.length}</div><div class="lbl">Total Menu</div></div>
    <div class="stat-card"><div class="num">${rupiah(todaySales)}</div><div class="lbl">Penjualan Hari Ini</div></div>
    <div class="stat-card"><div class="num">${todayTrx.length}</div><div class="lbl">Transaksi Hari Ini</div></div>
    <div class="stat-card ${lowStock.length?'warn':''}"><div class="num">${lowStock.length}</div><div class="lbl">Menu Stok Menipis</div></div>`;
  document.getElementById('lowStockBody').innerHTML = lowStock.length ? lowStock.map(p=>`
    <tr><td>${p.name}</td><td><span class="tag tag-menu">${p.category}</span></td><td>${p.stock}</td></tr>`).join('')
    : `<tr><td colspan="3" class="empty">Semua stok aman</td></tr>`;
}

let editingUserId=null;
function renderUsers(){
  document.getElementById('userBody').innerHTML = getUsers().map(u=>`
    <tr><td>${u.name}</td><td>${u.username}</td><td><span class="tag tag-${u.role}">${u.role}</span></td>
    <td class="row-actions"><button onclick="editUser('${u.id}')">Ubah</button><button class="del" onclick="deleteUser('${u.id}')">Hapus</button></td></tr>`).join('');
}
function saveUser(){
  const name=document.getElementById('uName').value.trim();
  const username=document.getElementById('uUser').value.trim();
  const password=document.getElementById('uPass').value;
  const role=document.getElementById('uRole').value;
  if(!name||!username||!password){alert('Semua kolom wajib diisi.');return;}
  let users=getUsers();
  if(editingUserId){ users=users.map(u=>u.id===editingUserId?{...u,name,username,password,role}:u); editingUserId=null; document.getElementById('uSaveBtn').textContent='Simpan'; }
  else{ if(users.some(u=>u.username===username)){alert('Username sudah dipakai.');return;} users.push({id:'u'+Date.now(),name,username,password,role}); }
  setUsers(users);
  document.getElementById('uName').value=''; document.getElementById('uUser').value=''; document.getElementById('uPass').value='';
  renderUsers();
}
function editUser(id){
  const u=getUsers().find(x=>x.id===id); if(!u) return;
  document.getElementById('uName').value=u.name; document.getElementById('uUser').value=u.username;
  document.getElementById('uPass').value=u.password; document.getElementById('uRole').value=u.role;
  editingUserId=id; document.getElementById('uSaveBtn').textContent='Update';
}
function deleteUser(id){
  if(getUsers().length<=1){alert('Minimal harus ada satu pengguna.');return;}
  if(id===currentUser().id){alert('Tidak bisa menghapus akun sendiri.');return;}
  if(!confirm('Hapus pengguna ini?')) return;
  setUsers(getUsers().filter(u=>u.id!==id)); renderUsers();
}

let editingMenuId=null;
function buildEmojiPick(){
  document.getElementById('emojiPick').innerHTML = EMOJIS.map(e=>`<span class="${e===menuEmoji?'sel':''}" onclick="pickEmoji('${e}')">${e}</span>`).join('');
}
function pickEmoji(e){ menuEmoji=e; buildEmojiPick(); }
function renderMenuAdmin(){
  buildEmojiPick();
  document.getElementById('menuBody').innerHTML = getMenu().map(p=>`
    <tr><td style="font-size:18px">${p.emoji||'🍽️'}</td><td>${p.name}</td><td><span class="tag tag-menu">${p.category}</span></td><td>${rupiah(p.price)}</td>
    <td class="row-actions"><button onclick="editMenu('${p.id}')">Ubah</button><button class="del" onclick="deleteMenu('${p.id}')">Hapus</button></td></tr>`).join('');
}
function saveMenu(){
  const name=document.getElementById('mName').value.trim();
  const category=document.getElementById('mCat').value.trim()||'Lainnya';
  const price=Number(document.getElementById('mPrice').value);
  if(!name||!price){alert('Nama dan harga wajib diisi.');return;}
  let menu=getMenu();
  if(editingMenuId){ menu=menu.map(p=>p.id===editingMenuId?{...p,name,category,price,emoji:menuEmoji}:p); editingMenuId=null; document.getElementById('mSaveBtn').textContent='Simpan'; }
  else{ menu.push({id:'m'+Date.now(),name,category,price,stock:0,emoji:menuEmoji}); }
  setMenu(menu);
  document.getElementById('mName').value=''; document.getElementById('mPrice').value=''; menuEmoji='🍽️';
  renderMenuAdmin();
}
function editMenu(id){
  const p=getMenu().find(x=>x.id===id); if(!p) return;
  document.getElementById('mName').value=p.name; document.getElementById('mCat').value=p.category; document.getElementById('mPrice').value=p.price;
  menuEmoji=p.emoji||'🍽️'; editingMenuId=id; document.getElementById('mSaveBtn').textContent='Update'; buildEmojiPick();
}
function deleteMenu(id){ if(!confirm('Hapus menu ini?')) return; setMenu(getMenu().filter(p=>p.id!==id)); renderMenuAdmin(); }

let editingInvId=null;
function renderStok(){
  document.querySelectorAll('#stokCatTabs .cat-tab').forEach(b=>b.classList.toggle('active', b.dataset.c===currentStokCategory));
  const catLabel=CAT_LABEL[currentStokCategory];
  document.getElementById('stokFormTitle').textContent='Tambah Barang '+catLabel+' Baru';
  document.getElementById('stokListTitle').textContent='Daftar & Status Stok '+catLabel;
  const inv=getInv().filter(p=>p.category===currentStokCategory);
  document.getElementById('stokStatusBody').innerHTML = inv.length ? inv.map(p=>{
    const status = p.stock<=0 ? '<span style="color:var(--danger);font-weight:600">Habis</span>' : p.stock<=5 ? '<span style="color:var(--accent);font-weight:600">Menipis</span>' : '<span style="color:#3E7A52;font-weight:600">Aman</span>';
    return `<tr><td>${p.name}</td>
    <td><div class="stock-adjust"><button onclick="quickAdjust('${p.id}',-1)">−</button><span class="val">${p.stock}</span><button onclick="quickAdjust('${p.id}',1)">+</button></div></td>
    <td>${p.unit}</td><td>${status}</td>
    <td class="row-actions"><button onclick="editInventoryItem('${p.id}')">Ubah</button><button class="del" onclick="deleteInventoryItem('${p.id}')">Hapus</button></td></tr>`;
  }).join('') : `<tr><td colspan="5" class="empty">Belum ada barang ${catLabel.toLowerCase()}</td></tr>`;
  const allInv=getInv();
  const log=getLog().filter(l=>{ const it=allInv.find(x=>x.id===l.itemId); return it && it.category===currentStokCategory; }).slice().reverse();
  document.getElementById('stokLogBody').innerHTML = log.length ? log.map(l=>{
    const it=allInv.find(x=>x.id===l.itemId);
    return `<tr><td>${new Date(l.date).toLocaleString('id-ID')}</td><td>${it?it.name:'-'}</td><td>${l.type==='masuk'?'Masuk':'Keluar'}</td><td>${l.qty}</td><td>${it?it.unit:'-'}</td><td>${l.note||'-'}</td></tr>`;
  }).join('') : `<tr><td colspan="6" class="empty">Belum ada riwayat</td></tr>`;
}
function saveInventoryItem(){
  const name=document.getElementById('iName').value.trim();
  const unit=document.getElementById('iUnit').value.trim();
  const stock=Number(document.getElementById('iStock').value)||0;
  if(!name||!unit){alert('Nama barang dan satuan wajib diisi.');return;}
  let inv=getInv();
  if(editingInvId){ inv=inv.map(p=>p.id===editingInvId?{...p,name,unit,stock}:p); editingInvId=null; document.getElementById('iSaveBtn').textContent='Simpan'; }
  else{ inv.push({id:'i'+Date.now(),name,category:currentStokCategory,unit,stock}); }
  setInv(inv);
  document.getElementById('iName').value=''; document.getElementById('iUnit').value=''; document.getElementById('iStock').value='';
  renderStok();
}
function editInventoryItem(id){
  const p=getInv().find(x=>x.id===id); if(!p) return;
  document.getElementById('iName').value=p.name; document.getElementById('iUnit').value=p.unit; document.getElementById('iStock').value=p.stock;
  editingInvId=id; document.getElementById('iSaveBtn').textContent='Update';
}
function deleteInventoryItem(id){
  if(!confirm('Hapus barang stok ini? Riwayat terkait akan tetap tersimpan.')) return;
  setInv(getInv().filter(p=>p.id!==id)); renderStok();
}
function quickAdjust(id,delta){
  let inv=getInv();
  const item=inv.find(p=>p.id===id); if(!item) return;
  if(delta<0 && item.stock<=0) return;
  inv=inv.map(p=>p.id===id?{...p,stock:p.stock+delta}:p);
  setInv(inv);
  const log=getLog();
  log.push({id:'l'+Date.now(),date:new Date().toISOString(),itemId:id,type:delta>0?'masuk':'keluar',qty:1,note:''});
  setLog(log);
  renderStok();
}

function renderPOS(){
  const menu=getMenu();
  const cats=['semua', ...new Set(menu.map(p=>p.category))];
  document.getElementById('posCatTabs').innerHTML = cats.map(c=>
    `<button class="cat-tab ${c===currentPosCategory?'active':''}" onclick="selectPosCat('${c}')">${c==='semua'?'Semua':c}</button>`).join('');
  const search=(document.getElementById('posSearch')?.value||'').toLowerCase();
  const filtered=menu.filter(p=> (currentPosCategory==='semua'||p.category===currentPosCategory) && p.name.toLowerCase().includes(search));
  document.getElementById('posProductGrid').innerHTML = filtered.length ? filtered.map(p=>`
    <div class="prod-card" onclick="addToCart('${p.id}')">
      <div class="emoji">${p.emoji||'🍽️'}</div><div class="name">${p.name}</div>
      <div class="price">${rupiah(p.price)}</div><div class="stock">Stok: ${p.stock}</div></div>`).join('')
    : `<div class="empty">Menu tidak ditemukan</div>`;
  document.querySelectorAll('#orderTypeToggle button').forEach(b=>b.classList.toggle('sel', b.dataset.t===selectedOrderType));
  renderCart();
}
function selectPosCat(c){ currentPosCategory=c; renderPOS(); }
function selectOrderType(t){ selectedOrderType=t; renderPOS(); }
function addToCart(id){
  const p=getMenu().find(x=>x.id===id);
  if(!p || p.stock<=0){alert('Stok habis.');return;}
  const existing=cart.find(c=>c.id===id);
  if(existing){ if(existing.qty>=p.stock){alert('Stok tidak mencukupi.');return;} existing.qty++; }
  else{ cart.push({id:p.id,name:p.name,price:p.price,qty:1}); }
  renderCart();
}
function changeQty(id,delta){
  const item=cart.find(c=>c.id===id); if(!item) return;
  const stock=getMenu().find(p=>p.id===id).stock;
  item.qty+=delta;
  if(item.qty<=0) cart=cart.filter(c=>c.id!==id);
  else if(item.qty>stock) item.qty=stock;
  renderCart();
}
function removeFromCart(id){ cart=cart.filter(c=>c.id!==id); renderCart(); }
const TAX_RATE=0.10;
function cartSubtotal(){ return cart.reduce((s,c)=>s+c.price*c.qty,0); }
function computeTotals(){
  const sub=cartSubtotal();
  const disc=Math.min(appliedDiscount||0, sub);
  const tax=Math.round(sub*TAX_RATE);
  return {sub,disc,tax,total:sub-disc+tax};
}
function applyDiscount(){
  const sub=cartSubtotal();
  let v=Number(document.getElementById('discountInput').value)||0;
  if(v<0) v=0; if(v>sub) v=sub;
  appliedDiscount=v;
  renderCart();
}
function renderCart(){
  const body=document.getElementById('cartBody');
  body.innerHTML = cart.length ? cart.map(c=>`
    <div class="cart-item"><div>${c.name}<br><span style="color:var(--muted);font-size:12px">${rupiah(c.price)} x ${c.qty}</span></div>
    <div class="qty-ctrl"><button onclick="changeQty('${c.id}',-1)">−</button><span style="margin:0 6px">${c.qty}</span><button onclick="changeQty('${c.id}',1)">+</button>
    <button onclick="removeFromCart('${c.id}')" style="margin-left:6px;color:var(--danger);border:none;background:none;cursor:pointer">✕</button></div></div>`).join('')
    : '<div class="empty">Belum ada item</div>';
  const t=computeTotals();
  document.getElementById('cartSubtotal').textContent=rupiah(t.sub);
  document.getElementById('cartTax').textContent=rupiah(t.tax);
  document.getElementById('cartTotal').textContent = rupiah(t.total);
  document.getElementById('cartDiscountRow').style.display = t.disc>0 ? 'flex' : 'none';
  document.getElementById('cartDiscount').textContent = '- '+rupiah(t.disc);
}

const PAY_LABELS={tunai:'Tunai',qris:'QRIS',kartu:'Kartu Debit/Kredit',transfer:'Transfer Bank'};
function openPaymentModal(){
  if(!cart.length){alert('Belum ada pesanan.');return;}
  selectedPay='tunai';
  document.getElementById('payModalTotal').textContent=rupiah(computeTotals().total);
  document.getElementById('cashReceived').value='';
  selectPayModal('tunai');
  document.getElementById('paymentModal').style.display='flex';
}
function closePaymentModal(){ document.getElementById('paymentModal').style.display='none'; }
function selectPayModal(m){
  selectedPay=m;
  document.querySelectorAll('.paymethod-card').forEach(c=>c.classList.toggle('sel', c.dataset.m===m));
  document.getElementById('cashSection').style.display = m==='tunai' ? 'block' : 'none';
  updateChange();
}
function setQuickAmt(v){
  const total=computeTotals().total;
  document.getElementById('cashReceived').value = v==='exact' ? total : v;
  updateChange();
}
function updateChange(){
  const total=computeTotals().total;
  const received=Number(document.getElementById('cashReceived').value)||0;
  const change=received-total;
  document.getElementById('changeAmt').textContent = rupiah(change>0?change:0);
}
function confirmPayment(){
  const {sub,disc,tax,total}=computeTotals();
  let received=null, change=0;
  if(selectedPay==='tunai'){
    received=Number(document.getElementById('cashReceived').value)||0;
    if(received<total){alert('Uang diterima kurang dari total.');return;}
    change=received-total;
  }
  let menu=getMenu();
  cart.forEach(c=>{ menu=menu.map(p=>p.id===c.id?{...p,stock:p.stock-c.qty}:p); });
  setMenu(menu);
  const customer=document.getElementById('custName').value.trim()||'Umum';
  const existingTrx=getTrx();
  const trxNo='SR-'+new Date().getFullYear()+'-'+String(existingTrx.length+1).padStart(4,'0');
  const trxItem={id:'t'+Date.now(),no:trxNo,date:new Date().toISOString(),items:cart.map(c=>({name:c.name,qty:c.qty,price:c.price})),subtotal:sub,discount:disc,tax,total,payment:selectedPay,received,change,kasir:currentUser().name,customer,orderType:selectedOrderType};
  existingTrx.push(trxItem); setTrx(existingTrx);
  lastTrx=trxItem;
  cart=[]; appliedDiscount=0; document.getElementById('discountInput').value='';
  renderPOS();
  closePaymentModal();
  openReceiptModal(trxItem);
}
function receiptRowsHTML(t){
  const itemsHtml=t.items.map(i=>`<div class="rline"><span>${i.name}<br>&nbsp;&nbsp;${i.qty} x ${rupiah(i.price)}</span><span>${rupiah(i.price*i.qty)}</span></div>`).join('');
  return `
    <div class="rline"><span>No. ${t.no}</span><span>${new Date(t.date).toLocaleDateString('id-ID')} ${new Date(t.date).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span></div>
    <div class="rline"><span>Kasir: ${t.kasir}</span><span>${t.orderType==='takeaway'?'Bawa pulang':'Makan di tempat'}</span></div>
    <div class="rline"><span>Pelanggan</span><span>${t.customer}</span></div>
    <hr>${itemsHtml}<hr>
    <div class="rline"><span>Subtotal</span><span>${rupiah(t.subtotal)}</span></div>
    ${t.discount>0?`<div class="rline"><span>Diskon</span><span>- ${rupiah(t.discount)}</span></div>`:''}
    <div class="rline"><span>PB1 10%</span><span>${rupiah(t.tax)}</span></div>
    <div class="rline"><b>TOTAL</b><b>${rupiah(t.total)}</b></div>
    <div class="rline"><span>${PAY_LABELS[t.payment]||t.payment}</span><span>${t.payment==='tunai'?rupiah(t.received):'-'}</span></div>
    ${t.payment==='tunai'?`<div class="rline"><span>Kembali</span><span>${rupiah(t.change)}</span></div>`:''}`;
}
function receiptLinesText(t){
  const itemLines=t.items.map(i=>`${i.name} x${i.qty}  ${rupiah(i.price*i.qty)}`).join('\n');
  let s=`ADEM AYEM\nNo. ${t.no}   ${new Date(t.date).toLocaleString('id-ID')}\nKasir: ${t.kasir}   ${t.orderType==='takeaway'?'Bawa pulang':'Makan di tempat'}\nPelanggan: ${t.customer}\n---\n${itemLines}\n---\nSubtotal: ${rupiah(t.subtotal)}\n`;
  if(t.discount>0) s+=`Diskon: -${rupiah(t.discount)}\n`;
  s+=`PB1 10%: ${rupiah(t.tax)}\nTOTAL: ${rupiah(t.total)}\nBayar: ${PAY_LABELS[t.payment]||t.payment}`;
  if(t.payment==='tunai') s+=`\nTunai: ${rupiah(t.received)}\nKembali: ${rupiah(t.change)}`;
  return s+`\nTerima kasih atas kunjungan Anda`;
}
function openReceiptModal(t){
  document.getElementById('receiptModalBody').innerHTML=`
    <div style="text-align:center"><b>ADEM AYEM</b><br><span style="font-size:11px;color:var(--muted)">Jl. Contoh No. 1, Kotamu</span></div>
    <hr>${receiptRowsHTML(t)}<hr>
    <div style="text-align:center;font-size:11.5px;">Terima kasih atas kunjungan Anda<br>Simpan struk ini sebagai bukti</div>`;
  document.getElementById('fakeQr').innerHTML=buildFakeQr(t.no)+`<div style="font-size:11px;color:var(--muted);margin-top:4px;">scan untuk struk digital</div>`;
  document.getElementById('receiptModal').style.display='flex';
}
function closeReceiptModal(){
  document.getElementById('receiptModal').style.display='none';
  document.getElementById('custName').value='';
}
function buildFakeQr(seed){
  const size=21, cell=6;
  let h=0; for(let i=0;i<seed.length;i++) h=(h*31+seed.charCodeAt(i))>>>0;
  function rnd(){ h=(h*1664525+1013904223)>>>0; return h; }
  function inFinder(x,y,cx,cy){
    const lx=x-cx, ly=y-cy;
    if(lx<0||lx>6||ly<0||ly>6) return null;
    if(lx===0||lx===6||ly===0||ly===6) return true;
    if(lx>=2&&lx<=4&&ly>=2&&ly<=4) return true;
    return false;
  }
  let rects='';
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      let black=inFinder(x,y,0,0); if(black===null) black=inFinder(x,y,size-7,0);
      if(black===null) black=inFinder(x,y,0,size-7);
      if(black===null) black=(rnd()%2===0);
      if(black) rects+=`<rect x="${x*cell}" y="${y*cell}" width="${cell-1}" height="${cell-1}" fill="#1F2A24"/>`;
    }
  }
  const total=size*cell;
  return `<svg width="126" height="126" viewBox="0 0 ${total} ${total}" style="background:#fff;">${rects}</svg>`;
}
function sendWhatsApp(){
  if(!lastTrx) return;
  window.open('https://wa.me/?text='+encodeURIComponent(receiptLinesText(lastTrx)), '_blank');
}
function printLastReceipt(){
  if(!lastTrx) return;
  document.getElementById('receiptPrint').innerHTML=`
    <div class="receipt">
      <div class="center"><b>ADEM AYEM</b><br><span style="font-size:10.5px;">Jl. Contoh No. 1, Kotamu</span></div>
      <hr>${receiptRowsHTML(lastTrx)}<hr>
      <div class="center" style="margin-bottom:8px;">Terima kasih atas kunjungan Anda<br>Simpan struk ini sebagai bukti</div>
      <div class="center">${buildFakeQr(lastTrx.no)}</div>
      <div class="center" style="font-size:10.5px;margin-top:4px;">scan untuk struk digital</div>
    </div>`;
  document.body.classList.add('print-receipt-mode');
  window.print();
}
window.addEventListener('afterprint', ()=>document.body.classList.remove('print-receipt-mode'));

function pctDelta(now,prev){
  if(prev===0) return now===0 ? 0 : 100;
  return Math.round(((now-prev)/prev)*100);
}
function deltaHTML(pct,suffix){
  if(pct===0) return `<span class="delta">Sama dengan kemarin</span>`;
  const up=pct>0;
  return `<span class="delta ${up?'up':'down'}">${up?'↑':'↓'} ${Math.abs(pct)}% ${suffix}</span>`;
}
function renderReportAnalytics(){
  const trx=getTrx();
  const todayStr=new Date().toISOString().slice(0,10);
  const yStr=new Date(Date.now()-86400000).toISOString().slice(0,10);
  const todayTrx=trx.filter(t=>t.date.slice(0,10)===todayStr);
  const yTrx=trx.filter(t=>t.date.slice(0,10)===yStr);
  const todaySales=todayTrx.reduce((s,t)=>s+t.total,0), ySales=yTrx.reduce((s,t)=>s+t.total,0);
  const todayTax=todayTrx.reduce((s,t)=>s+t.tax,0);
  const avgToday=todayTrx.length?Math.round(todaySales/todayTrx.length):0;
  const avgY=yTrx.length?Math.round(ySales/yTrx.length):0;
  document.getElementById('repTodaySales').textContent=rupiah(todaySales);
  document.getElementById('repTodayDelta').innerHTML=deltaHTML(pctDelta(todaySales,ySales),'vs kemarin');
  document.getElementById('repTodayCount').textContent=todayTrx.length;
  document.getElementById('repCountDelta').innerHTML=deltaHTML(pctDelta(todayTrx.length,yTrx.length),'vs kemarin');
  document.getElementById('repAvgTrx').textContent=rupiah(avgToday);
  document.getElementById('repAvgDelta').innerHTML=deltaHTML(pctDelta(avgToday,avgY),'vs kemarin');
  document.getElementById('repTodayTax').textContent=rupiah(todayTax);

  // Grafik 7 hari terakhir
  const days=[]; let maxVal=1;
  for(let i=6;i>=0;i--){
    const d=new Date(Date.now()-i*86400000);
    const dStr=d.toISOString().slice(0,10);
    const val=trx.filter(t=>t.date.slice(0,10)===dStr).reduce((s,t)=>s+t.total,0);
    days.push({label:d.toLocaleDateString('id-ID',{weekday:'short'}),val});
    if(val>maxVal) maxVal=val;
  }
  const peakIdx=days.reduce((mi,d,i,arr)=>d.val>arr[mi].val?i:mi,0);
  document.getElementById('weeklyBarChart').innerHTML=days.map((d,i)=>`
    <div class="bar-col">
      <div class="bv">${d.val>=1000?(d.val/1000).toFixed(1)+'rb':d.val}</div>
      <div class="bar ${i===peakIdx&&d.val>0?'peak':''}" style="height:${Math.max(4,(d.val/maxVal)*160)}px;"></div>
      <div class="bd">${d.label}</div>
    </div>`).join('');

  // Metode pembayaran (semua transaksi)
  const payColors={tunai:'#1F3A2E',qris:'#E08A2C',kartu:'#2A5A9C',transfer:'#B4472F'};
  const payTotals={}; let grandTotal=0;
  trx.forEach(t=>{ payTotals[t.payment]=(payTotals[t.payment]||0)+t.total; grandTotal+=t.total; });
  const payEntries=Object.entries(payTotals).sort((a,b)=>b[1]-a[1]);
  if(grandTotal>0){
    let acc=0, gradParts=[];
    payEntries.forEach(([m,v])=>{
      const pct=(v/grandTotal)*100;
      gradParts.push(`${payColors[m]||'#999'} ${acc}% ${acc+pct}%`);
      acc+=pct;
    });
    document.getElementById('paymentDonut').style.background=`conic-gradient(${gradParts.join(',')})`;
    document.getElementById('paymentDonut').innerHTML=`<div class="inner">${Math.round((payEntries[0][1]/grandTotal)*100)}%<span>${PAY_LABELS[payEntries[0][0]]||payEntries[0][0]}</span></div>`;
    document.getElementById('paymentLegend').innerHTML=payEntries.map(([m,v])=>`
      <div class="legend-row"><span><span class="legend-dot" style="background:${payColors[m]||'#999'}"></span>${PAY_LABELS[m]||m}</span><b>${Math.round((v/grandTotal)*100)}%</b></div>`).join('');
  } else {
    document.getElementById('paymentDonut').style.background='#EEE';
    document.getElementById('paymentDonut').innerHTML=`<div class="inner">0%</div>`;
    document.getElementById('paymentLegend').innerHTML=`<div class="empty">Belum ada transaksi</div>`;
  }

  // Menu terlaris bulan ini
  const monthStr=todayStr.slice(0,7);
  const menuAgg={};
  trx.filter(t=>t.date.slice(0,7)===monthStr).forEach(t=>{
    t.items.forEach(i=>{
      if(!menuAgg[i.name]) menuAgg[i.name]={qty:0,omzet:0};
      menuAgg[i.name].qty+=i.qty; menuAgg[i.name].omzet+=i.qty*i.price;
    });
  });
  const topMenu=Object.entries(menuAgg).sort((a,b)=>b[1].qty-a[1].qty).slice(0,5);
  document.getElementById('topMenuBody').innerHTML = topMenu.length ? topMenu.map(([name,v])=>`
    <tr><td>${name}</td><td>${v.qty}</td><td>${rupiah(v.omzet)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="empty">Belum ada penjualan bulan ini</td></tr>`;

  // Jam tersibuk (blok 2 jam, sepanjang waktu)
  const hourAgg={};
  trx.forEach(t=>{
    const h=new Date(t.date).getHours();
    const bucket=Math.floor(h/2)*2;
    const key=`${String(bucket).padStart(2,'0')}.00 - ${String(bucket+2).padStart(2,'0')}.00`;
    if(!hourAgg[key]) hourAgg[key]={count:0,omzet:0};
    hourAgg[key].count++; hourAgg[key].omzet+=t.total;
  });
  const topHours=Object.entries(hourAgg).sort((a,b)=>b[1].count-a[1].count).slice(0,5);
  document.getElementById('topHoursBody').innerHTML = topHours.length ? topHours.map(([range,v])=>`
    <tr><td>${range}</td><td>${v.count}</td><td>${rupiah(v.omzet)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="empty">Belum ada data transaksi</td></tr>`;
}
function renderReport(){
  const from=document.getElementById('repFrom').value, to=document.getElementById('repTo').value;
  const trx=getTrx().filter(t=>{ const d=t.date.slice(0,10); return (!from||d>=from)&&(!to||d<=to); })
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('repTotalSales').textContent=rupiah(trx.reduce((s,t)=>s+t.total,0));
  document.getElementById('repTotalTrx').textContent=trx.length;
  const payAgg={};
  trx.forEach(t=>{ if(!payAgg[t.payment]) payAgg[t.payment]={count:0,total:0}; payAgg[t.payment].count++; payAgg[t.payment].total+=t.total; });
  const payEntries=Object.entries(payAgg).sort((a,b)=>b[1].total-a[1].total);
  document.getElementById('repPayBody').innerHTML = payEntries.length ? payEntries.map(([m,v])=>`
    <tr><td>${PAY_LABELS[m]||m}</td><td>${v.count}</td><td>${rupiah(v.total)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="empty">Belum ada transaksi pada rentang ini</td></tr>`;
  document.getElementById('repBody').innerHTML = trx.length ? trx.map(t=>`
    <tr><td>${new Date(t.date).toLocaleString('id-ID')}</td><td>${t.items.map(i=>i.name+' x'+i.qty).join(', ')}</td><td>${(t.payment||'-').toUpperCase()}</td><td>${rupiah(t.total)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="empty">Tidak ada transaksi pada rentang ini</td></tr>`;
}

function renderProfil(){
  const u=currentUser();
  document.getElementById('myName').value=u.name; document.getElementById('myUser').value=u.username; document.getElementById('myPass').value='';
  document.getElementById('profileMsg').textContent='';
}
function saveProfile(){
  const u=currentUser();
  const name=document.getElementById('myName').value.trim();
  const username=document.getElementById('myUser').value.trim();
  const pass=document.getElementById('myPass').value;
  if(!name||!username){alert('Nama dan username wajib diisi.');return;}
  let users=getUsers().map(x=>x.id===u.id?{...x,name,username,password: pass?pass:x.password}:x);
  setUsers(users);
  document.getElementById('userChip').textContent=name+' ('+u.role+')';
  document.getElementById('profileMsg').textContent='Profil berhasil diperbarui.';
  document.getElementById('myPass').value='';
}

seedIfEmpty();
if(document.getElementById('loginScreen')){
  // Halaman login: cuma perlu wiring submit, tidak ada guard role di sini.
  const passEl=document.getElementById('loginPass');
  if(passEl) passEl.addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
} else if(typeof PAGE_KEY !== 'undefined'){
  // Halaman aplikasi (dashboard/menu/stok/kasir/laporan/profil/pengguna).
  bootstrapPage();
}

/* ===== QR MENU ===== */
function buildMenuText(){
  const menu=getMenu();
  const cats=[...new Set(menu.map(p=>p.category))];
  let s='MENU ADEM AYEM\n';
  cats.forEach(c=>{
    s+='\n'+c.toUpperCase()+'\n';
    menu.filter(p=>p.category===c).forEach(p=>{ s+='- '+p.name+' Rp'+Number(p.price).toLocaleString('id-ID')+(p.stock<=0?' (habis)':'')+'\n'; });
  });
  return s.trim();
}
function qrSvg(text,px){
  const qr=new QRLib(-1,1); // -1 = ukuran otomatis, 1 = level koreksi L
  qr.addData(unescape(encodeURIComponent(text))); // aman untuk huruf non-ASCII
  qr.make();
  const n=qr.getModuleCount(), q=3; let d='';
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) d+=`M${c+q} ${r+q}h1v1h-1z`;
  const t=n+q*2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
function openMenuQr(){
  const text=buildMenuText();
  let svg;
  try{ svg=qrSvg(text,260); }catch(e){ svg='<div class="empty">Menu terlalu panjang untuk satu QR. Kurangi jumlah menu.</div>'; }
  document.getElementById('menuQrBox').innerHTML=svg;
  document.getElementById('menuQrText').textContent=text;
  document.getElementById('menuQrModal').style.display='flex';
}
function closeMenuQr(){ document.getElementById('menuQrModal').style.display='none'; }
function printMenuQr(){
  document.getElementById('receiptPrint').innerHTML=`<div class="receipt"><div class="center"><b>MENU</b><br>Scan untuk melihat daftar menu</div><div class="center" style="margin-top:10px;">${qrSvg(buildMenuText(),240)}</div></div>`;
  document.body.classList.add('print-receipt-mode');
  window.print();
}

/* ===== QR encoder: 'QRCode for JavaScript' (c) 2009 Kazuhiko Arase, MIT License ===== */
const QRLib=(function(){
  const defs={}, cache={};
  function req(n){ n=n.replace('./','').replace('../vendor/QRCode/',''); if(cache[n]) return cache[n].exports; const m={exports:{}}; cache[n]=m; defs[n](m,req); return m.exports; }
  defs['QRMode']=function(module,require){
module.exports = {
    MODE_NUMBER :       1 << 0,
    MODE_ALPHA_NUM :    1 << 1,
    MODE_8BIT_BYTE :    1 << 2,
    MODE_KANJI :        1 << 3
};

  };
  defs['QRMath']=function(module,require){
var QRMath = {

	glog : function(n) {
	
		if (n < 1) {
			throw new Error("glog(" + n + ")");
		}
		
		return QRMath.LOG_TABLE[n];
	},
	
	gexp : function(n) {
	
		while (n < 0) {
			n += 255;
		}
	
		while (n >= 256) {
			n -= 255;
		}
	
		return QRMath.EXP_TABLE[n];
	},
	
	EXP_TABLE : new Array(256),
	
	LOG_TABLE : new Array(256)

};
	
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
		^ QRMath.EXP_TABLE[i - 5]
		^ QRMath.EXP_TABLE[i - 6]
		^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
}

module.exports = QRMath;

  };
  defs['QRPolynomial']=function(module,require){
var QRMath = require('./QRMath');

function QRPolynomial(num, shift) {
	if (num.length === undefined) {
		throw new Error(num.length + "/" + shift);
	}

	var offset = 0;

	while (offset < num.length && num[offset] === 0) {
		offset++;
	}

	this.num = new Array(num.length - offset + shift);
	for (var i = 0; i < num.length - offset; i++) {
		this.num[i] = num[i + offset];
	}
}

QRPolynomial.prototype = {

	get : function(index) {
		return this.num[index];
	},
	
	getLength : function() {
		return this.num.length;
	},
	
	multiply : function(e) {
	
		var num = new Array(this.getLength() + e.getLength() - 1);
	
		for (var i = 0; i < this.getLength(); i++) {
			for (var j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
			}
		}
	
		return new QRPolynomial(num, 0);
	},
	
	mod : function(e) {
	
		if (this.getLength() - e.getLength() < 0) {
			return this;
		}
	
		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
	
		var num = new Array(this.getLength() );
		
		for (var i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i);
		}
		
		for (var x = 0; x < e.getLength(); x++) {
			num[x] ^= QRMath.gexp(QRMath.glog(e.get(x) ) + ratio);
		}
	
		// recursive call
		return new QRPolynomial(num, 0).mod(e);
	}
};

module.exports = QRPolynomial;

  };
  defs['QRMaskPattern']=function(module,require){
module.exports = {
	PATTERN000 : 0,
	PATTERN001 : 1,
	PATTERN010 : 2,
	PATTERN011 : 3,
	PATTERN100 : 4,
	PATTERN101 : 5,
	PATTERN110 : 6,
	PATTERN111 : 7
};

  };
  defs['QRErrorCorrectLevel']=function(module,require){
module.exports = {
	L : 1,
	M : 0,
	Q : 3,
	H : 2
};


  };
  defs['QR8bitByte']=function(module,require){
var QRMode = require('./QRMode');

function QR8bitByte(data) {
	this.mode = QRMode.MODE_8BIT_BYTE;
	this.data = data;
}

QR8bitByte.prototype = {

	getLength : function() {
		return this.data.length;
	},
	
	write : function(buffer) {
		for (var i = 0; i < this.data.length; i++) {
			// not JIS ...
			buffer.put(this.data.charCodeAt(i), 8);
		}
	}
};

module.exports = QR8bitByte;

  };
  defs['QRBitBuffer']=function(module,require){
function QRBitBuffer() {
	this.buffer = [];
	this.length = 0;
}

QRBitBuffer.prototype = {

	get : function(index) {
		var bufIndex = Math.floor(index / 8);
		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
	},
	
	put : function(num, length) {
		for (var i = 0; i < length; i++) {
			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
		}
	},
	
	getLengthInBits : function() {
		return this.length;
	},
	
	putBit : function(bit) {
	
		var bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
	
		if (bit) {
			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
		}
	
		this.length++;
	}
};

module.exports = QRBitBuffer;

  };
  defs['QRRSBlock']=function(module,require){
var QRErrorCorrectLevel = require('./QRErrorCorrectLevel');

function QRRSBlock(totalCount, dataCount) {
	this.totalCount = totalCount;
	this.dataCount  = dataCount;
}

QRRSBlock.RS_BLOCK_TABLE = [

	// L
	// M
	// Q
	// H

	// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	
	// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

	// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

	// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	
	// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	
	// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	
	// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	
	// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	
	// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	
	// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],

	// 11
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],

	// 12
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],

	// 13
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],

	// 14
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],

	// 15
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],

	// 16
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],

	// 17
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],

	// 18
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],

	// 19
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],

	// 20
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],

	// 21
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],

	// 22
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],

	// 23
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],

	// 24
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],

	// 25
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],

	// 26
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],

	// 27
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],

	// 28
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],

	// 29
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],

	// 30
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],

	// 31
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],

	// 32
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],

	// 33
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],

	// 34
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],

	// 35
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],

	// 36
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],

	// 37
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],

	// 38
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],

	// 39
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],

	// 40
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16]
];

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
	
	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
	
	if (rsBlock === undefined) {
		throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
	}

	var length = rsBlock.length / 3;
	
	var list = [];
	
	for (var i = 0; i < length; i++) {

		var count = rsBlock[i * 3 + 0];
		var totalCount = rsBlock[i * 3 + 1];
		var dataCount  = rsBlock[i * 3 + 2];

		for (var j = 0; j < count; j++) {
			list.push(new QRRSBlock(totalCount, dataCount) );	
		}
	}
	
	return list;
};

QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {

	switch(errorCorrectLevel) {
	case QRErrorCorrectLevel.L :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
	case QRErrorCorrectLevel.M :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
	case QRErrorCorrectLevel.Q :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
	case QRErrorCorrectLevel.H :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
	default :
		return undefined;
	}
};

module.exports = QRRSBlock;

  };
  defs['QRUtil']=function(module,require){
var QRMode = require('./QRMode');
var QRPolynomial = require('./QRPolynomial');
var QRMath = require('./QRMath');
var QRMaskPattern = require('./QRMaskPattern');

var QRUtil = {

    PATTERN_POSITION_TABLE : [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],        
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
    ],

    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)    | (1 << 4) | (1 << 1),

    getBCHTypeInfo : function(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
            d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) );    
        }
        return ( (data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHTypeNumber : function(data) {
        var d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
            d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) );    
        }
        return (data << 12) | d;
    },

    getBCHDigit : function(data) {

        var digit = 0;

        while (data !== 0) {
            digit++;
            data >>>= 1;
        }

        return digit;
    },

    getPatternPosition : function(typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {
        
        switch (maskPattern) {
            
        case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001 : return i % 2 === 0;
        case QRMaskPattern.PATTERN010 : return j % 3 === 0;
        case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
        case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
        case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
        case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;

        default :
            throw new Error("bad maskPattern:" + maskPattern);
        }
    },

    getErrorCorrectPolynomial : function(errorCorrectLength) {

        var a = new QRPolynomial([1], 0);

        for (var i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
        }

        return a;
    },

    getLengthInBits : function(mode, type) {

        if (1 <= type && type < 10) {

            // 1 - 9

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 10;
            case QRMode.MODE_ALPHA_NUM  : return 9;
            case QRMode.MODE_8BIT_BYTE  : return 8;
            case QRMode.MODE_KANJI      : return 8;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 27) {

            // 10 - 26

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 12;
            case QRMode.MODE_ALPHA_NUM  : return 11;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 10;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 41) {

            // 27 - 40

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 14;
            case QRMode.MODE_ALPHA_NUM  : return 13;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 12;
            default :
                throw new Error("mode:" + mode);
            }

        } else {
            throw new Error("type:" + type);
        }
    },

    getLostPoint : function(qrCode) {
        
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;
        var row = 0; 
        var col = 0;

        
        // LEVEL1
        
        for (row = 0; row < moduleCount; row++) {

            for (col = 0; col < moduleCount; col++) {

                var sameCount = 0;
                var dark = qrCode.isDark(row, col);

                for (var r = -1; r <= 1; r++) {

                    if (row + r < 0 || moduleCount <= row + r) {
                        continue;
                    }

                    for (var c = -1; c <= 1; c++) {

                        if (col + c < 0 || moduleCount <= col + c) {
                            continue;
                        }

                        if (r === 0 && c === 0) {
                            continue;
                        }

                        if (dark === qrCode.isDark(row + r, col + c) ) {
                            sameCount++;
                        }
                    }
                }

                if (sameCount > 5) {
                    lostPoint += (3 + sameCount - 5);
                }
            }
        }

        // LEVEL2

        for (row = 0; row < moduleCount - 1; row++) {
            for (col = 0; col < moduleCount - 1; col++) {
                var count = 0;
                if (qrCode.isDark(row,     col    ) ) count++;
                if (qrCode.isDark(row + 1, col    ) ) count++;
                if (qrCode.isDark(row,     col + 1) ) count++;
                if (qrCode.isDark(row + 1, col + 1) ) count++;
                if (count === 0 || count === 4) {
                    lostPoint += 3;
                }
            }
        }

        // LEVEL3

        for (row = 0; row < moduleCount; row++) {
            for (col = 0; col < moduleCount - 6; col++) {
                if (qrCode.isDark(row, col) && 
                        !qrCode.isDark(row, col + 1) && 
                         qrCode.isDark(row, col + 2) && 
                         qrCode.isDark(row, col + 3) && 
                         qrCode.isDark(row, col + 4) && 
                        !qrCode.isDark(row, col + 5) && 
                         qrCode.isDark(row, col + 6) ) {
                    lostPoint += 40;
                }
            }
        }

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount - 6; row++) {
                if (qrCode.isDark(row, col) &&
                        !qrCode.isDark(row + 1, col) &&
                         qrCode.isDark(row + 2, col) &&
                         qrCode.isDark(row + 3, col) &&
                         qrCode.isDark(row + 4, col) &&
                        !qrCode.isDark(row + 5, col) &&
                         qrCode.isDark(row + 6, col) ) {
                    lostPoint += 40;
                }
            }
        }

        // LEVEL4
        
        var darkCount = 0;

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount; row++) {
                if (qrCode.isDark(row, col) ) {
                    darkCount++;
                }
            }
        }
        
        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;       
    }

};

module.exports = QRUtil;

  };
  defs['index']=function(module,require){
//---------------------------------------------------------------------
// QRCode for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of 
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------
// Modified to work in node for this project (and some refactoring)
//---------------------------------------------------------------------

var QR8bitByte = require('./QR8bitByte');
var QRUtil = require('./QRUtil');
var QRPolynomial = require('./QRPolynomial');
var QRRSBlock = require('./QRRSBlock');
var QRBitBuffer = require('./QRBitBuffer');

function QRCode(typeNumber, errorCorrectLevel) {
	this.typeNumber = typeNumber;
	this.errorCorrectLevel = errorCorrectLevel;
	this.modules = null;
	this.moduleCount = 0;
	this.dataCache = null;
	this.dataList = [];
}

QRCode.prototype = {
	
	addData : function(data) {
		var newData = new QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	},
	
	isDark : function(row, col) {
		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
			throw new Error(row + "," + col);
		}
		return this.modules[row][col];
	},

	getModuleCount : function() {
		return this.moduleCount;
	},
	
	make : function() {
		// Calculate automatically typeNumber if provided is < 1
		if (this.typeNumber < 1 ){
			var typeNumber = 1;
			for (typeNumber = 1; typeNumber < 40; typeNumber++) {
				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);

				var buffer = new QRBitBuffer();
				var totalDataCount = 0;
				for (var i = 0; i < rsBlocks.length; i++) {
					totalDataCount += rsBlocks[i].dataCount;
				}

				for (var x = 0; x < this.dataList.length; x++) {
					var data = this.dataList[x];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}
				if (buffer.getLengthInBits() <= totalDataCount * 8)
					break;
			}
			this.typeNumber = typeNumber;
		}
		this.makeImpl(false, this.getBestMaskPattern() );
	},
	
	makeImpl : function(test, maskPattern) {
		
		this.moduleCount = this.typeNumber * 4 + 17;
		this.modules = new Array(this.moduleCount);
		
		for (var row = 0; row < this.moduleCount; row++) {
			
			this.modules[row] = new Array(this.moduleCount);
			
			for (var col = 0; col < this.moduleCount; col++) {
				this.modules[row][col] = null;//(col + row) % 3;
			}
		}
	
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(this.moduleCount - 7, 0);
		this.setupPositionProbePattern(0, this.moduleCount - 7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
	
		if (this.dataCache === null) {
			this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
		}
	
		this.mapData(this.dataCache, maskPattern);
	},

	setupPositionProbePattern : function(row, col)  {
		
		for (var r = -1; r <= 7; r++) {
			
			if (row + r <= -1 || this.moduleCount <= row + r) continue;
			
			for (var c = -1; c <= 7; c++) {
				
				if (col + c <= -1 || this.moduleCount <= col + c) continue;
				
				if ( (0 <= r && r <= 6 && (c === 0 || c === 6) ) || 
                     (0 <= c && c <= 6 && (r === 0 || r === 6) ) || 
                     (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
					this.modules[row + r][col + c] = true;
				} else {
					this.modules[row + r][col + c] = false;
				}
			}		
		}		
	},
	
	getBestMaskPattern : function() {
	
		var minLostPoint = 0;
		var pattern = 0;
	
		for (var i = 0; i < 8; i++) {
			
			this.makeImpl(true, i);
	
			var lostPoint = QRUtil.getLostPoint(this);
	
			if (i === 0 || minLostPoint >  lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
	
		return pattern;
	},
	
	createMovieClip : function(target_mc, instance_name, depth) {
	
		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		var cs = 1;
	
		this.make();

		for (var row = 0; row < this.modules.length; row++) {
			
			var y = row * cs;
			
			for (var col = 0; col < this.modules[row].length; col++) {
	
				var x = col * cs;
				var dark = this.modules[row][col];
			
				if (dark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		
		return qr_mc;
	},

	setupTimingPattern : function() {
		
		for (var r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] !== null) {
				continue;
			}
			this.modules[r][6] = (r % 2 === 0);
		}
	
		for (var c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] !== null) {
				continue;
			}
			this.modules[6][c] = (c % 2 === 0);
		}
	},
	
	setupPositionAdjustPattern : function() {
	
		var pos = QRUtil.getPatternPosition(this.typeNumber);
		
		for (var i = 0; i < pos.length; i++) {
		
			for (var j = 0; j < pos.length; j++) {
			
				var row = pos[i];
				var col = pos[j];
				
				if (this.modules[row][col] !== null) {
					continue;
				}
				
				for (var r = -2; r <= 2; r++) {
				
					for (var c = -2; c <= 2; c++) {
					
						if (Math.abs(r) === 2 || 
                            Math.abs(c) === 2 ||
                            (r === 0 && c === 0) ) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			}
		}
	},
	
	setupTypeNumber : function(test) {
	
		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        var mod;
	
		for (var i = 0; i < 18; i++) {
			mod = (!test && ( (bits >> i) & 1) === 1);
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
		}
	
		for (var x = 0; x < 18; x++) {
			mod = (!test && ( (bits >> x) & 1) === 1);
			this.modules[x % 3 + this.moduleCount - 8 - 3][Math.floor(x / 3)] = mod;
		}
	},
	
	setupTypeInfo : function(test, maskPattern) {
	
		var data = (this.errorCorrectLevel << 3) | maskPattern;
		var bits = QRUtil.getBCHTypeInfo(data);
        var mod;
	
		// vertical		
		for (var v = 0; v < 15; v++) {
	
			mod = (!test && ( (bits >> v) & 1) === 1);
	
			if (v < 6) {
				this.modules[v][8] = mod;
			} else if (v < 8) {
				this.modules[v + 1][8] = mod;
			} else {
				this.modules[this.moduleCount - 15 + v][8] = mod;
			}
		}
	
		// horizontal
		for (var h = 0; h < 15; h++) {
	
			mod = (!test && ( (bits >> h) & 1) === 1);
			
			if (h < 8) {
				this.modules[8][this.moduleCount - h - 1] = mod;
			} else if (h < 9) {
				this.modules[8][15 - h - 1 + 1] = mod;
			} else {
				this.modules[8][15 - h - 1] = mod;
			}
		}
	
		// fixed module
		this.modules[this.moduleCount - 8][8] = (!test);
	
	},
	
	mapData : function(data, maskPattern) {
		
		var inc = -1;
		var row = this.moduleCount - 1;
		var bitIndex = 7;
		var byteIndex = 0;
		
		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
	
			if (col === 6) col--;
	
			while (true) {
	
				for (var c = 0; c < 2; c++) {
					
					if (this.modules[row][col - c] === null) {
						
						var dark = false;
	
						if (byteIndex < data.length) {
							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
						}
	
						var mask = QRUtil.getMask(maskPattern, row, col - c);
	
						if (mask) {
							dark = !dark;
						}
						
						this.modules[row][col - c] = dark;
						bitIndex--;
	
						if (bitIndex === -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
				}
								
				row += inc;
	
				if (row < 0 || this.moduleCount <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
		
	}

};

QRCode.PAD0 = 0xEC;
QRCode.PAD1 = 0x11;

QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
	
	var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
	
	var buffer = new QRBitBuffer();
	
	for (var i = 0; i < dataList.length; i++) {
		var data = dataList[i];
		buffer.put(data.mode, 4);
		buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
		data.write(buffer);
	}

	// calc num max data.
	var totalDataCount = 0;
	for (var x = 0; x < rsBlocks.length; x++) {
		totalDataCount += rsBlocks[x].dataCount;
	}

	if (buffer.getLengthInBits() > totalDataCount * 8) {
		throw new Error("code length overflow. (" + 
            buffer.getLengthInBits() + 
            ">" +  
            totalDataCount * 8 + 
            ")");
	}

	// end code
	if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
		buffer.put(0, 4);
	}

	// padding
	while (buffer.getLengthInBits() % 8 !== 0) {
		buffer.putBit(false);
	}

	// padding
	while (true) {
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD0, 8);
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD1, 8);
	}

	return QRCode.createBytes(buffer, rsBlocks);
};

QRCode.createBytes = function(buffer, rsBlocks) {

	var offset = 0;
	
	var maxDcCount = 0;
	var maxEcCount = 0;
	
	var dcdata = new Array(rsBlocks.length);
	var ecdata = new Array(rsBlocks.length);
	
	for (var r = 0; r < rsBlocks.length; r++) {

		var dcCount = rsBlocks[r].dataCount;
		var ecCount = rsBlocks[r].totalCount - dcCount;

		maxDcCount = Math.max(maxDcCount, dcCount);
		maxEcCount = Math.max(maxEcCount, ecCount);
		
		dcdata[r] = new Array(dcCount);
		
		for (var i = 0; i < dcdata[r].length; i++) {
			dcdata[r][i] = 0xff & buffer.buffer[i + offset];
		}
		offset += dcCount;
		
		var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
		var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

		var modPoly = rawPoly.mod(rsPoly);
		ecdata[r] = new Array(rsPoly.getLength() - 1);
		for (var x = 0; x < ecdata[r].length; x++) {
            var modIndex = x + modPoly.getLength() - ecdata[r].length;
			ecdata[r][x] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
		}

	}
	
	var totalCodeCount = 0;
	for (var y = 0; y < rsBlocks.length; y++) {
		totalCodeCount += rsBlocks[y].totalCount;
	}

	var data = new Array(totalCodeCount);
	var index = 0;

	for (var z = 0; z < maxDcCount; z++) {
		for (var s = 0; s < rsBlocks.length; s++) {
			if (z < dcdata[s].length) {
				data[index++] = dcdata[s][z];
			}
		}
	}

	for (var xx = 0; xx < maxEcCount; xx++) {
		for (var t = 0; t < rsBlocks.length; t++) {
			if (xx < ecdata[t].length) {
				data[index++] = ecdata[t][xx];
			}
		}
	}

	return data;

};

module.exports = QRCode;

  };
  return req('index');
})();