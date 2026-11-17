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

    // Admin Auth State
    isAdmin: false,
    adminPin: '1234',

    // History & Financial Report Filter
    historyFilter: 'month', // 'today' | 'week' | 'month' | 'year' | 'all'
    selectedFilterMonth: new Date().getMonth().toString(), // '0'..'11' or 'all'
    selectedFilterYear: new Date().getFullYear(),
    
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
        state.profile = savedProfile ? { ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) } : { ...DEFAULT_PROFILE };

        const savedCategories = localStorage.getItem('bengkel_categories');
        state.categories = savedCategories ? JSON.parse(savedCategories) : [ ...DEFAULT_CATEGORIES ];

        const savedServices = localStorage.getItem('bengkel_services');
        state.services = savedServices ? JSON.parse(savedServices) : [ ...DEFAULT_SERVICES ];

        const savedTransactions = localStorage.getItem('bengkel_transactions');
        state.transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

        const savedPin = localStorage.getItem('bengkel_admin_pin');
        state.adminPin = savedPin || '1234';

        // Check if admin is currently logged in in this session
        state.isAdmin = sessionStorage.getItem('bengkel_is_admin') === 'true';
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

    // Cash Clear Button
    document.getElementById('btn-cash-clear')?.addEventListener('click', () => {
        state.cashGiven = 0;
        if (cashInput) cashInput.value = '';
        renderCartTotalsOnly();
    });

    // Quick Cash Buttons (exact, 1000, 2000, 5000, 10000, 20000, 50000, 100000)
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

    // Add Cash Buttons (+1k, +2k, +5k, +10k, +20k, +50k, +100k)
    document.querySelectorAll('.btn-add-cash').forEach(btn => {
        btn.addEventListener('click', () => {
            const addVal = Number(btn.getAttribute('data-add')) || 0;
            state.cashGiven = (Number(state.cashGiven) || 0) + addVal;
            if (cashInput) cashInput.value = state.cashGiven;
            renderCartTotalsOnly();
        });
    });

    // Payment Method Radio
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.paymentMethod = e.target.value;
            renderPaymentSections();
            renderCartTotalsOnly();
        });
    });

    // Copy Bank BRI Account
    document.getElementById('btn-copy-account')?.addEventListener('click', () => {
        const acc = state.profile.bankAccount || DEFAULT_PROFILE.bankAccount;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(acc).then(() => {
                showToast(`No. Rekening BRI ${acc} disalin!`);
            }).catch(() => {
                showToast(`No. Rekening BRI: ${acc}`);
            });
        } else {
            showToast(`No. Rekening BRI: ${acc}`);
        }
    });

    // Copy Transfer Amount
    document.getElementById('btn-copy-amount')?.addEventListener('click', () => {
        const totals = calculateTotals();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(totals.total.toString()).then(() => {
                showToast(`Nominal ${formatRupiah(totals.total)} disalin!`);
            }).catch(() => {
                showToast(`Nominal: ${formatRupiah(totals.total)}`);
            });
        }
    });

    // QRIS Zoom Modal Listeners
    document.getElementById('btn-zoom-qris')?.addEventListener('click', openQrisZoomModal);
    document.getElementById('qris-img-display')?.addEventListener('click', openQrisZoomModal);
    document.getElementById('btn-close-qris-zoom')?.addEventListener('click', closeQrisZoomModal);
    document.getElementById('btn-close-qris-zoom-bottom')?.addEventListener('click', closeQrisZoomModal);
    document.getElementById('modal-qris-zoom')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-qris-zoom') closeQrisZoomModal();
    });

    // QRIS Image Upload Handlers
    const handleQrisFile = (inputEl) => {
        if (!inputEl) return;
        inputEl.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                state.profile.qrisImage = event.target.result;
                saveProfile();
                renderPaymentSections();
                showToast('Foto QRIS berhasil diperbarui!');
            };
            reader.readAsDataURL(file);
        });
    };
    handleQrisFile(document.getElementById('qris-quick-upload'));
    handleQrisFile(document.getElementById('settings-qris-file'));

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

    // History filter buttons & period selectors
    document.querySelectorAll('[data-history-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.getAttribute('data-history-filter');
            state.historyFilter = filterType;

            document.querySelectorAll('[data-history-filter]').forEach(b => {
                b.classList.remove('active', 'bg-blue-600', 'text-white', 'border-blue-600', 'shadow-xs');
                b.classList.add('border-slate-200', 'text-slate-600');
            });
            btn.classList.add('active', 'bg-blue-600', 'text-white', 'border-blue-600', 'shadow-xs');
            btn.classList.remove('border-slate-200', 'text-slate-600');

            if (filterType === 'month') {
                const monthSelect = document.getElementById('select-filter-month');
                if (monthSelect) monthSelect.value = new Date().getMonth().toString();
                state.selectedFilterMonth = new Date().getMonth().toString();
            } else if (filterType === 'year') {
                const monthSelect = document.getElementById('select-filter-month');
                if (monthSelect) monthSelect.value = 'all';
                state.selectedFilterMonth = 'all';
            }

            renderHistory();
        });
    });

    // Month & Year Selectors
    document.getElementById('select-filter-month')?.addEventListener('change', (e) => {
        state.selectedFilterMonth = e.target.value;
        state.historyFilter = e.target.value === 'all' ? 'year' : 'month';
        highlightActivePeriodButton();
        renderHistory();
    });

    document.getElementById('select-filter-year')?.addEventListener('change', (e) => {
        state.selectedFilterYear = Number(e.target.value) || new Date().getFullYear();
        renderHistory();
    });

    // Excel Export & Import Controls
    document.getElementById('btn-export-excel')?.addEventListener('click', exportIncomeReportToExcel);
    document.getElementById('input-import-excel')?.addEventListener('change', handleImportExcelFile);
    document.getElementById('btn-download-excel-template')?.addEventListener('click', downloadExcelTemplate);

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Admin Mode Controls
    document.getElementById('btn-admin-login')?.addEventListener('click', openAdminLoginModal);
    document.getElementById('btn-admin-logout')?.addEventListener('click', handleAdminLogout);
    document.getElementById('form-admin-login')?.addEventListener('submit', handleAdminLoginSubmit);
    document.getElementById('btn-save-admin-pin')?.addEventListener('click', handleSaveAdminPin);

    // Initial check of admin visibility
    updateAdminUI();
}

function renderAll() {
    renderWorkshopHeader();
    renderCatalogCategories();
    renderCatalog();
    renderCart();
    renderPricesTable();
    renderHistory();
    renderProfileForm();
    renderPaymentSections();
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
    const fBankName = document.getElementById('settings-bank-name');
    const fBankAccount = document.getElementById('settings-bank-account');
    const fBankHolder = document.getElementById('settings-bank-holder');

    if (fName) fName.value = state.profile.name || '';
    if (fTagline) fTagline.value = state.profile.tagline || '';
    if (fPhone) fPhone.value = state.profile.phone || '';
    if (fAddress) fAddress.value = state.profile.address || '';
    if (fFooter) fFooter.value = state.profile.receiptFooter || '';
    if (fBankName) fBankName.value = state.profile.bankName || DEFAULT_PROFILE.bankName;
    if (fBankAccount) fBankAccount.value = state.profile.bankAccount || DEFAULT_PROFILE.bankAccount;
    if (fBankHolder) fBankHolder.value = state.profile.bankHolder || DEFAULT_PROFILE.bankHolder;
}

function handleSaveProfile(e) {
    e.preventDefault();
    state.profile = {
        ...state.profile,
        name: document.getElementById('settings-name').value.trim() || DEFAULT_PROFILE.name,
        tagline: document.getElementById('settings-tagline').value.trim(),
        phone: document.getElementById('settings-phone').value.trim(),
        address: document.getElementById('settings-address').value.trim(),
        receiptFooter: document.getElementById('settings-receipt-footer').value.trim(),
        bankName: document.getElementById('settings-bank-name')?.value.trim() || DEFAULT_PROFILE.bankName,
        bankAccount: document.getElementById('settings-bank-account')?.value.trim() || DEFAULT_PROFILE.bankAccount,
        bankHolder: document.getElementById('settings-bank-holder')?.value.trim() || DEFAULT_PROFILE.bankHolder
    };
    saveProfile();
    renderWorkshopHeader();
    renderPaymentSections();
    showToast('Profil bengkel & data pembayaran berhasil disimpan!');
}

// --- PAYMENT SECTIONS & QRIS / TRANSFER DISPLAY ---
function renderPaymentSections() {
    const cashSection = document.getElementById('cash-calculation-section');
    const qrisSection = document.getElementById('qris-display-section');
    const transferSection = document.getElementById('transfer-display-section');
    const bonSection = document.getElementById('bon-display-section');

    const method = state.paymentMethod || 'cash';

    if (cashSection) cashSection.classList.toggle('hidden', method !== 'cash');
    if (qrisSection) qrisSection.classList.toggle('hidden', method !== 'qris');
    if (transferSection) transferSection.classList.toggle('hidden', method !== 'transfer');
    if (bonSection) bonSection.classList.toggle('hidden', method !== 'bon');

    // Update Bank BRI Info di Kasir
    const bankAccountEl = document.getElementById('transfer-bank-account');
    const bankHolderEl = document.getElementById('transfer-bank-holder');
    if (bankAccountEl) bankAccountEl.textContent = state.profile.bankAccount || DEFAULT_PROFILE.bankAccount;
    if (bankHolderEl) bankHolderEl.textContent = state.profile.bankHolder || DEFAULT_PROFILE.bankHolder;

    // Update QRIS Image
    const qrisImg = document.getElementById('qris-img-display');
    const qrisZoomImg = document.getElementById('qris-zoom-img');
    const fallbackBox = document.getElementById('qris-fallback-box');

    const qrisSrc = state.profile.qrisImage || DEFAULT_PROFILE.qrisImage;
    if (qrisImg) {
        qrisImg.src = qrisSrc;
        qrisImg.style.display = 'block';
    }
    if (qrisZoomImg) {
        qrisZoomImg.src = qrisSrc;
    }
    if (fallbackBox && state.profile.qrisImage && state.profile.qrisImage.startsWith('data:')) {
        fallbackBox.classList.add('hidden');
    }
}

function openQrisZoomModal() {
    const modal = document.getElementById('modal-qris-zoom');
    const amountEl = document.getElementById('qris-zoom-amount');
    const zoomImg = document.getElementById('qris-zoom-img');
    const totals = calculateTotals();

    if (amountEl) amountEl.textContent = formatRupiah(totals.total);
    if (zoomImg) zoomImg.src = state.profile.qrisImage || DEFAULT_PROFILE.qrisImage;
    if (modal) modal.classList.remove('hidden');
}

function closeQrisZoomModal() {
    const modal = document.getElementById('modal-qris-zoom');
    if (modal) modal.classList.add('hidden');
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

// --- ADMIN MODE MANAGER ---
function updateAdminUI() {
    const navGroup = document.getElementById('admin-nav-group');
    const btnLogin = document.getElementById('btn-admin-login');
    const barLoggedIn = document.getElementById('admin-logged-in-bar');

    if (state.isAdmin) {
        if (navGroup) {
            navGroup.classList.remove('hidden');
            navGroup.classList.add('flex');
        }
        if (btnLogin) btnLogin.classList.add('hidden');
        if (barLoggedIn) {
            barLoggedIn.classList.remove('hidden');
            barLoggedIn.classList.add('flex');
        }
    } else {
        if (navGroup) {
            navGroup.classList.add('hidden');
            navGroup.classList.remove('flex');
        }
        if (btnLogin) btnLogin.classList.remove('hidden');
        if (barLoggedIn) {
            barLoggedIn.classList.add('hidden');
            barLoggedIn.classList.remove('flex');
        }

        // Jika sedang berada di tab admin saat logout, kembalikan ke tab pos (kasir)
        if (state.activeTab !== 'pos') {
            switchTab('pos');
        }
    }
}

function openAdminLoginModal() {
    const modal = document.getElementById('modal-admin-login');
    const input = document.getElementById('admin-pin-input');
    const errorMsg = document.getElementById('admin-login-error');

    if (!modal) return;
    if (input) input.value = '';
    if (errorMsg) errorMsg.classList.add('hidden');

    modal.classList.remove('hidden');
    setTimeout(() => input?.focus(), 150);
}

function handleAdminLoginSubmit(e) {
    e.preventDefault();
    const pinInput = document.getElementById('admin-pin-input');
    const errorMsg = document.getElementById('admin-login-error');
    const enteredPin = (pinInput?.value || '').trim();

    if (enteredPin === state.adminPin) {
        state.isAdmin = true;
        sessionStorage.setItem('bengkel_is_admin', 'true');
        closeModal();
        updateAdminUI();
        showToast('Login berhasil! Mode Admin aktif.');
    } else {
        if (errorMsg) errorMsg.classList.remove('hidden');
        if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
        }
    }
}

function handleAdminLogout() {
    state.isAdmin = false;
    sessionStorage.removeItem('bengkel_is_admin');
    updateAdminUI();
    showToast('Telah keluar dari mode Admin. Mode Kasir aktif.');
}

function handleSaveAdminPin() {
    const pinInput = document.getElementById('settings-admin-pin');
    const newPin = (pinInput?.value || '').trim();

    if (!newPin || newPin.length < 3) {
        alert('PIN Admin baru minimal 3 karakter!');
        return;
    }

    state.adminPin = newPin;
    localStorage.setItem('bengkel_admin_pin', newPin);
    if (pinInput) pinInput.value = '';
    showToast('PIN Admin berhasil diperbarui!');
}

// --- TAB SWITCHER ---
function switchTab(tabId) {
    // Proteksi: Hanya admin yang boleh membuka menu selain 'pos' (kasir)
    if (tabId !== 'pos' && !state.isAdmin) {
        openAdminLoginModal();
        return;
    }

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
    const changeLabel = document.getElementById('change-label');
    const changeContainer = document.getElementById('change-display-box');

    // Display QRIS and Transfer Amounts
    const qrisAmountEl = document.getElementById('qris-amount-display');
    const qrisZoomAmountEl = document.getElementById('qris-zoom-amount');
    const transferAmountEl = document.getElementById('transfer-amount-display');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(totals.subtotal);
    if (discountEl) discountEl.textContent = `- ${formatRupiah(totals.discountAmount)}`;
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(totals.total);

    if (qrisAmountEl) qrisAmountEl.textContent = formatRupiah(totals.total);
    if (qrisZoomAmountEl) qrisZoomAmountEl.textContent = formatRupiah(totals.total);
    if (transferAmountEl) transferAmountEl.textContent = formatRupiah(totals.total);

    if (changeEl && changeContainer) {
        if (state.paymentMethod === 'cash') {
            changeContainer.classList.remove('hidden');
            if (totals.change >= 0) {
                if (changeLabel) changeLabel.textContent = 'Kembalian:';
                changeEl.textContent = formatRupiah(totals.change);
                changeEl.className = 'text-base font-extrabold text-emerald-600';
            } else {
                if (changeLabel) changeLabel.textContent = 'Kurang:';
                changeEl.textContent = `- ${formatRupiah(Math.abs(totals.change))}`;
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
                         tx.paymentMethod === 'transfer' ? `TRANSFER BANK BRI (${state.profile.bankAccount || '-'} a.n ${state.profile.bankHolder || '-'})` : 'BON / HUTANG';

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
                         tx.paymentMethod === 'transfer' ? `TRANSFER BANK BRI (${state.profile.bankAccount || '-'} a.n ${state.profile.bankHolder || '-'})` : 'BON / HUTANG';

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

// --- REPORT & FINANCIAL CALCULATIONS ---
const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function populateYearFilterOptions() {
    const yearSelect = document.getElementById('select-filter-year');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const years = new Set([currentYear]);
    state.transactions.forEach(tx => {
        if (tx.date) {
            const yr = new Date(tx.date).getFullYear();
            if (!isNaN(yr)) years.add(yr);
        }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const existingVal = Number(yearSelect.value) || state.selectedFilterYear || currentYear;
    yearSelect.innerHTML = sortedYears.map(y => 
        `<option value="${y}" ${y === existingVal ? 'selected' : ''}>Tahun ${y}</option>`
    ).join('');
}

function highlightActivePeriodButton() {
    document.querySelectorAll('[data-history-filter]').forEach(b => {
        const type = b.getAttribute('data-history-filter');
        if (type === state.historyFilter) {
            b.classList.add('active', 'bg-blue-600', 'text-white', 'border-blue-600', 'shadow-xs');
            b.classList.remove('border-slate-200', 'text-slate-600');
        } else {
            b.classList.remove('active', 'bg-blue-600', 'text-white', 'border-blue-600', 'shadow-xs');
            b.classList.add('border-slate-200', 'text-slate-600');
        }
    });
}

function getFilteredTransactions() {
    const now = new Date();
    return state.transactions.filter(tx => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return false;

        if (state.historyFilter === 'today') {
            return txDate.toDateString() === now.toDateString();
        } else if (state.historyFilter === 'week') {
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            return txDate >= sevenDaysAgo;
        } else if (state.historyFilter === 'month') {
            const targetMonth = state.selectedFilterMonth === 'all' ? now.getMonth() : Number(state.selectedFilterMonth);
            return txDate.getMonth() === targetMonth && txDate.getFullYear() === state.selectedFilterYear;
        } else if (state.historyFilter === 'year') {
            if (state.selectedFilterMonth !== 'all') {
                return txDate.getMonth() === Number(state.selectedFilterMonth) && txDate.getFullYear() === state.selectedFilterYear;
            }
            return txDate.getFullYear() === state.selectedFilterYear;
        } else if (state.historyFilter === 'all') {
            return true;
        }
        return true;
    });
}

function renderHistory() {
    populateYearFilterOptions();
    highlightActivePeriodButton();

    const listContainer = document.getElementById('history-list-container');
    const totalOmsetEl = document.getElementById('stat-total-omset');
    const totalDiscountEl = document.getElementById('stat-total-discount');
    const totalTxEl = document.getElementById('stat-total-tx');
    const avgTxEl = document.getElementById('stat-avg-tx');
    const periodDescEl = document.getElementById('history-period-description');
    const countBadgeEl = document.getElementById('history-item-count-badge');
    const paymentBreakdownList = document.getElementById('payment-breakdown-list');
    const rekapMonthlyTbody = document.getElementById('rekap-monthly-tbody');
    const rekapYearLabel = document.getElementById('rekap-year-label');

    if (!listContainer) return;

    if (rekapYearLabel) {
        rekapYearLabel.textContent = state.selectedFilterYear;
    }

    const filteredTx = getFilteredTransactions();

    const totalOmset = filteredTx.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
    const totalDiscount = filteredTx.reduce((sum, tx) => sum + (Number(tx.discountAmount) || 0), 0);
    const count = filteredTx.length;
    const avg = count > 0 ? Math.round(totalOmset / count) : 0;

    if (totalOmsetEl) totalOmsetEl.textContent = formatRupiah(totalOmset);
    if (totalDiscountEl) totalDiscountEl.textContent = formatRupiah(totalDiscount);
    if (totalTxEl) totalTxEl.textContent = `${count} Transaksi`;
    if (avgTxEl) avgTxEl.textContent = formatRupiah(avg);
    if (countBadgeEl) countBadgeEl.textContent = `${count} transaksi`;

    // Period description text
    let periodText = '';
    if (state.historyFilter === 'today') {
        periodText = `Hari Ini (${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    } else if (state.historyFilter === 'week') {
        periodText = '7 Hari Terakhir';
    } else if (state.historyFilter === 'month') {
        const mIdx = state.selectedFilterMonth === 'all' ? new Date().getMonth() : Number(state.selectedFilterMonth);
        periodText = `Bulan ${MONTH_NAMES_ID[mIdx]} ${state.selectedFilterYear}`;
    } else if (state.historyFilter === 'year') {
        periodText = `Tahun Penuh ${state.selectedFilterYear}`;
    } else {
        periodText = 'Semua Riwayat Transaksi';
    }
    if (periodDescEl) {
        periodDescEl.textContent = `Periode: ${periodText} • Total Omset: ${formatRupiah(totalOmset)}`;
    }

    // --- PAYMENT METHOD BREAKDOWN ---
    if (paymentBreakdownList) {
        const methods = [
            { id: 'cash', name: 'Tunai (Cash)', icon: '💵', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { id: 'qris', name: 'QRIS', icon: '📱', color: 'text-blue-700 bg-blue-50 border-blue-200' },
            { id: 'transfer', name: 'Transfer Bank', icon: '🏦', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
            { id: 'bon', name: 'Bon / Hutang', icon: '📝', color: 'text-amber-700 bg-amber-50 border-amber-200' }
        ];

        paymentBreakdownList.innerHTML = methods.map(m => {
            const mTx = filteredTx.filter(t => t.paymentMethod === m.id);
            const sum = mTx.reduce((a, b) => a + (Number(b.total) || 0), 0);
            const pct = totalOmset > 0 ? Math.round((sum / totalOmset) * 100) : 0;

            return `
                <div class="p-2.5 rounded-xl border flex items-center justify-between ${m.color}">
                    <div class="flex items-center gap-2">
                        <span class="text-base">${m.icon}</span>
                        <div>
                            <div class="font-bold leading-tight">${m.name}</div>
                            <div class="text-[10px] opacity-75">${mTx.length} transaksi (${pct}%)</div>
                        </div>
                    </div>
                    <div class="text-right font-extrabold text-xs">
                        ${formatRupiah(sum)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- 12-MONTH ANNUAL BREAKDOWN TABLE ---
    if (rekapMonthlyTbody) {
        const now = new Date();
        let totalYrTx = 0, totalYrMotor = 0, totalYrMobil = 0, totalYrOmset = 0;

        let rowsHTML = MONTH_NAMES_ID.map((mName, mIdx) => {
            const mTx = state.transactions.filter(t => {
                if (!t.date) return false;
                const d = new Date(t.date);
                return d.getFullYear() === state.selectedFilterYear && d.getMonth() === mIdx;
            });

            const mCount = mTx.length;
            const mMotor = mTx.filter(t => t.vehicleType === 'motor').reduce((s, t) => s + (Number(t.total) || 0), 0);
            const mMobil = mTx.filter(t => t.vehicleType === 'mobil').reduce((s, t) => s + (Number(t.total) || 0), 0);
            const mTot = mTx.reduce((s, t) => s + (Number(t.total) || 0), 0);

            totalYrTx += mCount;
            totalYrMotor += mMotor;
            totalYrMobil += mMobil;
            totalYrOmset += mTot;

            const isCurrentMonth = (now.getFullYear() === state.selectedFilterYear && now.getMonth() === mIdx);
            const highlightClass = isCurrentMonth ? 'bg-blue-50/70 font-bold' : (mTot > 0 ? 'bg-white' : 'text-slate-400');

            return `
                <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 ${highlightClass}">
                    <td class="px-3 py-2 flex items-center gap-1.5">
                        <span>${mName}</span>
                        ${isCurrentMonth ? '<span class="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">Bulan Ini</span>' : ''}
                    </td>
                    <td class="px-3 py-2 text-center font-mono">${mCount > 0 ? mCount : '-'}</td>
                    <td class="px-3 py-2 text-right font-mono">${mMotor > 0 ? formatRupiah(mMotor) : '-'}</td>
                    <td class="px-3 py-2 text-right font-mono">${mMobil > 0 ? formatRupiah(mMobil) : '-'}</td>
                    <td class="px-3 py-2 text-right font-bold text-slate-800 font-mono">${mTot > 0 ? formatRupiah(mTot) : '-'}</td>
                </tr>
            `;
        }).join('');

        // Grand Total row
        rowsHTML += `
            <tr class="bg-slate-100/90 font-extrabold text-slate-900 border-t-2 border-slate-200">
                <td class="px-3 py-2.5 uppercase tracking-wide">TOTAL TAHUNAN</td>
                <td class="px-3 py-2.5 text-center font-mono">${totalYrTx}</td>
                <td class="px-3 py-2.5 text-right font-mono text-slate-700">${formatRupiah(totalYrMotor)}</td>
                <td class="px-3 py-2.5 text-right font-mono text-slate-700">${formatRupiah(totalYrMobil)}</td>
                <td class="px-3 py-2.5 text-right font-mono text-emerald-700 text-xs">${formatRupiah(totalYrOmset)}</td>
            </tr>
        `;

        rekapMonthlyTbody.innerHTML = rowsHTML;
    }

    // --- TRANSACTION CARDS LIST ---
    if (filteredTx.length === 0) {
        listContainer.innerHTML = `
            <div class="py-12 text-center text-slate-400">
                <div class="text-3xl mb-2">📊</div>
                <p class="font-semibold text-slate-700">Belum ada riwayat transaksi pada periode ini.</p>
                <p class="text-xs text-slate-400 mt-1">Transaksi yang dicatat di kasir akan otomatis terdata di sini.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filteredTx.map(tx => {
        const itemsSummary = (tx.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');
        const payBadge = tx.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-800' :
                         tx.paymentMethod === 'qris' ? 'bg-blue-100 text-blue-800' :
                         tx.paymentMethod === 'transfer' ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800';
        const payName = tx.paymentMethod === 'cash' ? 'Tunai' :
                        tx.paymentMethod === 'qris' ? 'QRIS' :
                        tx.paymentMethod === 'transfer' ? 'Transfer' : 'Bon';

        return `
            <div class="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-900">${tx.invoiceNo}</span>
                        <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${tx.vehicleType === 'motor' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                            ${tx.vehicleType}
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${payBadge}">
                            ${payName}
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
                        <div class="text-[10px] text-slate-400">Total Biaya</div>
                        <div class="text-base font-extrabold text-blue-600">${formatRupiah(tx.total)}</div>
                    </div>
                    <button onclick="sendDirectWhatsApp('${tx.id}')"
                        class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1"
                        title="Kirim Nota via WhatsApp">
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

// --- EXPORT FINANCIAL REPORT TO EXCEL (.XLSX) ---
function exportIncomeReportToExcel() {
    const filteredTx = getFilteredTransactions();
    if (filteredTx.length === 0 && !confirm('Tidak ada transaksi pada filter periode ini. Tetap ekspor file laporan kosong?')) {
        return;
    }

    let periodTitle = '';
    if (state.historyFilter === 'today') {
        periodTitle = `Hari Ini (${new Date().toLocaleDateString('id-ID')})`;
    } else if (state.historyFilter === 'week') {
        periodTitle = '7 Hari Terakhir';
    } else if (state.historyFilter === 'month') {
        const mIdx = state.selectedFilterMonth === 'all' ? new Date().getMonth() : Number(state.selectedFilterMonth);
        periodTitle = `Bulan ${MONTH_NAMES_ID[mIdx]} ${state.selectedFilterYear}`;
    } else if (state.historyFilter === 'year') {
        periodTitle = `Tahun Penuh ${state.selectedFilterYear}`;
    } else {
        periodTitle = 'Semua Transaksi';
    }

    const totalOmset = filteredTx.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
    const totalDiscount = filteredTx.reduce((sum, tx) => sum + (Number(tx.discountAmount) || 0), 0);
    const totalSubtotal = filteredTx.reduce((sum, tx) => sum + (Number(tx.subtotal) || 0), 0);
    const count = filteredTx.length;
    const avg = count > 0 ? Math.round(totalOmset / count) : 0;

    // Fallback jika library SheetJS belum siap / offline
    if (typeof XLSX === 'undefined') {
        exportCSVFallback(filteredTx, periodTitle);
        return;
    }

    const wb = XLSX.utils.book_new();

    // --- SHEET 1: RINGKASAN & REKAP KEUANGAN ---
    const summaryData = [
        [state.profile.name.toUpperCase()],
        [state.profile.tagline || 'Layanan Tambal Ban, Bongkar Pasang & Cuci Kendaraan'],
        [state.profile.address || ''],
        [`No. Telp / WhatsApp: ${state.profile.phone || '-'}`],
        [],
        ['LAPORAN KEUANGAN & PENGHASILAN BENGKEL'],
        ['Periode Laporan', periodTitle],
        ['Waktu Ekspor', new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID')],
        ['Status Dokumen', 'Resmi Admin Bengkel'],
        [],
        ['=== RINGKASAN PENGHASILAN ===', 'NILAI / JUMLAH'],
        ['Total Omset / Pendapatan Bersih (Rp)', totalOmset],
        ['Total Diskon Diberikan (Rp)', totalDiscount],
        ['Total Nilai Transaksi Kotor (Subtotal Rp)', totalSubtotal],
        ['Jumlah Transaksi Selesai', count],
        ['Rata-rata Pendapatan per Transaksi (Rp)', avg],
        [],
        ['=== METODE PEMBAYARAN ===', 'JUMLAH TRANSAKSI', 'TOTAL NOMINAL (RP)', 'PERSENTASE'],
        ['Tunai (Cash)', 
            filteredTx.filter(t => t.paymentMethod === 'cash').length, 
            filteredTx.filter(t => t.paymentMethod === 'cash').reduce((s, t) => s + (t.total || 0), 0),
            totalOmset > 0 ? ((filteredTx.filter(t => t.paymentMethod === 'cash').reduce((s, t) => s + (t.total || 0), 0) / totalOmset) * 100).toFixed(1) + '%' : '0%'
        ],
        ['QRIS', 
            filteredTx.filter(t => t.paymentMethod === 'qris').length, 
            filteredTx.filter(t => t.paymentMethod === 'qris').reduce((s, t) => s + (t.total || 0), 0),
            totalOmset > 0 ? ((filteredTx.filter(t => t.paymentMethod === 'qris').reduce((s, t) => s + (t.total || 0), 0) / totalOmset) * 100).toFixed(1) + '%' : '0%'
        ],
        ['Transfer Bank', 
            filteredTx.filter(t => t.paymentMethod === 'transfer').length, 
            filteredTx.filter(t => t.paymentMethod === 'transfer').reduce((s, t) => s + (t.total || 0), 0),
            totalOmset > 0 ? ((filteredTx.filter(t => t.paymentMethod === 'transfer').reduce((s, t) => s + (t.total || 0), 0) / totalOmset) * 100).toFixed(1) + '%' : '0%'
        ],
        ['Bon / Belum Lunas', 
            filteredTx.filter(t => t.paymentMethod === 'bon').length, 
            filteredTx.filter(t => t.paymentMethod === 'bon').reduce((s, t) => s + (t.total || 0), 0),
            totalOmset > 0 ? ((filteredTx.filter(t => t.paymentMethod === 'bon').reduce((s, t) => s + (t.total || 0), 0) / totalOmset) * 100).toFixed(1) + '%' : '0%'
        ],
        [],
        [`=== REKAP BULANAN SETAHUN (TAHUN ${state.selectedFilterYear}) ===`],
        ['Bulan', 'Jml Transaksi', 'Omset Motor (Rp)', 'Omset Mobil (Rp)', 'Total Omset (Rp)']
    ];

    // Masukkan data 12 Bulan ke Sheet 1
    let totalYrTx = 0, totalYrMotor = 0, totalYrMobil = 0, totalYrTotal = 0;
    for (let m = 0; m < 12; m++) {
        const mTx = state.transactions.filter(t => {
            if (!t.date) return false;
            const d = new Date(t.date);
            return d.getFullYear() === state.selectedFilterYear && d.getMonth() === m;
        });
        const mCount = mTx.length;
        const mMotor = mTx.filter(t => t.vehicleType === 'motor').reduce((s, t) => s + (Number(t.total) || 0), 0);
        const mMobil = mTx.filter(t => t.vehicleType === 'mobil').reduce((s, t) => s + (Number(t.total) || 0), 0);
        const mTot = mTx.reduce((s, t) => s + (Number(t.total) || 0), 0);

        totalYrTx += mCount;
        totalYrMotor += mMotor;
        totalYrMobil += mMobil;
        totalYrTotal += mTot;

        summaryData.push([MONTH_NAMES_ID[m], mCount, mMotor, mMobil, mTot]);
    }
    summaryData.push(['TOTAL SETAHUN', totalYrTx, totalYrMotor, totalYrMobil, totalYrTotal]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
        { wch: 35 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan & Rekap");

    // --- SHEET 2: DAFTAR TRANSAKSI LENGKAP ---
    const txData = [
        ['No', 'No. Nota', 'Tanggal', 'Jam', 'Nama Pelanggan', 'No. WhatsApp', 'Plat Nomor', 'Kendaraan', 'Rincian Layanan / Barang', 'Subtotal (Rp)', 'Diskon (Rp)', 'Total Bayar (Rp)', 'Metode Pembayaran', 'Catatan']
    ];

    filteredTx.forEach((tx, idx) => {
        const d = new Date(tx.date);
        const dateStr = d.toLocaleDateString('id-ID');
        const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const itemsStr = (tx.items || []).map(i => `${i.name} (${i.qty} ${i.unit})`).join('; ');
        const payLabel = tx.paymentMethod === 'cash' ? 'Tunai' :
                         tx.paymentMethod === 'qris' ? 'QRIS' :
                         tx.paymentMethod === 'transfer' ? 'Transfer Bank' : 'Bon / Hutang';

        txData.push([
            idx + 1,
            tx.invoiceNo,
            dateStr,
            timeStr,
            tx.customerName || 'Pelanggan Umum',
            tx.customerPhone || '-',
            tx.plateNumber || '-',
            (tx.vehicleType || '').toUpperCase(),
            itemsStr,
            tx.subtotal || 0,
            tx.discountAmount || 0,
            tx.total || 0,
            payLabel,
            tx.orderNote || '-'
        ]);
    });

    const wsTx = XLSX.utils.aoa_to_sheet(txData);
    wsTx['!cols'] = [
        { wch: 5 },
        { wch: 16 },
        { wch: 14 },
        { wch: 10 },
        { wch: 22 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
        { wch: 45 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, "Data Transaksi");

    // Unduh File Excel .xlsx
    const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Laporan_Penghasilan_Bengkel_${cleanPeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Laporan berhasil diekspor ke Excel: ${filename}`);
}

function exportCSVFallback(filteredTx, periodTitle) {
    let csv = "\uFEFF"; // UTF-8 BOM agar rapi di Microsoft Excel
    csv += `"No","No Nota","Tanggal","Waktu","Pelanggan","WhatsApp","Plat","Kendaraan","Layanan/Barang","Subtotal","Diskon","Total Bayar","Metode","Catatan"\n`;

    filteredTx.forEach((tx, idx) => {
        const d = new Date(tx.date);
        const dateStr = d.toLocaleDateString('id-ID');
        const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const itemsStr = (tx.items || []).map(i => `${i.name} (${i.qty} ${i.unit})`).join('; ');
        const payLabel = tx.paymentMethod === 'cash' ? 'Tunai' :
                         tx.paymentMethod === 'qris' ? 'QRIS' :
                         tx.paymentMethod === 'transfer' ? 'Transfer Bank' : 'Bon / Hutang';

        const row = [
            idx + 1,
            `"${tx.invoiceNo}"`,
            `"${dateStr}"`,
            `"${timeStr}"`,
            `"${(tx.customerName || '').replace(/"/g, '""')}"`,
            `"${(tx.customerPhone || '').replace(/"/g, '""')}"`,
            `"${(tx.plateNumber || '').replace(/"/g, '""')}"`,
            `"${(tx.vehicleType || '').toUpperCase()}"`,
            `"${itemsStr.replace(/"/g, '""')}"`,
            tx.subtotal || 0,
            tx.discountAmount || 0,
            tx.total || 0,
            `"${payLabel}"`,
            `"${(tx.orderNote || '').replace(/"/g, '""')}"`
        ];
        csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Laporan_Penghasilan_Bengkel_${cleanPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan diekspor ke format CSV.');
}

// --- DOWNLOAD TEMPLATE EXCEL UNTUK INPUT MANUAL ---
function downloadExcelTemplate() {
    if (typeof XLSX === 'undefined') {
        alert('Library Excel belum siap. Pastikan perangkat Anda terhubung ke internet.');
        return;
    }

    const wb = XLSX.utils.book_new();

    const headers = [
        ['No', 'No. Nota', 'Tanggal (YYYY-MM-DD)', 'Jam', 'Nama Pelanggan', 'No. WhatsApp', 'Plat Nomor', 'Kendaraan (motor/mobil)', 'Rincian Layanan / Barang', 'Subtotal (Rp)', 'Diskon (Rp)', 'Total Bayar (Rp)', 'Metode Pembayaran (Tunai/QRIS/Transfer/Bon)', 'Catatan']
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const sampleRows = [
        [1, 'INV-CONTOH-01', todayStr, '09:30', 'Bpk. Hendra', '081234567890', 'AE 1234 XX', 'motor', 'Tambal Tubeless (Tusuk); Cuci Motor', 25000, 0, 25000, 'Tunai', 'Ban belakang kena paku'],
        [2, 'INV-CONTOH-02', todayStr, '11:15', 'Ibu Ratna', '085123456789', 'AE 5678 YY', 'mobil', 'Cuci Mobil Hidrolik Salju; Isi Nitrogen', 50000, 5000, 45000, 'QRIS', 'Pelanggan langganan']
    ];

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleRows]);
    ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 18 }, // No Nota
        { wch: 22 }, // Tanggal
        { wch: 10 }, // Jam
        { wch: 20 }, // Nama Pelanggan
        { wch: 16 }, // WhatsApp
        { wch: 14 }, // Plat
        { wch: 24 }, // Kendaraan
        { wch: 45 }, // Layanan
        { wch: 16 }, // Subtotal
        { wch: 14 }, // Diskon
        { wch: 16 }, // Total Bayar
        { wch: 38 }, // Metode
        { wch: 25 }  // Catatan
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Data Transaksi");
    XLSX.writeFile(wb, "Template_Input_Transaksi_Bengkel.xlsx");
    showToast('Template Excel berhasil diunduh!');
}

// --- IMPORT EXCEL FILE KE SISTEM TRANSAKSI ---
function handleImportExcelFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
        alert('Fitur import Excel membutuhkan koneksi internet untuk memuat modul Excel.');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Cari sheet yang memuat kata "transaksi" atau sheet pertama
            let sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('transaksi')) || workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) {
                alert('Lembar kerja (Sheet) di file Excel tidak ditemukan!');
                return;
            }

            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            if (!rows || rows.length < 2) {
                alert('File Excel kosong atau tidak memiliki baris data!');
                return;
            }

            // Identifikasi baris header dan pemetaan kolom
            let headerRowIdx = -1;
            let colMap = {
                date: -1,
                time: -1,
                invoice: -1,
                customer: -1,
                phone: -1,
                plate: -1,
                vehicle: -1,
                items: -1,
                subtotal: -1,
                discount: -1,
                total: -1,
                payment: -1,
                notes: -1
            };

            for (let r = 0; r < Math.min(10, rows.length); r++) {
                const row = rows[r];
                if (!Array.isArray(row)) continue;

                row.forEach((cell, idx) => {
                    const c = String(cell).toLowerCase().trim();
                    if (c.includes('tanggal') || c === 'date') colMap.date = idx;
                    else if (c === 'jam' || c === 'waktu' || c === 'time') colMap.time = idx;
                    else if (c.includes('nota') || c.includes('invoice') || c.includes('faktur')) colMap.invoice = idx;
                    else if (c.includes('pelanggan') || c.includes('customer') || c === 'nama') colMap.customer = idx;
                    else if (c.includes('wa') || c.includes('telepon') || c.includes('phone') || c.includes('hp')) colMap.phone = idx;
                    else if (c.includes('plat') || c.includes('nopol')) colMap.plate = idx;
                    else if (c.includes('kendaraan') || c.includes('motor/mobil') || c === 'vehicle') colMap.vehicle = idx;
                    else if (c.includes('layanan') || c.includes('barang') || c.includes('item') || c.includes('jasa')) colMap.items = idx;
                    else if (c.includes('subtotal')) colMap.subtotal = idx;
                    else if (c.includes('diskon') || c.includes('discount')) colMap.discount = idx;
                    else if (c.includes('total bayar') || c === 'total' || c.includes('omset') || c.includes('nominal')) colMap.total = idx;
                    else if (c.includes('metode') || c.includes('pembayaran') || c === 'payment') colMap.payment = idx;
                    else if (c.includes('catatan') || c.includes('keterangan') || c === 'notes') colMap.notes = idx;
                });

                if (colMap.total !== -1 || (colMap.items !== -1 && colMap.date !== -1)) {
                    headerRowIdx = r;
                    break;
                }
            }

            if (headerRowIdx === -1) {
                // Fallback index sesuai format default template
                colMap = {
                    date: 2, time: 3, invoice: 1, customer: 4, phone: 5, plate: 6,
                    vehicle: 7, items: 8, subtotal: 9, discount: 10, total: 11, payment: 12, notes: 13
                };
                headerRowIdx = 0;
            }

            const parsedTransactions = [];
            let totalAmountImported = 0;

            for (let r = headerRowIdx + 1; r < rows.length; r++) {
                const row = rows[r];
                if (!Array.isArray(row) || row.length === 0) continue;

                // Ambil nilai total bayar
                let rawTotal = colMap.total !== -1 ? row[colMap.total] : '';
                let totalNum = typeof rawTotal === 'number' ? rawTotal : Number(String(rawTotal).replace(/[^0-9.-]/g, '')) || 0;

                // Ambil nilai subtotal jika ada
                let rawSubtotal = colMap.subtotal !== -1 ? row[colMap.subtotal] : '';
                let subtotalNum = typeof rawSubtotal === 'number' ? rawSubtotal : Number(String(rawSubtotal).replace(/[^0-9.-]/g, '')) || 0;

                if (totalNum <= 0 && subtotalNum > 0) totalNum = subtotalNum;
                if (subtotalNum <= 0 && totalNum > 0) subtotalNum = totalNum;

                // Skip summary footer
                const firstCell = String(row[0] || '').toLowerCase();
                if (firstCell.includes('total') || firstCell.includes('ringkasan') || firstCell.includes('===')) continue;
                if (totalNum <= 0 && !row[colMap.items] && !row[colMap.customer]) continue;

                // Parse tanggal
                let dateIso = new Date().toISOString();
                let rawDate = colMap.date !== -1 ? row[colMap.date] : '';
                if (typeof rawDate === 'number') {
                    // Format serial date Excel
                    const parsedD = new Date((rawDate - 25569) * 86400 * 1000);
                    if (!isNaN(parsedD.getTime())) dateIso = parsedD.toISOString();
                } else if (rawDate) {
                    const strDate = String(rawDate).trim();
                    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(strDate)) {
                        const parts = strDate.split(/[\/\-]/);
                        const d = new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
                        if (!isNaN(d.getTime())) dateIso = d.toISOString();
                    } else {
                        const d = new Date(strDate);
                        if (!isNaN(d.getTime())) dateIso = d.toISOString();
                    }
                }

                // Parse kendaraan
                const rawVehicle = String(colMap.vehicle !== -1 ? row[colMap.vehicle] : '').toLowerCase();
                const vehicleType = rawVehicle.includes('mobil') ? 'mobil' : 'motor';

                // Parse metode pembayaran
                const rawPay = String(colMap.payment !== -1 ? row[colMap.payment] : '').toLowerCase();
                let paymentMethod = 'cash';
                if (rawPay.includes('qris')) paymentMethod = 'qris';
                else if (rawPay.includes('transfer') || rawPay.includes('bank')) paymentMethod = 'transfer';
                else if (rawPay.includes('bon') || rawPay.includes('hutang')) paymentMethod = 'bon';

                // Parse layanan
                const rawItems = String(colMap.items !== -1 ? row[colMap.items] : '').trim();
                let items = [];
                if (rawItems) {
                    const splitted = rawItems.split(/[;,]/);
                    items = splitted.map(it => ({
                        id: generateId('item'),
                        name: it.trim(),
                        qty: 1,
                        unit: 'unit',
                        price: totalNum > 0 && splitted.length === 1 ? totalNum : 0
                    })).filter(it => it.name.length > 0);
                }
                if (items.length === 0) {
                    items.push({
                        id: generateId('item'),
                        name: 'Layanan Manual Excel',
                        qty: 1,
                        unit: 'unit',
                        price: totalNum
                    });
                }

                const invoiceNo = String(colMap.invoice !== -1 && row[colMap.invoice] ? row[colMap.invoice] : `INV-MANUAL-${Date.now().toString().slice(-4)}-${parsedTransactions.length + 1}`).trim();
                const customerName = String(colMap.customer !== -1 && row[colMap.customer] ? row[colMap.customer] : 'Pelanggan Umum').trim();
                const customerPhone = String(colMap.phone !== -1 && row[colMap.phone] ? row[colMap.phone] : '').trim();
                const plateNumber = String(colMap.plate !== -1 && row[colMap.plate] ? row[colMap.plate] : '-').trim().toUpperCase();
                const rawDiscount = colMap.discount !== -1 ? row[colMap.discount] : 0;
                const discountAmount = typeof rawDiscount === 'number' ? rawDiscount : Number(String(rawDiscount).replace(/[^0-9.-]/g, '')) || 0;
                const orderNote = String(colMap.notes !== -1 && row[colMap.notes] ? row[colMap.notes] : 'Diimpor dari Excel manual').trim();

                parsedTransactions.push({
                    id: generateId('INV'),
                    invoiceNo,
                    date: dateIso,
                    customerName,
                    customerPhone,
                    plateNumber,
                    vehicleType,
                    orderNote,
                    items,
                    subtotal: subtotalNum,
                    discountType: 'nominal',
                    discountValue: discountAmount,
                    discountAmount,
                    total: totalNum,
                    cash: totalNum,
                    change: 0,
                    paymentMethod
                });

                totalAmountImported += totalNum;
            }

            if (parsedTransactions.length === 0) {
                alert('Tidak ada baris transaksi yang valid untuk diimpor. Periksa format file Excel Anda.');
                return;
            }

            const confirmMsg = `Ditemukan ${parsedTransactions.length} data transaksi dari file "${file.name}" dengan total penghasilan ${formatRupiah(totalAmountImported)}.\n\nApakah Anda ingin menambahkan data ini ke dalam riwayat bengkel?`;
            if (confirm(confirmMsg)) {
                // Tambahkan data baru ke paling depan riwayat
                state.transactions = [...parsedTransactions, ...state.transactions];
                saveTransactions();
                renderAll();
                showToast(`Berhasil menambahkan ${parsedTransactions.length} transaksi dari Excel!`);
            }
        } catch (err) {
            console.error('Error importing Excel:', err);
            alert('Gagal membaca file Excel. Pastikan file dalam format .xlsx, .xls, atau .csv yang valid.');
        } finally {
            e.target.value = '';
        }
    };

    reader.readAsArrayBuffer(file);
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
