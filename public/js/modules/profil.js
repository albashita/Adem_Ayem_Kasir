/**
 * Adem Ayem - Profil Module
 * Modal profil pengguna, perubahan nama/username/password, dan visibilitas password.
 */

function editProfile(on) {
  const modal = document.getElementById('profileModal');
  if (!modal) return;

  if (on) {
    const u = currentUser();
    if (u) {
      const nameInput = document.getElementById('myName');
      if (nameInput) nameInput.value = u.name;
      const userInput = document.getElementById('myUser');
      if (userInput) userInput.value = u.username;
    }
    ['myOldPass', 'myPass', 'myPassConfirm'].forEach(id => {
      const i = document.getElementById(id);
      if (i) { i.value = ''; i.type = 'password'; }
    });
    document.querySelectorAll('#profileModal .eye-btn').forEach(b => b.classList.remove('shown'));
    const modalMsg = document.getElementById('modalMsg');
    if (modalMsg) modalMsg.textContent = '';
    const profileMsg = document.getElementById('profileMsg');
    if (profileMsg) profileMsg.textContent = '';
  }
  modal.style.display = on ? 'flex' : 'none';
}

function renderProfil() {
  const u = currentUser();
  if (!u) return;

  const heroName = document.getElementById('heroName');
  if (heroName) heroName.textContent = u.name;

  editProfile(false);
}

async function saveProfile() {
  const u = currentUser();
  if (!u) return;

  const msg = document.getElementById('modalMsg');
  const name = document.getElementById('myName')?.value.trim() || '';
  const username = document.getElementById('myUser')?.value.trim() || '';
  const password = document.getElementById('myPass')?.value || '';
  const current_password = document.getElementById('myOldPass')?.value || '';
  const password_confirmation = document.getElementById('myPassConfirm')?.value || '';

  if (!name || !username) {
    if (msg) msg.textContent = 'Nama dan username wajib diisi.';
    return;
  }
  if (password && !current_password) {
    if (msg) msg.textContent = 'Isi password lama untuk mengganti password.';
    return;
  }
  if (password !== password_confirmation) {
    if (msg) msg.textContent = 'Konfirmasi password tidak sama.';
    return;
  }

  try {
    const res = await fetch(ROUTE_URLS.profil, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      },
      body: JSON.stringify({ name, username, password, current_password, password_confirmation })
    });

    const data = await res.json();
    if (!res.ok) {
      if (msg) {
        msg.textContent = data.errors ? Object.values(data.errors)[0][0] : (data.message || 'Gagal menyimpan.');
      }
      return;
    }

    u.name = data.name;
    u.username = data.username;

    const userChip = document.getElementById('userChip');
    if (userChip) userChip.textContent = u.name + ' (' + u.role + ')';

    const heroName = document.getElementById('heroName');
    if (heroName) heroName.textContent = u.name;

    editProfile(false);

    const profileMsg = document.getElementById('profileMsg');
    if (profileMsg) profileMsg.textContent = 'Profil berhasil diperbarui.';
  } catch (e) {
    if (msg) msg.textContent = 'Terjadi kesalahan jaringan.';
  }
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  if (btn) btn.classList.toggle('shown', show);
}
