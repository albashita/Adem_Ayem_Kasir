/**
 * Adem Ayem - Users Module (Client-Side Storage Fallback)
 * Pengelolaan data user berbasis LocalStorage.
 */

let editingUserId = null;

function renderUsers() {
  const userBody = document.getElementById('userBody');
  if (!userBody) return;

  userBody.innerHTML = getUsers().map(u => `
    <tr>
      <td>${escapeMenuHTML(u.name)}</td>
      <td>${escapeMenuHTML(u.username)}</td>
      <td><span class="tag tag-${u.role}">${u.role}</span></td>
      <td class="row-actions">
        <button onclick="editUser('${u.id}')">Ubah</button>
        <button class="del" onclick="deleteUser('${u.id}')">Hapus</button>
      </td>
    </tr>
  `).join('');
}

function saveUser() {
  const name = document.getElementById('uName').value.trim();
  const username = document.getElementById('uUser').value.trim();
  const password = document.getElementById('uPass').value;
  const role = document.getElementById('uRole').value;

  if (!name || !username || !password) {
    alert('Semua kolom wajib diisi.');
    return;
  }

  let users = getUsers();
  if (editingUserId) {
    users = users.map(u => u.id === editingUserId ? { ...u, name, username, password, role } : u);
    editingUserId = null;
    document.getElementById('uSaveBtn').textContent = 'Simpan';
  } else {
    if (users.some(u => u.username === username)) {
      alert('Username sudah dipakai.');
      return;
    }
    users.push({ id: 'u' + Date.now(), name, username, password, role });
  }

  setUsers(users);
  document.getElementById('uName').value = '';
  document.getElementById('uUser').value = '';
  document.getElementById('uPass').value = '';
  renderUsers();
}

function editUser(id) {
  const u = getUsers().find(x => x.id === id);
  if (!u) return;

  document.getElementById('uName').value = u.name;
  document.getElementById('uUser').value = u.username;
  document.getElementById('uPass').value = u.password;
  document.getElementById('uRole').value = u.role;
  editingUserId = id;
  document.getElementById('uSaveBtn').textContent = 'Update';
}

function deleteUser(id) {
  if (getUsers().length <= 1) {
    alert('Minimal harus ada satu pengguna.');
    return;
  }
  if (currentUser() && id === currentUser().id) {
    alert('Tidak bisa menghapus akun sendiri.');
    return;
  }
  if (!confirm('Hapus pengguna ini?')) return;

  setUsers(getUsers().filter(u => u.id !== id));
  renderUsers();
}
