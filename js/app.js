/**
 * Kalkulator Bengkel Ban & Cuci Kendaraan (POS & Tarif Management)
 * Dilengkapi penyimpanan lokal (localStorage), cetak struk thermal, WhatsApp invoice,
 * dan pengelolaan harga layanan mandiri.
 */

// --- INITIAL STATE ---
let state = {
    profile: null,
    categories: [],
    services: [],
    transactions: [],
    
    // POS Active State
    cart: [],
    selectedVehicle: 'motor', // 'motor' | 'mobil'
    activeCategory: 'all',
    searchQuery: '',
    customerName: '',
    customerPhone: '',
    plateNumber: '',
    orderNote: '',
    discountType: 'nominal', // 'nominal' | 'percent'
    discountValue: 0,
    cashGiven: 0,
    paymentMethod: 'cash', // 'cash' | 'qris' | 'transfer' | 'bon'
    
    // Active Tab View
    activeTab: 'pos', // 'pos' | 'prices' | 'history' | 'settings'

    // History filter
    historyFilter: 'today', // 'today' | 'week' | 'month' | 'all'
    
    // Modals
    activeModal: null // 'customItem' | 'newService' | 'editService' | 'receipt' | 'editProfile'
};

// --- HELPER FORMATTERS ---
function formatRupiah(number) {
    const val = Number(number) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
}

function formatDate(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateId(prefix = 'tx') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// --- LOCAL STORAGE MANAGER ---
function loadData() {
    try {
        const savedProfile = localStorage.getItem('bengkel_profile');
        state.profile = savedProfile ? JSON.parse(savedProfile) : { ...DEFAULT_PROFILE };

        const savedCategories = localStorage.getItem('bengkel_categories');
        state.categories = savedCategories ? JSON.parse(savedCategories) : [ ...DEFAULT_CATEGORIES ];

        const savedServices = localStorage.getItem('bengkel_services');
        state.services = savedServices ? JSON.parse(savedServices) : [ ...DEFAULT_SERVICES ];

        const savedTransactions = localStorage.getItem('bengkel_transactions');
        state.transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (e) {
        console.error("Error loading localStorage data:", e);
        state.profile = { ...DEFAULT_PROFILE };
        state.categories = [ ...DEFAULT_CATEGORIES ];
        state.services = [ ...DEFAULT_SERVICES ];
        state.transactions = [];
    }
}

function saveProfile() {
    localStorage.setItem('bengkel_profile', JSON.stringify(state.profile));
}

function saveServices() {
    localStorage.setItem('bengkel_services', JSON.stringify(state.services));
}

function saveTransactions() {
    localStorage.setItem('bengkel_transactions', JSON.stringify(state.transactions));
}

// --- CALCULATION LOGIC ---
function calculateTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    
    let discountAmount = 0;
    if (state.discountType === 'percent') {
        const pct = Math.min(100, Math.max(0, Number(state.discountValue) || 0));
        discountAmount = Math.round(subtotal * (pct / 100));
    } else {
        discountAmount = Math.min(subtotal, Math.max(0, Number(state.discountValue) || 0));
    }

    const total = Math.max(0, subtotal - discountAmount);
    const cash = Number(state.cashGiven) || 0;
    const change = cash - total;

    return {
        subtotal,
        discountAmount,
        total,
        cash,
        change
    };
}

// --- INITIALIZE & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initUI();
    renderAll();
    startClock();
});

function startClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) + ' • ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    updateTime();
    setInterval(updateTime, 1000);
}

function initUI() {
    // Navigation tabs
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = btn.getAttribute('data-tab-target');
            switchTab(target);
        });
    });

    // Vehicle Switcher (Motor / Mobil)
    document.getElementById('btn-vehicle-motor')?.addEventListener('click', () => setVehicle('motor'));
    document.getElementById('btn-vehicle-mobil')?.addEventListener('click', () => setVehicle('mobil'));

    // Search input
    const searchInput = document.getElementById('search-service-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
            renderCatalog();
        });
    }

    // Discount Inputs
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');
    if (discountTypeSelect) {
        discountTypeSelect.addEventListener('change', (e) => {
            state.discountType = e.target.value;
            renderCart();
        });
    }
    if (discountValueInput) {
        discountValueInput.addEventListener('input', (e) => {
            state.discountValue = Number(e.target.value) || 0;
            renderCart();
        });
    }

    // Cash Given Input
    const cashInput = document.getElementById('cash-input');
    if (cashInput) {
        cashInput.addEventListener('input', (e) => {
            state.cashGiven = Number(e.target.value) || 0;
            renderCartTotalsOnly();
        });
    }

    // Quick Cash Buttons
    document.querySelectorAll('.btn-quick-cash').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.getAttribute('data-amount');
            const totals = calculateTotals();
            if (amount === 'exact') {
                state.cashGiven = totals.total;
            } else {
                state.cashGiven = Number(amount);
            }
            if (cashInput) cashInput.value = state.cashGiven;
            renderCartTotalsOnly();
        });
    });

    // Payment Method Radio
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.paymentMethod = e.target.value;
            const cashSection = document.getElementById('cash-calculation-section');
            if (cashSection) {
                if (state.paymentMethod === 'cash') {
                    cashSection.classList.remove('hidden');
                } else {
                    cashSection.classList.add('hidden');
                    state.cashGiven = calculateTotals().total;
                }
            }
            renderCartTotalsOnly();
        });
    });

    // Customer, Phone & Plate inputs
    document.getElementById('input-customer-name')?.addEventListener('input', (e) => {
        state.customerName = e.target.value;
    });
    document.getElementById('input-customer-phone')?.addEventListener('input', (e) => {
        state.customerPhone = e.target.value;
    });
    document.getElementById('input-plate-number')?.addEventListener('input', (e) => {
        state.plateNumber = e.target.value.toUpperCase();
        e.target.value = state.plateNumber;
    });
    document.getElementById('input-order-notes')?.addEventListener('input', (e) => {
        state.orderNote = e.target.value;
    });

    // Reset Cart
    document.getElementById('btn-clear-cart')?.addEventListener('click', clearCart);

    // Complete / Checkout Button
    document.getElementById('btn-checkout')?.addEventListener('click', processCheckout);

    // Custom Item Modal
    document.getElementById('btn-add-custom-item')?.addEventListener('click', openCustomItemModal);
    document.getElementById('form-custom-item')?.addEventListener('submit', handleAddCustomItem);

    // Master Prices Page: Add Service
    document.getElementById('btn-add-service-master')?.addEventListener('click', () => openServiceModal());
    document.getElementById('form-service-master')?.addEventListener('submit', handleSaveServiceMaster);

    // Profile Settings Form
    document.getElementById('form-bengkel-profile')?.addEventListener('submit', handleSaveProfile);

    // Backup & Restore
    document.getElementById('btn-export-data')?.addEventListener('click', exportDataJSON);
    document.getElementById('input-import-data')?.addEventListener('change', importDataJSON);
    document.getElementById('btn-reset-default-prices')?.addEventListener('click', resetToDefaultPrices);

    // History filter buttons
    document.querySelectorAll('[data-history-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.historyFilter = btn.getAttribute('data-history-filter');
            document.querySelectorAll('[data-history-filter]').forEach(b => b.classList.remove('active', 'bg-blue-600', 'text-white'));
            btn.classList.add('active', 'bg-blue-600', 'text-white');
            renderHistory();
        });
    });

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

function renderAll() {
    renderWorkshopHeader();
    renderCatalogCategories();
    renderCatalog();
    renderCart();
    renderPricesTable();
    renderHistory();
    renderProfileForm();
}

// --- WORKSHOP HEADER & PROFILE ---
function renderWorkshopHeader() {
    const nameEl = document.getElementById('header-bengkel-name');
    const taglineEl = document.getElementById('header-bengkel-tagline');
    const phoneEl = document.getElementById('header-bengkel-phone');

    if (nameEl) nameEl.textContent = state.profile.name;
    if (taglineEl) taglineEl.textContent = state.profile.tagline;
    if (phoneEl) phoneEl.textContent = state.profile.phone;
}

function renderProfileForm() {
    const fName = document.getElementById('settings-name');
    const fTagline = document.getElementById('settings-tagline');
    const fPhone = document.getElementById('settings-phone');
    const fAddress = document.getElementById('settings-address');
    const fFooter = document.getElementById('settings-receipt-footer');

    if (fName) fName.value = state.profile.name || '';
    if (fTagline) fTagline.value = state.profile.tagline || '';
    if (fPhone) fPhone.value = state.profile.phone || '';
    if (fAddress) fAddress.value = state.profile.address || '';
    if (fFooter) fFooter.value = state.profile.receiptFooter || '';
}

function handleSaveProfile(e) {
    e.preventDefault();
    state.profile = {
        name: document.getElementById('settings-name').value.trim() || DEFAULT_PROFILE.name,
        tagline: document.getElementById('settings-tagline').value.trim(),
        phone: document.getElementById('settings-phone').value.trim(),
        address: document.getElementById('settings-address').value.trim(),
        receiptFooter: document.getElementById('settings-receipt-footer').value.trim()
    };
    saveProfile();
    renderWorkshopHeader();
    showToast('Profil bengkel berhasil diperbarui!');
}

// --- VEHICLE SWITCHER ---
function setVehicle(type) {
    state.selectedVehicle = type;
    const btnMotor = document.getElementById('btn-vehicle-motor');
    const btnMobil = document.getElementById('btn-vehicle-mobil');

    if (type === 'motor') {
        btnMotor?.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        btnMotor?.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-50');
        btnMobil?.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        btnMobil?.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-50');
    } else {
        btnMobil?.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        btnMobil?.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-50');
        btnMotor?.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        btnMotor?.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-50');
    }

    // Update cart item prices matching the current vehicle selection if user wants or keep added items
    renderCatalog();
}

// --- TAB SWITCHER ---
function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Nav tabs styling
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
        if (btn.getAttribute('data-tab-target') === tabId) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('text-slate-600', 'hover:bg-slate-100');
        }
    });

    // Show/hide sections
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    const activeSection = document.getElementById(`panel-${tabId}`);
    if (activeSection) activeSection.classList.remove('hidden');

    if (tabId === 'prices') {
        renderPricesTable();
    } else if (tabId === 'history') {
        renderHistory();
    }
}

// --- CATALOG CATEGORIES ---
function renderCatalogCategories() {
    const container = document.getElementById('category-filter-bar');
    if (!container) return;

    let html = `
        <button onclick="filterCategory('all')" 
            class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${state.activeCategory === 'all' ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            ⚡ Semua Layanan
        </button>
    `;

    state.categories.forEach(cat => {
        const isActive = state.activeCategory === cat.id;
        const iconEmoji = cat.id === 'tambal' ? '🔧' : cat.id === 'bongkar' ? '⚙️' : cat.id === 'cuci' ? '🧼' : '📦';
        html += `
            <button onclick="filterCategory('${cat.id}')" 
                class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                ${iconEmoji} ${cat.name}
            </button>
        `;
    });

    container.innerHTML = html;
}

window.filterCategory = function(catId) {
    state.activeCategory = catId;
    renderCatalogCategories();
    renderCatalog();
};

// --- CATALOG RENDERING (POS ITEMS) ---
function renderCatalog() {
    const grid = document.getElementById('catalog-items-grid');
    if (!grid) return;

    let filtered = state.services.filter(s => {
        // Filter by category
        if (state.activeCategory !== 'all' && s.categoryId !== state.activeCategory) {
            return false;
        }

        // Filter by vehicle applicability
        if (s.applicable !== 'both' && s.applicable !== state.selectedVehicle) {
            return false;
        }

        // Search query
        if (state.searchQuery) {
            const matchName = s.name.toLowerCase().includes(state.searchQuery);
            const matchDesc = (s.desc || '').toLowerCase().includes(state.searchQuery);
            if (!matchName && !matchDesc) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-400">
                <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="font-medium">Tidak ada layanan atau barang yang sesuai filter.</p>
                <p class="text-xs text-slate-400 mt-1">Coba ganti kategori, jenis kendaraan, atau tambah tarif di menu "Kelola Tarif".</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const currentPrice = state.selectedVehicle === 'motor' ? item.priceMotor : item.priceMobil;
        const inCartItem = state.cart.find(c => c.id === item.id);
        const qtyInCart = inCartItem ? inCartItem.qty : 0;
        
        let badgeColor = 'bg-slate-100 text-slate-600';
        if (item.categoryId === 'tambal') badgeColor = 'bg-amber-100 text-amber-800';
        else if (item.categoryId === 'bongkar') badgeColor = 'bg-blue-100 text-blue-800';
        else if (item.categoryId === 'cuci') badgeColor = 'bg-cyan-100 text-cyan-800';
        else if (item.categoryId === 'sparepart') badgeColor = 'bg-emerald-100 text-emerald-800';

        const categoryObj = state.categories.find(c => c.id === item.categoryId);
        const categoryName = categoryObj ? categoryObj.name : item.categoryId;

        return `
            <div class="service-card bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between relative group cursor-pointer hover:border-blue-500 shadow-sm"
                 onclick="addToCart('${item.id}')">
                ${qtyInCart > 0 ? `
                    <span class="absolute -top-2 -right-2 bg-blue-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">
                        ${qtyInCart}
                    </span>
                ` : ''}

                <div>
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}">
                            ${categoryName}
                        </span>
                        <span class="text-[11px] text-slate-400">
                            ${item.unit || 'unit'}
                        </span>
                    </div>
                    <h3 class="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                        ${item.name}
                    </h3>
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2">
                        ${item.desc || '-'}
                    </p>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <div class="text-[10px] text-slate-400 font-medium">Tarif ${state.selectedVehicle === 'motor' ? 'Motor' : 'Mobil'}</div>
                        <div class="text-base font-extrabold text-blue-600">
                            ${formatRupiah(currentPrice)}
                        </div>
                    </div>
                    <button type="button" 
                        class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                        title="Tambah ke struk">
                        +
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// --- CART OPERATIONS ---
window.addToCart = function(serviceId) {
    const service = state.services.find(s => s.id === serviceId);
    if (!service) return;

    const price = state.selectedVehicle === 'motor' ? service.priceMotor : service.priceMobil;
    const existingIndex = state.cart.findIndex(c => c.id === serviceId);

    if (existingIndex > -1) {
        state.cart[existingIndex].qty += 1;
    } else {
        state.cart.push({
            id: service.id,
            name: service.name,
            price: Number(price) || 0,
            qty: 1,
            unit: service.unit || 'unit',
            categoryId: service.categoryId,
            isCustom: false,
            vehicle: state.selectedVehicle
        });
    }

    renderCart();
    renderCatalog();
};

window.updateCartQty = function(id, delta) {
    const idx = state.cart.findIndex(c => c.id === id);
    if (idx === -1) return;

    state.cart[idx].qty += delta;
    if (state.cart[idx].qty <= 0) {
        state.cart.splice(idx, 1);
    }

    renderCart();
    renderCatalog();
};

window.removeCartItem = function(id) {
    state.cart = state.cart.filter(c => c.id !== id);
    renderCart();
    renderCatalog();
};

window.updateCartItemPrice = function(id, newPrice) {
    const item = state.cart.find(c => c.id === id);
    if (item) {
        item.price = Math.max(0, Number(newPrice) || 0);
        renderCart();
    }
};

function clearCart() {
    if (state.cart.length === 0) return;
    if (confirm('Kosongkan semua daftar layanan/barang di nota saat ini?')) {
        state.cart = [];
        state.discountValue = 0;
        state.cashGiven = 0;
        state.customerName = '';
        state.customerPhone = '';
        state.plateNumber = '';
        state.orderNote = '';

        const nameInput = document.getElementById('input-customer-name');
        const phoneInput = document.getElementById('input-customer-phone');
        const plateInput = document.getElementById('input-plate-number');
        const noteInput = document.getElementById('input-order-notes');
        const discountInput = document.getElementById('discount-value');
        const cashInput = document.getElementById('cash-input');

        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (plateInput) plateInput.value = '';
        if (noteInput) noteInput.value = '';
        if (discountInput) discountInput.value = '0';
        if (cashInput) cashInput.value = '0';

        renderCart();
        renderCatalog();
    }
}

// --- RENDER CART & TOTALS ---
function renderCart() {
    const container = document.getElementById('cart-items-container');
    const badgeCount = document.getElementById('cart-count-badge');
    if (badgeCount) badgeCount.textContent = `${state.cart.reduce((a, b) => a + b.qty, 0)} item`;

    if (!container) return;

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center text-slate-400">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl text-slate-300">
                    🛒
                </div>
                <p class="font-semibold text-slate-700 text-sm">Nota Belanja Kosong</p>
                <p class="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Klik layanan tambal, bongkar, cuci di samping untuk menambahkan ke nota.
                </p>
            </div>
        `;
        renderCartTotalsOnly();
        return;
    }

    container.innerHTML = state.cart.map(item => {
        const itemSubtotal = item.price * item.qty;
        return `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-2">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                        <div class="text-xs font-bold text-slate-800 leading-snug">
                            ${item.name}
                        </div>
                        <div class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>@</span>
                            <input type="number" 
                                value="${item.price}" 
                                onchange="updateCartItemPrice('${item.id}', this.value)"
                                class="w-20 px-1 py-0.5 text-xs font-semibold bg-white border border-slate-300 rounded text-slate-700 text-right focus:border-blue-500"
                                title="Klik untuk ubah harga satuan khusus item ini" />
                            <span class="text-[10px] text-slate-400">/${item.unit}</span>
                        </div>
                    </div>
                    <button onclick="removeCartItem('${item.id}')" 
                        class="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        title="Hapus item">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <!-- Qty Controls -->
                    <div class="flex items-center gap-1">
                        <button onclick="updateCartQty('${item.id}', -1)"
                            class="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 text-xs">
                            -
                        </button>
                        <span class="w-7 text-center font-bold text-xs text-slate-800">
                            ${item.qty}
                        </span>
                        <button onclick="updateCartQty('${item.id}', 1)"
                            class="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 text-xs">
                            +
                        </button>
                    </div>

                    <!-- Item Subtotal -->
                    <div class="text-xs font-black text-slate-800">
                        ${formatRupiah(itemSubtotal)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    renderCartTotalsOnly();
}

function renderCartTotalsOnly() {
    const totals = calculateTotals();

    const subtotalEl = document.getElementById('summary-subtotal');
    const discountEl = document.getElementById('summary-discount');
    const grandTotalEl = document.getElementById('summary-grandtotal');
    const changeEl = document.getElementById('summary-change');
    const changeContainer = document.getElementById('change-display-box');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(totals.subtotal);
    if (discountEl) discountEl.textContent = `- ${formatRupiah(totals.discountAmount)}`;
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(totals.total);

    if (changeEl && changeContainer) {
        if (state.paymentMethod === 'cash') {
            changeContainer.classList.remove('hidden');
            if (totals.change >= 0) {
                changeEl.textContent = formatRupiah(totals.change);
                changeEl.className = 'text-base font-extrabold text-emerald-600';
            } else {
                changeEl.textContent = `Kurang ${formatRupiah(Math.abs(totals.change))}`;
                changeEl.className = 'text-base font-extrabold text-rose-600';
            }
        } else {
            changeContainer.classList.add('hidden');
        }
    }
}

// --- CUSTOM ITEM MODAL (ON-THE-FLY) ---
function openCustomItemModal() {
    state.activeModal = 'customItem';
    const modal = document.getElementById('modal-custom-item');
    if (modal) modal.classList.remove('hidden');
}

function handleAddCustomItem(e) {
    e.preventDefault();
    const name = document.getElementById('custom-item-name').value.trim();
    const price = Number(document.getElementById('custom-item-price').value) || 0;
    const qty = Number(document.getElementById('custom-item-qty').value) || 1;
    const unit = document.getElementById('custom-item-unit').value.trim() || 'unit';

    if (!name || price <= 0) {
        alert('Mohon isi nama barang/layanan dan harga dengan benar.');
        return;
    }

    state.cart.push({
        id: generateId('custom'),
        name: name,
        price: price,
        qty: qty,
        unit: unit,
        categoryId: 'sparepart',
        isCustom: true,
        vehicle: state.selectedVehicle
    });

    closeModal();
    renderCart();
    // Reset form
    document.getElementById('form-custom-item')?.reset();
    showToast(`"${name}" berhasil ditambahkan ke nota!`);
}

// --- MASTER DATA: INPUT HARGA & TARIF MANDIRI ---
function renderPricesTable() {
    const tbody = document.getElementById('master-prices-tbody');
    const searchVal = (document.getElementById('search-master-price')?.value || '').toLowerCase();
    if (!tbody) return;

    let items = state.services.filter(s => {
        if (!searchVal) return true;
        return s.name.toLowerCase().includes(searchVal) || (s.desc || '').toLowerCase().includes(searchVal);
    });

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-400">
                    Tidak ada layanan ditemukan dalam database tarif.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map((item, idx) => {
        const categoryObj = state.categories.find(c => c.id === item.categoryId);
        const categoryName = categoryObj ? categoryObj.name : item.categoryId;
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-200">
                <td class="px-4 py-3 text-xs text-slate-400 font-mono">${idx + 1}</td>
                <td class="px-4 py-3">
                    <div class="font-bold text-slate-800 text-sm">${item.name}</div>
                    <div class="text-xs text-slate-400">${item.desc || '-'}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                        ${categoryName}
                    </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600 font-medium">
                    ${item.unit || 'unit'}
                </td>
                <td class="px-4 py-3 text-sm font-bold text-slate-800">
                    ${item.applicable === 'mobil' ? '<span class="text-slate-300 font-normal">-</span>' : formatRupiah(item.priceMotor)}
                </td>
                <td class="px-4 py-3 text-sm font-bold text-slate-800">
                    ${item.applicable === 'motor' ? '<span class="text-slate-300 font-normal">-</span>' : formatRupiah(item.priceMobil)}
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="editServiceMaster('${item.id}')"
                            class="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            Edit
                        </button>
                        <button onclick="deleteServiceMaster('${item.id}')"
                            class="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
                            Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openServiceModal = function(serviceId = null) {
    const modal = document.getElementById('modal-service-master');
    const titleEl = document.getElementById('modal-service-title');
    const form = document.getElementById('form-service-master');

    if (!modal || !form) return;

    if (serviceId) {
        const item = state.services.find(s => s.id === serviceId);
        if (!item) return;
        titleEl.textContent = 'Edit Tarif Layanan / Barang';
        document.getElementById('service-form-id').value = item.id;
        document.getElementById('service-form-name').value = item.name;
        document.getElementById('service-form-category').value = item.categoryId;
        document.getElementById('service-form-unit').value = item.unit || 'unit';
        document.getElementById('service-form-applicable').value = item.applicable || 'both';
        document.getElementById('service-form-price-motor').value = item.priceMotor || 0;
        document.getElementById('service-form-price-mobil').value = item.priceMobil || 0;
        document.getElementById('service-form-desc').value = item.desc || '';
    } else {
        titleEl.textContent = 'Tambah Layanan / Barang Baru';
        form.reset();
        document.getElementById('service-form-id').value = '';
    }

    modal.classList.remove('hidden');
};

window.editServiceMaster = function(serviceId) {
    openServiceModal(serviceId);
};

window.deleteServiceMaster = function(serviceId) {
    const item = state.services.find(s => s.id === serviceId);
    if (!item) return;

    if (confirm(`Hapus layanan "${item.name}" dari daftar tarif master?`)) {
        state.services = state.services.filter(s => s.id !== serviceId);
        saveServices();
        renderPricesTable();
        renderCatalog();
        showToast(`Layanan "${item.name}" berhasil dihapus.`);
    }
};

function handleSaveServiceMaster(e) {
    e.preventDefault();
    const id = document.getElementById('service-form-id').value;
    const name = document.getElementById('service-form-name').value.trim();
    const categoryId = document.getElementById('service-form-category').value;
    const unit = document.getElementById('service-form-unit').value.trim() || 'unit';
    const applicable = document.getElementById('service-form-applicable').value;
    const priceMotor = Number(document.getElementById('service-form-price-motor').value) || 0;
    const priceMobil = Number(document.getElementById('service-form-price-mobil').value) || 0;
    const desc = document.getElementById('service-form-desc').value.trim();

    if (!name) {
        alert('Nama layanan/barang wajib diisi.');
        return;
    }

    if (id) {
        // Update existing
        const idx = state.services.findIndex(s => s.id === id);
        if (idx > -1) {
            state.services[idx] = {
                ...state.services[idx],
                name, categoryId, unit, applicable, priceMotor, priceMobil, desc
            };
        }
    } else {
        // Create new
        const newService = {
            id: generateId('srv'),
            name, categoryId, unit, applicable, priceMotor, priceMobil, desc
        };
        state.services.push(newService);
    }

    saveServices();
    closeModal();
    renderPricesTable();
    renderCatalog();
    showToast(`Tarif layanan "${name}" berhasil disimpan!`);
}

function resetToDefaultPrices() {
    if (confirm('PERINGATAN: Semua tarif akan dikembalikan ke daftar harga default awal. Lanjutkan?')) {
        state.services = [ ...DEFAULT_SERVICES ];
        saveServices();
        renderPricesTable();
        renderCatalog();
        showToast('Tarif berhasil direset ke pengaturan default awal.');
    }
}

// --- BACKUP & RESTORE DATA (JSON) ---
function exportDataJSON() {
    const backupData = {
        exportedAt: new Date().toISOString(),
        profile: state.profile,
        services: state.services,
        categories: state.categories,
        transactions: state.transactions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup-bengkel-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Data berhasil diekspor ke file JSON!');
}

function importDataJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (data.services && Array.isArray(data.services)) {
                state.services = data.services;
                saveServices();
            }
            if (data.profile) {
                state.profile = { ...DEFAULT_PROFILE, ...data.profile };
                saveProfile();
            }
            if (data.transactions && Array.isArray(data.transactions)) {
                state.transactions = data.transactions;
                saveTransactions();
            }
            renderAll();
            showToast('Data berhasil diimpor!');
        } catch (err) {
            alert('File JSON tidak valid atau rusak!');
            console.error(err);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

// --- CHECKOUT & RECEIPT ENGINE ---
function processCheckout() {
    if (state.cart.length === 0) {
        alert('Daftar belanja masih kosong! Pilih layanan atau barang terlebih dahulu.');
        return;
    }

    const totals = calculateTotals();

    if (state.paymentMethod === 'cash' && totals.cash < totals.total) {
        if (!confirm(`Uang tunai kurang (${formatRupiah(Math.abs(totals.change))}). Apakah transaksi ini ingin tetap dicatat sebagai Belum Lunas / Bon?`)) {
            return;
        }
    }

    const transaction = {
        id: generateId('INV'),
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customerName: state.customerName || 'Pelanggan Umum',
        customerPhone: state.customerPhone || '',
        plateNumber: state.plateNumber || '-',
        vehicleType: state.selectedVehicle,
        orderNote: state.orderNote || '-',
        items: JSON.parse(JSON.stringify(state.cart)),
        subtotal: totals.subtotal,
        discountType: state.discountType,
        discountValue: state.discountValue,
        discountAmount: totals.discountAmount,
        total: totals.total,
        cash: state.paymentMethod === 'cash' ? totals.cash : totals.total,
        change: state.paymentMethod === 'cash' ? totals.change : 0,
        paymentMethod: state.paymentMethod
    };

    // Save transaction
    state.transactions.unshift(transaction);
    saveTransactions();

    // Show Receipt Modal
    openReceiptModal(transaction);

    // Reset current active cart
    state.cart = [];
    state.discountValue = 0;
    state.cashGiven = 0;
    state.customerName = '';
    state.customerPhone = '';
    state.plateNumber = '';
    state.orderNote = '';

    const nameInput = document.getElementById('input-customer-name');
    const phoneInput = document.getElementById('input-customer-phone');
    const plateInput = document.getElementById('input-plate-number');
    const noteInput = document.getElementById('input-order-notes');
    const discountInput = document.getElementById('discount-value');
    const cashInput = document.getElementById('cash-input');

    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (plateInput) plateInput.value = '';
    if (noteInput) noteInput.value = '';
    if (discountInput) discountInput.value = '0';
    if (cashInput) cashInput.value = '0';

    renderCart();
    renderCatalog();
    renderHistory();
}

function openReceiptModal(tx) {
    const modal = document.getElementById('modal-receipt');
    const receiptContent = document.getElementById('receipt-print-area');
    if (!modal || !receiptContent) return;

    receiptContent.innerHTML = generateReceiptHTML(tx);
    
    // Fill WhatsApp phone input in modal
    const waInput = document.getElementById('modal-wa-phone');
    if (waInput) {
        waInput.value = tx.customerPhone || '';
    }

    // Setup WhatsApp button
    const waBtn = document.getElementById('btn-send-whatsapp');
    if (waBtn) {
        waBtn.onclick = () => {
            const destPhone = waInput ? waInput.value.trim() : (tx.customerPhone || '');
            if (destPhone) {
                tx.customerPhone = destPhone;
                saveTransactions();
            }
            sendReceiptWhatsApp(tx, destPhone);
        };
    }

    // Setup Print button
    const printBtn = document.getElementById('btn-print-receipt');
    if (printBtn) {
        printBtn.onclick = () => window.print();
    }

    modal.classList.remove('hidden');
}

function generateReceiptHTML(tx) {
    const itemsRows = tx.items.map(item => `
        <div style="margin-bottom: 4px;">
            <div style="font-weight: bold; font-size: 13px;">${item.name}</div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563;">
                <span>${item.qty} ${item.unit} x ${formatRupiah(item.price)}</span>
                <span style="font-weight: 600; color: #111827;">${formatRupiah(item.qty * item.price)}</span>
            </div>
        </div>
    `).join('');

    const paymentLabel = tx.paymentMethod === 'cash' ? 'TUNAI' :
                         tx.paymentMethod === 'qris' ? 'QRIS' :
                         tx.paymentMethod === 'transfer' ? 'TRANSFER BANK' : 'BON / HUTANG';

    return `
        <div class="thermal-receipt p-6 bg-white border border-slate-200 rounded-xl max-w-sm mx-auto shadow-sm">
            <div style="text-align: center; margin-bottom: 12px;">
                <h2 style="font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase;">
                    ${state.profile.name}
                </h2>
                <p style="font-size: 11px; margin: 2px 0; color: #4b5563;">
                    ${state.profile.tagline || ''}
                </p>
                <p style="font-size: 11px; margin: 2px 0; color: #4b5563;">
                    ${state.profile.address || ''}
                </p>
                <p style="font-size: 11px; margin: 2px 0; font-weight: 600;">
                    WA/Telp: ${state.profile.phone || '-'}
                </p>
            </div>

            <div class="receipt-dashed-line"></div>

            <div style="font-size: 11px; line-height: 1.5;">
                <div style="display: flex; justify-content: space-between;">
                    <span>No. Nota:</span>
                    <span style="font-weight: bold;">${tx.invoiceNo}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Tanggal:</span>
                    <span>${formatDate(tx.date)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Pelanggan:</span>
                    <span style="font-weight: 600;">${tx.customerName}</span>
                </div>
                ${tx.customerPhone ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>WhatsApp:</span>
                    <span style="font-weight: 500;">${tx.customerPhone}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between;">
                    <span>Kendaraan:</span>
                    <span style="font-weight: 600;">${tx.vehicleType.toUpperCase()} ${tx.plateNumber ? `(${tx.plateNumber})` : ''}</span>
                </div>
            </div>

            <div class="receipt-dashed-line"></div>

            <div style="margin: 8px 0;">
                ${itemsRows}
            </div>

            <div class="receipt-dashed-line"></div>

            <div style="font-size: 12px; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Subtotal:</span>
                    <span>${formatRupiah(tx.subtotal)}</span>
                </div>
                ${tx.discountAmount > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #dc2626;">
                        <span>Diskon:</span>
                        <span>-${formatRupiah(tx.discountAmount)}</span>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; margin-top: 4px; border-top: 1px dashed #9ca3af; padding-top: 4px;">
                    <span>TOTAL BAYAR:</span>
                    <span>${formatRupiah(tx.total)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span>Metode:</span>
                    <span style="font-weight: bold;">${paymentLabel}</span>
                </div>
                ${tx.paymentMethod === 'cash' ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>Uang Tunai:</span>
                        <span>${formatRupiah(tx.cash)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: 700;">
                        <span>Kembalian:</span>
                        <span>${formatRupiah(tx.change)}</span>
                    </div>
                ` : ''}
            </div>

            <div class="receipt-double-line"></div>

            <div style="text-align: center; font-size: 11px; margin-top: 10px; color: #4b5563;">
                <p style="margin: 0; font-style: italic;">
                    "${state.profile.receiptFooter || 'Terima kasih atas kunjungan Anda!'}"
                </p>
                <p style="margin: 4px 0 0 0; font-size: 9px; color: #9ca3af;">
                    Dicetak via Aplikasi Kasir Bengkel
                </p>
            </div>
        </div>
    `;
}

function formatWhatsAppNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

function sendReceiptWhatsApp(tx, targetPhone) {
    let phone = targetPhone !== undefined ? targetPhone : (tx.customerPhone || '');
    let cleanPhone = formatWhatsAppNumber(phone);

    let itemsText = tx.items.map((it, idx) => 
        `${idx + 1}. *${it.name}* (${it.qty} ${it.unit}) = ${formatRupiah(it.price * it.qty)}`
    ).join('\n');

    const paymentLabel = tx.paymentMethod === 'cash' ? 'TUNAI' :
                         tx.paymentMethod === 'qris' ? 'QRIS' :
                         tx.paymentMethod === 'transfer' ? 'TRANSFER BANK' : 'BON / HUTANG';

    let waMessage = 
`*🧾 NOTA BENGKEL - ${state.profile.name.toUpperCase()}*
${state.profile.tagline ? `_${state.profile.tagline}_\n` : ''}${state.profile.address ? `📍 ${state.profile.address}\n` : ''}${state.profile.phone ? `📞 Kontak Bengkel: ${state.profile.phone}\n` : ''}
==============================
*No. Nota* : ${tx.invoiceNo}
*Tanggal*  : ${formatDate(tx.date)}
*Pelanggan*: ${tx.customerName || 'Pelanggan Umum'}
*Kendaraan*: ${tx.vehicleType.toUpperCase()} ${tx.plateNumber ? `(${tx.plateNumber})` : ''}
${tx.orderNote && tx.orderNote !== '-' ? `*Catatan*  : ${tx.orderNote}\n` : ''}
*📋 RINCIAN BIAYA:*
${itemsText}
==============================
*Subtotal* : ${formatRupiah(tx.subtotal)}
${tx.discountAmount > 0 ? `*Diskon*   : -${formatRupiah(tx.discountAmount)}\n` : ''}*TOTAL     : ${formatRupiah(tx.total)}*
*Metode*   : ${paymentLabel}
${tx.paymentMethod === 'cash' ? `*Bayar*    : ${formatRupiah(tx.cash)}\n*Kembalian*: ${formatRupiah(tx.change)}\n` : ''}
==============================
_${state.profile.receiptFooter || 'Terima kasih atas kunjungan Anda. Utamakan keselamatan berkendara!'}_
`;

    const encoded = encodeURIComponent(waMessage);
    const waUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;

    window.open(waUrl, '_blank');
}

// --- REPORT & HISTORY ---
function renderHistory() {
    const listContainer = document.getElementById('history-list-container');
    const totalOmsetEl = document.getElementById('stat-total-omset');
    const totalTxEl = document.getElementById('stat-total-tx');
    const avgTxEl = document.getElementById('stat-avg-tx');

    if (!listContainer) return;

    const now = new Date();
    let filteredTx = state.transactions.filter(tx => {
        const txDate = new Date(tx.date);
        if (state.historyFilter === 'today') {
            return txDate.toDateString() === now.toDateString();
        } else if (state.historyFilter === 'week') {
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            return txDate >= sevenDaysAgo;
        } else if (state.historyFilter === 'month') {
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const totalOmset = filteredTx.reduce((sum, tx) => sum + tx.total, 0);
    const count = filteredTx.length;
    const avg = count > 0 ? Math.round(totalOmset / count) : 0;

    if (totalOmsetEl) totalOmsetEl.textContent = formatRupiah(totalOmset);
    if (totalTxEl) totalTxEl.textContent = `${count} Transaksi`;
    if (avgTxEl) avgTxEl.textContent = formatRupiah(avg);

    if (filteredTx.length === 0) {
        listContainer.innerHTML = `
            <div class="py-12 text-center text-slate-400">
                <p class="font-medium">Belum ada riwayat transaksi pada periode ini.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filteredTx.map(tx => {
        const itemsSummary = tx.items.map(i => `${i.name} (x${i.qty})`).join(', ');
        return `
            <div class="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-900">${tx.invoiceNo}</span>
                        <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${tx.vehicleType === 'motor' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                            ${tx.vehicleType}
                        </span>
                        <span class="text-xs text-slate-400">• ${formatDate(tx.date)}</span>
                    </div>
                    <div class="text-sm font-semibold text-slate-800 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>${tx.customerName} <span class="text-slate-400 font-normal">(${tx.plateNumber})</span></span>
                        ${tx.customerPhone ? `<span class="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono border border-emerald-200">📱 ${tx.customerPhone}</span>` : ''}
                    </div>
                    <div class="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        ${itemsSummary}
                    </div>
                </div>

                <div class="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div class="text-right mr-1">
                        <div class="text-[11px] text-slate-400">Total Biaya</div>
                        <div class="text-base font-extrabold text-blue-600">${formatRupiah(tx.total)}</div>
                    </div>
                    <button onclick="sendDirectWhatsApp('${tx.id}')"
                        class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1">
                        <span>💬</span>
                        <span>Kirim WA</span>
                    </button>
                    <button onclick="viewHistoryReceipt('${tx.id}')"
                        class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all">
                        Lihat Nota
                    </button>
                    <button onclick="deleteTransaction('${tx.id}')"
                        class="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Hapus transaksi">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.sendDirectWhatsApp = function(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;

    let phone = tx.customerPhone || '';
    if (!phone) {
        phone = prompt('Masukkan nomor WhatsApp pelanggan (contoh: 08123456789):', '');
        if (phone === null) return; // User batalkan
        phone = phone.trim();
        if (phone) {
            tx.customerPhone = phone;
            saveTransactions();
            renderHistory();
        }
    }
    sendReceiptWhatsApp(tx, phone);
};

window.viewHistoryReceipt = function(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (tx) {
        openReceiptModal(tx);
    }
};

window.deleteTransaction = function(txId) {
    if (confirm('Hapus transaksi ini dari riwayat?')) {
        state.transactions = state.transactions.filter(t => t.id !== txId);
        saveTransactions();
        renderHistory();
        showToast('Transaksi dihapus dari riwayat.');
    }
};

// --- MODAL UTILS ---
function closeModal() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    state.activeModal = null;
}

// --- TOAST NOTIFICATIONS ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-300';
    toast.innerHTML = `
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
