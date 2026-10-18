
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Daftar Menu - Adem Ayem</title>
    <link rel="stylesheet" href="{{ asset('css/qr-menu.css') }}">
</head>
<body>
    <header class="menu-header">
        <p class="brand">ADEM AYEM</p>
        <h1>Daftar Menu</h1>
        <p class="subtitle">Hidangan pilihan untuk menemani harimu.</p>
    </header>

    <main class="menu-container">
        <div class="menu-filters">
            <input
                type="search"
                id="menuSearch"
                placeholder="Cari nama menu..."
                aria-label="Cari menu"
            >

            <div class="category-dropdown" id="categoryDropdown">
                <button
                    type="button"
                    class="category-trigger"
                    id="categoryTrigger"
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-controls="categoryOptions"
                >
                    <span id="categoryLabel">Semua kategori</span>
                    <span class="category-arrow" aria-hidden="true">⌄</span>
                </button>

                <div
                    class="category-options"
                    id="categoryOptions"
                    role="group"
                    aria-label="Pilih kategori"
                    hidden
                >
                    <button
                        type="button"
                        class="category-option active"
                        data-value=""
                    >
                        Semua kategori
                    </button>
                </div>
            </div>

            <select id="categoryFilter" aria-label="Pilih kategori" hidden>
                <option value="">Semua kategori</option>
            </select>
        </div>

        <p id="menuStatus" class="menu-status">Memuat menu...</p>
        <section id="menuList" class="menu-grid"></section>
    </main>

    <footer class="menu-footer">
        Terima kasih telah berkunjung ke Adem Ayem.
    </footer>

    <script>
        const menuList = document.getElementById('menuList');
        const menuStatus = document.getElementById('menuStatus');
        const menuSearch = document.getElementById('menuSearch');
        const categoryFilter = document.getElementById('categoryFilter');

        const categoryDropdown = document.getElementById('categoryDropdown');
        const categoryTrigger = document.getElementById('categoryTrigger');
        const categoryLabel = document.getElementById('categoryLabel');
        const categoryOptions = document.getElementById('categoryOptions');

        let menus = [];

        function escapeHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            })[char]);
        }

        function setDropdownOpen(open) {
            categoryOptions.hidden = !open;
            categoryDropdown.classList.toggle('open', open);
            categoryTrigger.setAttribute('aria-expanded', String(open));
        }

        function selectCategory(value, label) {
            categoryFilter.value = value;
            categoryLabel.textContent = label;

            categoryOptions.querySelectorAll('.category-option')
                .forEach(button => {
                    const active = button.dataset.value === value;
                    button.classList.toggle('active', active);

                    if (active) {
                        button.setAttribute('aria-pressed', 'true');
                    } else {
                        button.setAttribute('aria-pressed', 'false');
                    }
                });

            setDropdownOpen(false);
            renderMenus();
        }

        function renderCategoryOptions(categories) {
            categoryOptions.innerHTML = '';

            const allCategories = [
                { value: '', label: 'Semua kategori' },
                ...categories.map(name => ({ value: name, label: name }))
            ];

            allCategories.forEach(category => {
                const button = document.createElement('button');

                button.type = 'button';
                button.className = 'category-option';
                button.dataset.value = category.value;
                button.textContent = category.label;
                button.setAttribute('aria-pressed', 'false');

                button.addEventListener('click', () => {
                    selectCategory(category.value, category.label);
                });

                categoryOptions.appendChild(button);
            });

            selectCategory('', 'Semua kategori');
        }

        function renderMenus() {
            const keyword = menuSearch.value.trim().toLowerCase();
            const selectedCategory = categoryFilter.value;

            const filtered = menus.filter(menu => {
                const name = String(menu.name || '').toLowerCase();
                const category = String(menu.category?.name || '');

                return name.includes(keyword) &&
                    (!selectedCategory || category === selectedCategory);
            });

            if (!filtered.length) {
                menuList.innerHTML = '';
                menuStatus.hidden = false;
                menuStatus.textContent = menus.length
                    ? 'Menu yang dicari tidak ditemukan.'
                    : 'Belum ada menu yang tersedia.';
                return;
            }

            menuStatus.hidden = true;

            menuList.innerHTML = filtered.map(menu => {
                const photo = menu.image_url
                    ? `<img src="${escapeHTML(menu.image_url)}"
                            alt="${escapeHTML(menu.name)}"
                            loading="lazy"
                            onerror="this.style.display='none';">`
                    : '<div class="no-photo">Foto belum tersedia</div>';

                const price = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0
                }).format(Number(menu.price) || 0);

                return `
                    <article class="menu-card">
                        <div class="menu-photo">${photo}</div>
                        <div class="menu-info">
                            <span class="menu-category">
                                ${escapeHTML(menu.category?.name || 'Menu')}
                            </span>
                            <h2>${escapeHTML(menu.name)}</h2>
                            <p>${escapeHTML(
                                menu.description || 'Menu pilihan Adem Ayem.'
                            )}</p>
                            <strong>${price}</strong>
                        </div>
                    </article>
                `;
            }).join('');
        }

        async function loadMenus() {
            try {
                const response = await fetch('/qr-menu/data', {
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    throw new Error('Gagal mengambil data menu.');
                }

                menus = await response.json();

                const categories = [
                    ...new Set(
                        menus.map(menu => menu.category?.name).filter(Boolean)
                    )
                ];

                categoryFilter.innerHTML =
                    '<option value="">Semua kategori</option>' +
                    categories.map(name =>
                        `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
                    ).join('');

                renderCategoryOptions(categories);
                renderMenus();
            } catch (error) {
                menuStatus.hidden = false;
                menuStatus.textContent =
                    'Menu gagal dimuat. Silakan muat ulang halaman.';
                console.error(error);
            }
        }

        categoryTrigger.addEventListener('click', () => {
            setDropdownOpen(categoryOptions.hidden);
        });

        document.addEventListener('click', event => {
            if (!categoryDropdown.contains(event.target)) {
                setDropdownOpen(false);
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                setDropdownOpen(false);
                categoryTrigger.focus();
            }
        });

        menuSearch.addEventListener('input', renderMenus);
        categoryFilter.addEventListener('change', renderMenus);

        loadMenus();
    </script>
</body>
</html>
