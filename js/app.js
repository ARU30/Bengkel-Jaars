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
    paymentMethod: 'qris', // 'qris' (default non-tunai user) | 'transfer' | 'cash' (admin only) | 'bon' (admin only)
    
    // Ringkasan Pembayaran Khusus Hari Ini
    summaryFilterPeriod: 'today', // Selalu 'today' untuk membedakan dengan Laporan & Riwayat
    summaryFilterPayment: 'all', // 'all' | 'cash' | 'qris' | 'transfer' | 'bon'
    summaryFilterVehicle: 'all', // 'all' | 'motor' | 'mobil'
    summaryFilterValidation: 'all', // 'all' | 'pending' | 'verified' | 'qris' | 'transfer'
    summarySearchKeyword: '',

    // Active Tab View
    activeTab: 'pos', // 'pos' | 'prices' | 'history' | 'settings'

    // Admin Auth State (Email & Password)
    isAdmin: false,
    adminEmail: DEFAULT_ADMIN.email,
    adminPassword: DEFAULT_ADMIN.password,

    // Catalog State (Ban & Oli)
    catalog: [],
    catalogSearchQuery: '',
    catalogCategoryFilter: 'all', // 'all' | 'ban-motor' | 'ban-mobil' | 'oli'
    catalogBrandFilter: 'all',
    editingCatalogId: null,

    // History & Financial Report Filter
    historyFilter: 'month', // 'today' | 'week' | 'month' | 'year' | 'all'
    selectedFilterMonth: new Date().getMonth().toString(), // '0'..'11' or 'all'
    selectedFilterYear: new Date().getFullYear(),
    
    // Program Loyalitas Cuci Kendaraan (Cuci 7x Gratis 1x)
    freeWashVouchers: JSON.parse(localStorage.getItem('bengkel_free_wash_vouchers') || '[]'),
    activeLoyaltySubTab: 'customers', // 'customers' | 'vouchers'
    loyaltyCustomerFilter: 'all', // 'all' | 'eligible' | 'claimed'
    loyaltyVoucherFilter: 'all', // 'all' | 'active' | 'redeemed'
    loyaltyClearedVehicles: JSON.parse(localStorage.getItem('jaars_loyalty_cleared') || '[]'),
    
    // Cloud Synchronization State (Vercel & Multi-Device)
    cloudSyncStatus: 'synced', // 'synced' | 'syncing' | 'offline' | 'error'
    cloudSyncUrl: localStorage.getItem('bengkel_cloud_sync_url') || '',
    lastSyncTime: localStorage.getItem('bengkel_last_sync_time') ? Number(localStorage.getItem('bengkel_last_sync_time')) : null,
    autoSyncEnabled: true,

    // Modals
    activeModal: null // 'customItem' | 'newService' | 'editService' | 'receipt' | 'editProfile'
};

const ADMIN_JAARS_PHONE = '085156696378';

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

// ID seed/contoh transaksi bawaan (JANGAN dipakai sebagai transaksi riil atau diunggah ke cloud)
const SEED_TRANSACTION_IDS = new Set(['INV-JAARS-001', 'INV-JAARS-002', 'INV-JAARS-003', 'INV-849201', 'INV-849188', 'INV-849150']);
function isSeedTransaction(tx) {
    if (!tx) return false;
    return SEED_TRANSACTION_IDS.has(tx.id) || SEED_TRANSACTION_IDS.has(tx.invoiceNo);
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
        if (savedTransactions) {
            try {
                const parsed = JSON.parse(savedTransactions);
                state.transactions = Array.isArray(parsed) ? parsed.filter(tx => !isSeedTransaction(tx)) : [];
            } catch (e) {
                state.transactions = [];
            }
        } else {
            state.transactions = [];
        }

        const savedCatalog = localStorage.getItem('bengkel_catalog');
        state.catalog = savedCatalog ? JSON.parse(savedCatalog) : [ ...DEFAULT_CATALOG ];

        const savedAdminEmail = localStorage.getItem('bengkel_admin_email');
        const savedAdminPassword = localStorage.getItem('bengkel_admin_password');
        state.adminEmail = (savedAdminEmail || DEFAULT_ADMIN.email).toLowerCase().trim();
        state.adminPassword = savedAdminPassword || DEFAULT_ADMIN.password;

        const savedCloudUrl = localStorage.getItem('bengkel_cloud_sync_url');
        if (savedCloudUrl) state.cloudSyncUrl = savedCloudUrl;
        const savedLastSync = localStorage.getItem('bengkel_last_sync_time');
        if (savedLastSync) state.lastSyncTime = Number(savedLastSync);

        const savedFreeWashVouchers = localStorage.getItem('bengkel_free_wash_vouchers');
        if (savedFreeWashVouchers) {
            try {
                const parsedVouchers = JSON.parse(savedFreeWashVouchers);
                state.freeWashVouchers = Array.isArray(parsedVouchers) ? parsedVouchers : [];
            } catch (e) {
                state.freeWashVouchers = [];
            }
        } else {
            state.freeWashVouchers = [];
        }

        const savedClearedLoyalty = localStorage.getItem('jaars_loyalty_cleared');
        if (savedClearedLoyalty) {
            try {
                const parsedCleared = JSON.parse(savedClearedLoyalty);
                state.loyaltyClearedVehicles = Array.isArray(parsedCleared) ? parsedCleared : [];
            } catch (e) {
                state.loyaltyClearedVehicles = [];
            }
        } else {
            state.loyaltyClearedVehicles = [];
        }

        // Check if admin is currently logged in in this session
        state.isAdmin = sessionStorage.getItem('bengkel_is_admin') === 'true';
    } catch (e) {
        console.error("Error loading localStorage data:", e);
        state.profile = { ...DEFAULT_PROFILE };
        state.categories = [ ...DEFAULT_CATEGORIES ];
        state.services = [ ...DEFAULT_SERVICES ];
        state.catalog = [ ...DEFAULT_CATALOG ];
        state.transactions = [];
        state.freeWashVouchers = [];
        state.loyaltyClearedVehicles = [];
    }
}

function saveProfile() {
    localStorage.setItem('bengkel_profile', JSON.stringify(state.profile));
    triggerAutoSyncToCloud('Profil Bengkel');
}

function saveServices() {
    localStorage.setItem('bengkel_services', JSON.stringify(state.services));
    triggerAutoSyncToCloud('Tarif Layanan');
}

function saveCatalog() {
    localStorage.setItem('bengkel_catalog', JSON.stringify(state.catalog));
    triggerAutoSyncToCloud('Katalog Ban & Oli');
}

// Saluran sinkronisasi antar-tab lokal (BroadcastChannel)
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('jaars_bengkel_sync') : null;

function saveTransactions(options = {}) {
    localStorage.setItem('bengkel_transactions', JSON.stringify(state.transactions));
    if (syncChannel) {
        try {
            syncChannel.postMessage({ type: 'TRANSACTIONS_UPDATED', timestamp: Date.now() });
        } catch (e) {}
    }
}

// Helper: Gabungkan daftar transaksi dari Cloud dengan data lokal (Multi-Device Merge)
// Transaksi seed/contoh (INV-JAARS-*) TIDAK dihitung sebagai "baru"
function mergeTransactionsClient(localList, incomingList) {
    const localMap = new Map();
    (localList || []).forEach(tx => {
        if (!tx) return;
        const key = tx.invoiceNo || tx.id;
        if (key) localMap.set(key, tx);
    });

    let changed = false;
    let newCount = 0;
    const newInvoiceNos = [];
    const finalMap = new Map(localMap);

    (incomingList || []).forEach(inTx => {
        if (!inTx) return;
        // Abaikan seed transactions dari cloud agar tidak muncul "random" di admin
        if (isSeedTransaction(inTx)) return;

        const key = inTx.invoiceNo || inTx.id;
        if (!key) return;

        const locTx = localMap.get(key);
        if (!locTx) {
            // Nota / booking baru masuk dari perangkat lain!
            finalMap.set(key, inTx);
            changed = true;
            newCount++;
            newInvoiceNos.push(inTx.invoiceNo || inTx.id);
        } else {
            // Transaksi sudah ada, periksa status validasi pembayaran (QRIS / Transfer)
            const isVerifiedLoc = locTx.paymentValidated === true || locTx.paymentStatus === 'verified';
            const isVerifiedIn = inTx.paymentValidated === true || inTx.paymentStatus === 'verified';
            const mergedVerified = isVerifiedLoc || isVerifiedIn;

            const updatedTx = {
                ...locTx,
                ...inTx,
                paymentValidated: mergedVerified,
                paymentStatus: mergedVerified ? 'verified' : (inTx.paymentStatus || locTx.paymentStatus || 'pending'),
                validatedAt: inTx.validatedAt || locTx.validatedAt || null,
                validatedBy: inTx.validatedBy || locTx.validatedBy || null
            };

            if (JSON.stringify(locTx) !== JSON.stringify(updatedTx)) {
                finalMap.set(key, updatedTx);
                changed = true;
            }
        }
    });

    const mergedList = Array.from(finalMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return {
        changed,
        newCount,
        newInvoiceNos,
        transactions: mergedList
    };
}

// Helper: Gabungkan kupon voucher cuci gratis dari Cloud dengan data lokal
function mergeVouchersClient(localList, incomingList) {
    const map = new Map();
    let changed = false;
    (localList || []).forEach(v => {
        if (v && (v.id || v.code)) map.set(v.id || v.code, v);
    });

    (incomingList || []).forEach(inV => {
        if (!inV || !(inV.id || inV.code)) return;
        const key = inV.id || inV.code;
        const locV = map.get(key);
        if (!locV) {
            map.set(key, inV);
            changed = true;
        } else {
            const isRedeemed = locV.status === 'redeemed' || inV.status === 'redeemed';
            const mergedV = {
                ...locV,
                ...inV,
                status: isRedeemed ? 'redeemed' : (inV.status || locV.status),
                redeemedAt: inV.redeemedAt || locV.redeemedAt || null,
                redeemedInvoiceNo: inV.redeemedInvoiceNo || locV.redeemedInvoiceNo || null
            };
            if (JSON.stringify(locV) !== JSON.stringify(mergedV)) {
                map.set(key, mergedV);
                changed = true;
            }
        }
    });

    const list = Array.from(map.values()).sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));
    return { changed, vouchers: list };
}

// Helper: Gabungkan kendaraan loyalitas yang dibersihkan/reset
function mergeClearedVehiclesClient(localList, incomingList) {
    const map = new Map();
    let changed = false;
    (localList || []).forEach(item => {
        if (!item) return;
        const key = (item.plate || '').trim().toUpperCase() + '_' + (item.phone || '').trim();
        if (key !== '_') map.set(key, item);
    });
    (incomingList || []).forEach(inItem => {
        if (!inItem) return;
        const key = (inItem.plate || '').trim().toUpperCase() + '_' + (inItem.phone || '').trim();
        if (key !== '_' && !map.has(key)) {
            map.set(key, inItem);
            changed = true;
        }
    });
    return { changed, cleared: Array.from(map.values()) };
}

// --- CLOUD SYNC & MULTI-DEVICE SYNCHRONIZATION (VERCEL) ---
let autoSyncDebounceTimer = null;
function triggerAutoSyncToCloud(label = 'Perubahan data', extraPayload = {}) {
    if (!state.autoSyncEnabled) return;
    if (autoSyncDebounceTimer) clearTimeout(autoSyncDebounceTimer);
    autoSyncDebounceTimer = setTimeout(() => {
        syncToCloud(label, extraPayload);
    }, 800);
}

function checkUrlSyncPayload() {
    try {
        const hash = window.location.hash || '';
        if (!hash.includes('sync=')) return false;

        const raw = hash.substring(hash.indexOf('sync=') + 5);
        if (!raw) return false;

        const jsonStr = decodeURIComponent(escape(atob(raw)));
        const data = JSON.parse(jsonStr);

        if (data && typeof data === 'object') {
            if (data.profile) {
                state.profile = { ...DEFAULT_PROFILE, ...data.profile };
                localStorage.setItem('bengkel_profile', JSON.stringify(state.profile));
            }
            if (Array.isArray(data.services) && data.services.length > 0) {
                state.services = data.services;
                localStorage.setItem('bengkel_services', JSON.stringify(state.services));
            }
            if (Array.isArray(data.catalog) && data.catalog.length > 0) {
                state.catalog = data.catalog;
                localStorage.setItem('bengkel_catalog', JSON.stringify(state.catalog));
            }
            if (data.adminEmail) {
                state.adminEmail = data.adminEmail;
                state.adminPassword = data.adminPassword || state.adminPassword;
                localStorage.setItem('bengkel_admin_email', state.adminEmail);
                localStorage.setItem('bengkel_admin_password', state.adminPassword);
            }
            state.lastSyncTime = data.updatedAt || Date.now();
            localStorage.setItem('bengkel_last_sync_time', String(state.lastSyncTime));

            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }

            setTimeout(() => {
                showToast('🎉 Selamat! Seluruh tarif, katalog, dan profil bengkel berhasil disinkronkan ke perangkat ini!');
            }, 600);
            return true;
        }
    } catch (err) {
        console.error('[URL Sync Error]:', err);
    }
    return false;
}

async function syncFromCloud(silent = false) {
    updateCloudSyncIndicator('syncing', 'Menyinkronkan data...');

    let cloudData = null;
    let source = '';

    // 1. Coba dari Vercel Serverless Endpoint /api/sync
    try {
        const res = await fetch('/api/sync', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });
        if (res.ok) {
            const json = await res.json();
            if (json && json.success && json.synced && json.data) {
                cloudData = json.data;
                source = json.storage || 'Cloud Vercel';
            }
        }
    } catch (e) {
        // Mode offline / dev lokal
    }

    // 2. Coba dari Custom Cloud Sync URL (misal Firebase Realtime Database)
    if (!cloudData && state.cloudSyncUrl) {
        try {
            const cleanUrl = state.cloudSyncUrl.endsWith('.json') ? state.cloudSyncUrl : `${state.cloudSyncUrl.replace(/\/+$/, '')}/bengkel_sync.json`;
            const res = await fetch(cleanUrl, { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                if (json && (json.services || json.catalog || json.profile || json.transactions)) {
                    cloudData = json;
                    source = 'Database Cloud (Firebase/REST)';
                }
            }
        } catch (e) {
            console.warn('[Custom Cloud DB Error]:', e);
        }
    }

    if (cloudData) {
        let changed = false;
        let newTransactionsCount = 0;

        if (cloudData.profile) {
            state.profile = { ...DEFAULT_PROFILE, ...cloudData.profile };
            localStorage.setItem('bengkel_profile', JSON.stringify(state.profile));
            changed = true;
        }
        if (Array.isArray(cloudData.services) && cloudData.services.length > 0) {
            state.services = cloudData.services;
            localStorage.setItem('bengkel_services', JSON.stringify(state.services));
            changed = true;
        }
        if (Array.isArray(cloudData.catalog) && cloudData.catalog.length > 0) {
            state.catalog = cloudData.catalog;
            localStorage.setItem('bengkel_catalog', JSON.stringify(state.catalog));
            changed = true;
        }
        if (cloudData.adminEmail) {
            state.adminEmail = cloudData.adminEmail;
            state.adminPassword = cloudData.adminPassword || state.adminPassword;
            localStorage.setItem('bengkel_admin_email', state.adminEmail);
            localStorage.setItem('bengkel_admin_password', state.adminPassword);
            changed = true;
        }

        // Sinkronisasi Transaksi & Nota Booking dari semua perangkat
        if (Array.isArray(cloudData.transactions) && cloudData.transactions.length > 0) {
            const mergeResult = mergeTransactionsClient(state.transactions || [], cloudData.transactions);
            if (mergeResult.changed) {
                state.transactions = mergeResult.transactions;
                localStorage.setItem('bengkel_transactions', JSON.stringify(state.transactions));
                changed = true;
                newTransactionsCount = mergeResult.newCount;
            }
        }

        // Sinkronisasi Kupon Voucher Cuci Gratis
        if (Array.isArray(cloudData.freeWashVouchers)) {
            const mergedVouchers = mergeVouchersClient(state.freeWashVouchers || [], cloudData.freeWashVouchers);
            if (mergedVouchers.changed) {
                state.freeWashVouchers = mergedVouchers.vouchers;
                localStorage.setItem('bengkel_free_wash_vouchers', JSON.stringify(state.freeWashVouchers));
                changed = true;
            }
        }

        // Sinkronisasi Penghapusan/Reset Loyalitas Kendaraan
        if (Array.isArray(cloudData.loyaltyClearedVehicles)) {
            const mergedCleared = mergeClearedVehiclesClient(state.loyaltyClearedVehicles || [], cloudData.loyaltyClearedVehicles);
            if (mergedCleared.changed) {
                state.loyaltyClearedVehicles = mergedCleared.cleared;
                localStorage.setItem('jaars_loyalty_cleared', JSON.stringify(state.loyaltyClearedVehicles));
                changed = true;
            }
        }

        state.lastSyncTime = cloudData.updatedAt || Date.now();
        localStorage.setItem('bengkel_last_sync_time', String(state.lastSyncTime));

        if (changed) {
            if (typeof renderDailySummary === 'function') renderDailySummary();
            if (typeof renderPaidServicesSummary === 'function') renderPaidServicesSummary();
            if (typeof renderHistory === 'function') renderHistory();
            if (typeof updateAdminUI === 'function') updateAdminUI();
            if (typeof updateLoyaltyBadgesAndCounts === 'function') updateLoyaltyBadgesAndCounts();
        }

        updateCloudSyncIndicator('synced', `Cloud Aktif (${source})`);
        
        // Tampilkan notifikasi jika ada nota/booking baru masuk dari perangkat lain!
        if (newTransactionsCount > 0) {
            showToast(`🔔 Ada ${newTransactionsCount} nota/booking baru masuk dari perangkat lain!`);
        } else if (!silent) {
            showToast(`✅ Berhasil mengambil data terbaru dari ${source}!`);
        }
        renderCloudSyncModalDetails();
        return true;
    } else {
        updateCloudSyncIndicator('synced', 'Penyimpanan Lokal Aktif');
        renderCloudSyncModalDetails();
        return false;
    }
}

async function syncToCloud(triggerLabel = 'Konfigurasi', extraPayload = {}) {
    updateCloudSyncIndicator('syncing', 'Mengunggah ke Cloud...');

    const payload = {
        updatedAt: Date.now(),
        updatedBy: state.profile?.name || (state.isAdmin ? 'Admin JAARS' : 'Pengguna / Pelanggan'),
        profile: state.profile,
        services: state.services,
        catalog: state.catalog,
        // Filter seed/contoh transaksi bawaan agar TIDAK ikut diunggah ke cloud
        transactions: (state.transactions || []).filter(tx => !isSeedTransaction(tx)),
        freeWashVouchers: state.freeWashVouchers || [],
        loyaltyClearedVehicles: state.loyaltyClearedVehicles || [],
        adminEmail: state.adminEmail || DEFAULT_ADMIN.email,
        adminPassword: state.adminPassword || DEFAULT_ADMIN.password,
        ...extraPayload
    };

    let saved = false;
    let target = '';

    // 1. Simpan ke /api/sync (Vercel Serverless)
    try {
        const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const json = await res.json();
            if (json && json.success) {
                saved = true;
                target = (json.savedIn || []).join(', ') || 'Vercel KV';
                if (json.data && Array.isArray(json.data.transactions)) {
                    const mergeResult = mergeTransactionsClient(state.transactions || [], json.data.transactions);
                    if (mergeResult.changed) {
                        state.transactions = mergeResult.transactions;
                        localStorage.setItem('bengkel_transactions', JSON.stringify(state.transactions));
                        if (typeof renderDailySummary === 'function') renderDailySummary();
                        if (typeof renderPaidServicesSummary === 'function') renderPaidServicesSummary();
                        if (typeof renderHistory === 'function') renderHistory();
                    }
                }
            }
        }
    } catch (e) {
        // Endpoint tidak tersedia / offline
    }

    // 2. Simpan ke Custom Cloud Database jika dikonfigurasi
    if (state.cloudSyncUrl) {
        try {
            const cleanUrl = state.cloudSyncUrl.endsWith('.json') ? state.cloudSyncUrl : `${state.cloudSyncUrl.replace(/\/+$/, '')}/bengkel_sync.json`;
            const res = await fetch(cleanUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                saved = true;
                target = target ? `${target} & Cloud DB` : 'Cloud DB (Firebase/REST)';
            }
        } catch (e) {
            console.warn('[Custom Cloud Save Error]:', e);
        }
    }

    state.lastSyncTime = payload.updatedAt;
    localStorage.setItem('bengkel_last_sync_time', String(state.lastSyncTime));

    if (saved) {
        updateCloudSyncIndicator('synced', `Tersinkron Cloud (${target})`);
        renderCloudSyncModalDetails();
        showToast(`☁️ ${triggerLabel} berhasil disinkronkan ke Cloud Vercel!`);
    } else {
        updateCloudSyncIndicator('synced', 'Tersimpan di Perangkat Ini');
        renderCloudSyncModalDetails();
    }

    if (syncChannel) {
        try {
            syncChannel.postMessage({ type: 'SYNC_EVENT', label: triggerLabel, timestamp: Date.now() });
        } catch (e) {}
    }
}

function initCloudSync() {
    updateCloudSyncIndicator('synced', 'Penyimpanan Lokal Aktif');
    renderCloudSyncModalDetails();

    // Jalankan sinkronisasi awal di background
    setTimeout(() => {
        syncFromCloud(true);
    }, 400);

    // Sinkronisasi otomatis saat kasir kembali ke tab / membuka kembali HP
    window.addEventListener('focus', () => {
        syncFromCloud(true);
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            syncFromCloud(true);
        }
    });

    // Cek berkala cepat setiap 8 detik jika halaman aktif
    setInterval(() => {
        syncFromCloud(true);
    }, 8000);

    // Dengar pesan sinkronisasi antar-tab lokal
    if (syncChannel) {
        syncChannel.onmessage = (event) => {
            if (!event || !event.data) return;
            const msg = event.data;
            if (msg.type === 'TRANSACTIONS_UPDATED' || msg.type === 'VOUCHERS_UPDATED' || msg.type === 'LOYALTY_CLEARED_UPDATED' || msg.type === 'SYNC_EVENT') {
                try {
                    const savedTx = localStorage.getItem('bengkel_transactions');
                    if (savedTx) state.transactions = JSON.parse(savedTx);
                    const savedV = localStorage.getItem('bengkel_free_wash_vouchers');
                    if (savedV) state.freeWashVouchers = JSON.parse(savedV);
                    const savedCleared = localStorage.getItem('jaars_loyalty_cleared');
                    if (savedCleared) state.loyaltyClearedVehicles = JSON.parse(savedCleared);
                    
                    if (typeof renderDailySummary === 'function') renderDailySummary();
                    if (typeof renderPaidServicesSummary === 'function') renderPaidServicesSummary();
                    if (typeof renderHistory === 'function') renderHistory();
                    if (typeof updateAdminUI === 'function') updateAdminUI();
                    if (typeof updateLoyaltyBadgesAndCounts === 'function') updateLoyaltyBadgesAndCounts();
                } catch (e) {
                    console.error('[BroadcastChannel Sync Error]:', e);
                }
            }
        };
    }
}

function generateSyncSharePayload() {
    const payload = {
        updatedAt: Date.now(),
        profile: state.profile,
        services: state.services,
        catalog: state.catalog,
        adminEmail: state.adminEmail || DEFAULT_ADMIN.email,
        adminPassword: state.adminPassword || DEFAULT_ADMIN.password
    };
    const jsonStr = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(jsonStr)));
}

function generateSyncShareUrl() {
    const b64 = generateSyncSharePayload();
    const base = window.location.href.split('#')[0];
    return `${base}#sync=${b64}`;
}

function copySyncShareUrl() {
    const url = generateSyncShareUrl();
    copyToClipboard(url, 'Link Sinkronisasi Kasir');
    showToast('📋 Link sinkronisasi tersalin! Kirim via WhatsApp ke HP kasir Anda.');
}

function shareSyncWhatsApp() {
    const url = generateSyncShareUrl();
    const bengkelName = state.profile?.name || 'Bengkel JAARS';
    const msg = `Halo Kasir *${bengkelName}*,\n\nBerikut link pengaturan tarif, katalog ban & oli, serta profil terbaru bengkel:\n\n🔗 ${url}\n\n*Petunjuk Kasir:*\nCukup klik link di atas di HP atau tablet kasir sekali saja. Seluruh tarif dan produk katalog langsung aktif seketika tanpa perlu login admin! 🚀`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
}

function openCloudQrModal() {
    const url = generateSyncShareUrl();
    const qrImg = document.getElementById('cloud-qr-image');
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
    }
    const modal = document.getElementById('modal-cloud-qr');
    if (modal) modal.classList.remove('hidden');
}

function openCloudSyncModal() {
    renderCloudSyncModalDetails();
    const modal = document.getElementById('modal-cloud-sync');
    if (modal) modal.classList.remove('hidden');
}

function updateCloudSyncIndicator(status, text) {
    const dot = document.getElementById('cloud-sync-dot');
    const label = document.getElementById('cloud-sync-text');
    const badge = document.getElementById('settings-cloud-sync-badge');
    const btnSync = document.getElementById('btn-cloud-sync-status');

    if (dot) {
        if (status === 'syncing') {
            dot.className = 'w-2 h-2 rounded-full bg-blue-500 animate-spin';
        } else if (status === 'error') {
            dot.className = 'w-2 h-2 rounded-full bg-rose-500';
        } else {
            dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
        }
    }
    if (label && text) {
        label.textContent = text.length > 25 ? text.slice(0, 25) + '...' : text;
    }
    if (badge && text) {
        badge.textContent = text;
    }

    // Pastikan tombol Cloud Sync di header hanya terlihat saat Admin login
    if (btnSync) {
        if (state.isAdmin) {
            btnSync.classList.remove('hidden');
            btnSync.classList.add('flex');
        } else {
            btnSync.classList.add('hidden');
            btnSync.classList.remove('flex');
        }
    }
}

function renderCloudSyncModalDetails() {
    const timeEl = document.getElementById('cloud-modal-time');
    const countsEl = document.getElementById('cloud-modal-counts');
    const urlInput = document.getElementById('settings-cloud-sync-url');

    if (timeEl) {
        timeEl.textContent = state.lastSyncTime ? formatDate(new Date(state.lastSyncTime).toISOString()) : 'Baru saja';
    }
    if (countsEl) {
        const sCount = (state.services || []).length;
        const cCount = (state.catalog || []).length;
        const txCount = (state.transactions || []).length;
        countsEl.textContent = `${sCount} Tarif • ${cCount} Produk Katalog • ${txCount} Nota & Booking`;
    }
    if (urlInput && !urlInput.value) {
        urlInput.value = state.cloudSyncUrl || '';
    }
}

function toggleCloudConfigAdvanced() {
    const el = document.getElementById('cloud-config-advanced');
    if (el) el.classList.toggle('hidden');
}

function saveCustomCloudSyncUrl() {
    const input = document.getElementById('settings-cloud-sync-url');
    if (!input) return;
    const val = input.value.trim();
    state.cloudSyncUrl = val;
    localStorage.setItem('bengkel_cloud_sync_url', val);
    showToast('✅ URL Database Cloud Kustom berhasil disimpan!');
    syncFromCloud(false);
}

function downloadUpdatedDefaultData() {
    const jsContent = `// js/default-data.js
// Master Data Bengkel JAARS - Diperbarui Otomatis dari Admin
// Tanggal Update: ${new Date().toLocaleString('id-ID')}

const DEFAULT_PROFILE = ${JSON.stringify(state.profile, null, 4)};

const DEFAULT_ADMIN = {
    email: ${JSON.stringify(state.adminEmail || DEFAULT_ADMIN.email)},
    password: ${JSON.stringify(state.adminPassword || DEFAULT_ADMIN.password)}
};

const DEFAULT_CATEGORIES = ${JSON.stringify(state.categories || DEFAULT_CATEGORIES, null, 4)};

const DEFAULT_SERVICES = ${JSON.stringify(state.services, null, 4)};

const DEFAULT_CATALOG = ${JSON.stringify(state.catalog, null, 4)};
`;

    const blob = new Blob([jsContent], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'default-data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📥 Berkas default-data.js terbaru berhasil diunduh! Timpa berkas ini ke repositori proyek & push ke GitHub agar Vercel otomatis memakai data ini secara permanen.');
}

// --- CALCULATION LOGIC ---
function calculateTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    
    let discountAmount = 0;
    // Fitur diskon HANYA bisa dilakukan di sistem kasir admin
    if (state.isAdmin) {
        if (state.discountType === 'percent') {
            const pct = Math.min(100, Math.max(0, Number(state.discountValue) || 0));
            discountAmount = Math.round(subtotal * (pct / 100));
        } else {
            discountAmount = Math.min(subtotal, Math.max(0, Number(state.discountValue) || 0));
        }
    } else {
        discountAmount = 0;
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
    checkUrlSyncPayload();
    loadData();
    initUI();
    renderAll();
    startClock();
    initCloudSync();

    // Pastikan seluruh kontainer cetak bersih saat halaman dimuat
    const p1 = document.getElementById('print-free-wash-section');
    const p2 = document.getElementById('print-receipt-section');
    const p3 = document.getElementById('print-daily-summary-section');
    if (p1) p1.innerHTML = '';
    if (p2) p2.innerHTML = '';
    if (p3) p3.innerHTML = '';
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

    // Discount Inputs (Khusus Sistem Admin)
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');
    if (discountTypeSelect) {
        discountTypeSelect.addEventListener('change', (e) => {
            if (!state.isAdmin) {
                state.discountType = 'nominal';
                state.discountValue = 0;
                e.target.value = 'nominal';
                renderCart();
                return;
            }
            state.discountType = e.target.value;
            renderCart();
        });
    }
    if (discountValueInput) {
        discountValueInput.addEventListener('input', (e) => {
            if (!state.isAdmin) {
                state.discountValue = 0;
                e.target.value = '0';
                renderCart();
                return;
            }
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
            if (!state.isAdmin && (e.target.value === 'cash' || e.target.value === 'bon')) {
                state.paymentMethod = 'qris';
                const qrisRadio = document.querySelector('input[name="payment-method"][value="qris"]');
                if (qrisRadio) qrisRadio.checked = true;
                renderPaymentSections();
                renderCartTotalsOnly();
                return;
            }
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
        if (typeof updateCartWashLoyaltyIndicator === 'function') updateCartWashLoyaltyIndicator();
    });
    document.getElementById('input-plate-number')?.addEventListener('input', (e) => {
        state.plateNumber = e.target.value.toUpperCase();
        e.target.value = state.plateNumber;
        if (typeof updateCartWashLoyaltyIndicator === 'function') updateCartWashLoyaltyIndicator();
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

    // Info Panel & Quick Contact Controls
    document.getElementById('btn-copy-phone')?.addEventListener('click', () => {
        copyToClipboard(state.profile.phone || DEFAULT_PROFILE.phone, 'Nomor Telepon');
    });
    document.getElementById('btn-copy-address')?.addEventListener('click', () => {
        copyToClipboard(state.profile.address || DEFAULT_PROFILE.address, 'Alamat Bengkel');
    });
    document.getElementById('btn-copy-email')?.addEventListener('click', () => {
        copyToClipboard(state.profile.email || DEFAULT_PROFILE.email, 'Email Bengkel');
    });
    document.getElementById('btn-quick-info')?.addEventListener('click', () => {
        switchTab('info');
    });
    document.getElementById('btn-info-to-pos')?.addEventListener('click', () => {
        switchTab('pos');
    });

    // Admin Mode Controls (Email & Password)
    document.getElementById('btn-admin-login')?.addEventListener('click', openAdminLoginModal);
    document.getElementById('btn-admin-logout')?.addEventListener('click', handleAdminLogout);
    document.getElementById('form-admin-login')?.addEventListener('submit', handleAdminLoginSubmit);
    document.getElementById('form-admin-account')?.addEventListener('submit', handleSaveAdminAccount);

    // Password Visibility Toggles
    document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    btn.textContent = '🙈';
                } else {
                    targetInput.type = 'password';
                    btn.textContent = '👁️';
                }
            }
        });
    });

    // Catalog (Ban & Oli) Controls
    document.querySelectorAll('.btn-catalog-cat').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-catalog-category');
            state.catalogCategoryFilter = cat;
            state.catalogBrandFilter = 'all';

            document.querySelectorAll('.btn-catalog-cat').forEach(b => {
                if (b.getAttribute('data-catalog-category') === cat) {
                    b.className = 'btn-catalog-cat px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-sm flex items-center gap-1.5 shrink-0';
                } else {
                    b.className = 'btn-catalog-cat px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-600 hover:bg-slate-200/70 flex items-center gap-1.5 shrink-0';
                }
            });

            renderCatalogFilterBrands();
            renderCatalogProducts();
        });
    });

    const catalogSearchInput = document.getElementById('catalog-search-input');
    const btnClearCatalogSearch = document.getElementById('btn-clear-catalog-search');

    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', (e) => {
            state.catalogSearchQuery = e.target.value.trim();
            if (btnClearCatalogSearch) {
                if (state.catalogSearchQuery) {
                    btnClearCatalogSearch.classList.remove('hidden');
                } else {
                    btnClearCatalogSearch.classList.add('hidden');
                }
            }
            renderCatalogProducts();
        });
    }

    if (btnClearCatalogSearch) {
        btnClearCatalogSearch.addEventListener('click', () => {
            state.catalogSearchQuery = '';
            if (catalogSearchInput) catalogSearchInput.value = '';
            btnClearCatalogSearch.classList.add('hidden');
            renderCatalogProducts();
        });
    }

    document.getElementById('btn-reset-catalog-filters')?.addEventListener('click', () => {
        state.catalogSearchQuery = '';
        state.catalogCategoryFilter = 'all';
        state.catalogBrandFilter = 'all';
        if (catalogSearchInput) catalogSearchInput.value = '';
        if (btnClearCatalogSearch) btnClearCatalogSearch.classList.add('hidden');

        document.querySelectorAll('.btn-catalog-cat').forEach(b => {
            if (b.getAttribute('data-catalog-category') === 'all') {
                b.className = 'btn-catalog-cat px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-sm flex items-center gap-1.5 shrink-0';
            } else {
                b.className = 'btn-catalog-cat px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-600 hover:bg-slate-200/70 flex items-center gap-1.5 shrink-0';
            }
        });

        renderCatalogPanel();
    });

    // Admin Catalog Modal Controls
    document.getElementById('btn-open-add-catalog')?.addEventListener('click', openAddCatalogModal);
    document.getElementById('btn-reset-default-catalog')?.addEventListener('click', resetDefaultCatalog);
    document.getElementById('form-catalog-item')?.addEventListener('submit', handleSaveCatalogItem);

    // Image Upload & Preview in Catalog Modal
    const catalogFile = document.getElementById('catalog-form-image-file');
    const catalogHidImg = document.getElementById('catalog-form-image-data');
    const catalogUrlInput = document.getElementById('catalog-form-image-url');
    const catalogPreviewImg = document.getElementById('catalog-form-preview-img');
    const catalogPlaceholder = document.getElementById('catalog-form-preview-placeholder');

    if (catalogFile) {
        catalogFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const compressedBase64 = await compressImage(file, 400, 400, 0.75);
                if (catalogHidImg) catalogHidImg.value = compressedBase64;
                if (catalogUrlInput) catalogUrlInput.value = '';
                if (catalogPreviewImg) {
                    catalogPreviewImg.src = compressedBase64;
                    catalogPreviewImg.classList.remove('hidden');
                }
                if (catalogPlaceholder) catalogPlaceholder.classList.add('hidden');
                showToast('Foto produk berhasil dimuat!');
            } catch (err) {
                console.error(err);
                alert('Gagal memproses gambar. Pastikan format file JPG/PNG.');
            }
        });
    }

    if (catalogUrlInput) {
        catalogUrlInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) {
                if (catalogHidImg) catalogHidImg.value = val;
                if (catalogPreviewImg) {
                    catalogPreviewImg.src = val;
                    catalogPreviewImg.classList.remove('hidden');
                }
                if (catalogPlaceholder) catalogPlaceholder.classList.add('hidden');
            }
        });
    }

    document.getElementById('btn-clear-catalog-photo')?.addEventListener('click', () => {
        if (catalogFile) catalogFile.value = '';
        if (catalogUrlInput) catalogUrlInput.value = '';
        if (catalogHidImg) catalogHidImg.value = '';
        if (catalogPreviewImg) {
            catalogPreviewImg.src = '';
            catalogPreviewImg.classList.add('hidden');
        }
        if (catalogPlaceholder) catalogPlaceholder.classList.remove('hidden');
    });

    // Ringkasan Pembayaran (Khusus Hari Ini) Filter & Search Listeners
    const summaryValSelect = document.getElementById('select-summary-validation');
    if (summaryValSelect) {
        summaryValSelect.addEventListener('change', (e) => {
            setSummaryValidationFilter(e.target.value);
        });
    }

    const summaryPaySelect = document.getElementById('select-summary-payment');
    if (summaryPaySelect) {
        summaryPaySelect.addEventListener('change', (e) => {
            state.summaryFilterPayment = e.target.value;
            renderPaidServicesSummary();
        });
    }

    const summaryVehSelect = document.getElementById('select-summary-vehicle');
    if (summaryVehSelect) {
        summaryVehSelect.addEventListener('change', (e) => {
            state.summaryFilterVehicle = e.target.value;
            renderPaidServicesSummary();
        });
    }

    const summarySearchInput = document.getElementById('search-paid-services-input');
    if (summarySearchInput) {
        summarySearchInput.addEventListener('input', (e) => {
            state.summarySearchKeyword = e.target.value;
            renderPaidServicesSummary();
        });
    }

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
    renderInfoPanel();
    renderCatalogPanel();
    renderPaidServicesSummary();
    renderShopStatus();
    if (typeof updateLoyaltyBadgesAndCounts === 'function') updateLoyaltyBadgesAndCounts();
}

// --- WORKSHOP HEADER & PROFILE ---
function renderWorkshopHeader() {
    const nameEl = document.getElementById('header-bengkel-name');
    const taglineEl = document.getElementById('header-bengkel-tagline');
    const phoneEl = document.getElementById('header-bengkel-phone');
    const footerNameEl = document.getElementById('footer-bengkel-name');
    const footerHoursEl = document.getElementById('footer-bengkel-hours');

    if (nameEl) nameEl.textContent = state.profile.name;
    if (taglineEl) taglineEl.textContent = state.profile.tagline;
    if (phoneEl) phoneEl.textContent = state.profile.phone;
    if (footerNameEl) footerNameEl.textContent = state.profile.name;
    if (footerHoursEl) footerHoursEl.textContent = 'Buka: ' + (state.profile.operatingHours || DEFAULT_PROFILE.operatingHours || '08.00 - 21.00 WIB');

    renderInfoPanel();
}

function renderProfileForm() {
    const fName = document.getElementById('settings-name');
    const fTagline = document.getElementById('settings-tagline');
    const fPhone = document.getElementById('settings-phone');
    const fEmail = document.getElementById('settings-email');
    const fAddress = document.getElementById('settings-address');
    const fHours = document.getElementById('settings-operating-hours');
    const fFooter = document.getElementById('settings-receipt-footer');
    const fBankName = document.getElementById('settings-bank-name');
    const fBankAccount = document.getElementById('settings-bank-account');
    const fBankHolder = document.getElementById('settings-bank-holder');
    const fClosedReason = document.getElementById('settings-closed-reason');

    if (fName) fName.value = state.profile.name || '';
    if (fTagline) fTagline.value = state.profile.tagline || '';
    if (fPhone) fPhone.value = state.profile.phone || '';
    if (fEmail) fEmail.value = state.profile.email || DEFAULT_PROFILE.email || '';
    if (fAddress) fAddress.value = state.profile.address || '';
    if (fHours) fHours.value = state.profile.operatingHours || DEFAULT_PROFILE.operatingHours || '';
    if (fClosedReason) fClosedReason.value = state.profile.closedReason || '';
    if (fFooter) fFooter.value = state.profile.receiptFooter || '';
    if (fBankName) fBankName.value = state.profile.bankName || DEFAULT_PROFILE.bankName;
    if (fBankAccount) fBankAccount.value = state.profile.bankAccount || DEFAULT_PROFILE.bankAccount;
    if (fBankHolder) fBankHolder.value = state.profile.bankHolder || DEFAULT_PROFILE.bankHolder;

    const fAdminEmail = document.getElementById('settings-admin-email');
    if (fAdminEmail) fAdminEmail.value = state.adminEmail || DEFAULT_ADMIN.email;

    renderShopStatus();
}

function handleSaveProfile(e) {
    e.preventDefault();
    state.profile = {
        ...state.profile,
        name: document.getElementById('settings-name').value.trim() || DEFAULT_PROFILE.name,
        tagline: document.getElementById('settings-tagline').value.trim(),
        phone: document.getElementById('settings-phone').value.trim(),
        email: document.getElementById('settings-email')?.value.trim() || DEFAULT_PROFILE.email,
        address: document.getElementById('settings-address').value.trim(),
        operatingHours: document.getElementById('settings-operating-hours')?.value.trim() || DEFAULT_PROFILE.operatingHours,
        closedReason: document.getElementById('settings-closed-reason')?.value.trim() || (state.profile.closedReason || ''),
        receiptFooter: document.getElementById('settings-receipt-footer').value.trim(),
        bankName: document.getElementById('settings-bank-name')?.value.trim() || DEFAULT_PROFILE.bankName,
        bankAccount: document.getElementById('settings-bank-account')?.value.trim() || DEFAULT_PROFILE.bankAccount,
        bankHolder: document.getElementById('settings-bank-holder')?.value.trim() || DEFAULT_PROFILE.bankHolder
    };
    saveProfile();
    renderWorkshopHeader();
    renderInfoPanel();
    renderPaymentSections();
    renderShopStatus();
    showToast('Profil bengkel & data pembayaran berhasil disimpan!');
}

// --- HELPER CLIPBOARD & STATUS OPERASIONAL ---
function copyToClipboard(text, label = 'Data') {
    if (!text) {
        showToast(`Tidak ada ${label} untuk disalin!`);
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`${label} berhasil disalin ke clipboard!`);
        }).catch(() => {
            fallbackCopyText(text, label);
        });
    } else {
        fallbackCopyText(text, label);
    }
}

function fallbackCopyText(text, label) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast(`${label} berhasil disalin ke clipboard!`);
    } catch (e) {
        showToast(`Gagal menyalin ${label}`);
    }
    document.body.removeChild(ta);
}

function getOperatingStatus(operatingHoursStr) {
    const profile = state.profile || DEFAULT_PROFILE;
    
    // Jika tombol Tutup Bengkel diaktifkan oleh admin
    if (profile && profile.isStoreClosed) {
        const reason = (profile.closedReason || 'Tutup Sementara').trim();
        return {
            isOpen: false,
            isManualClosed: true,
            badgeText: 'SEDANG TUTUP',
            statusDesc: `Operasional bengkel sedang ditutup sementara (${reason}) • Hubungi WhatsApp 085156696378`
        };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    let openTotalMin = 7 * 60 + 30; // 07:30
    let closeTotalMin = 17 * 60; // 17:00

    if (operatingHoursStr) {
        const match = operatingHoursStr.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/);
        if (match) {
            openTotalMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
            closeTotalMin = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
        }
    }

    const isOpen = currentTotalMin >= openTotalMin && currentTotalMin < closeTotalMin;
    const formatTimeStr = (totalMin) => {
        const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
        const m = (totalMin % 60).toString().padStart(2, '0');
        return `${h}.${m}`;
    };

    return {
        isOpen,
        isManualClosed: false,
        badgeText: isOpen ? 'BUKA SEKARANG' : 'SEDANG TUTUP',
        statusDesc: isOpen 
            ? `Buka sampai pkl ${formatTimeStr(closeTotalMin)} WIB • Silakan datang langsung atau booking online`
            : `Buka kembali pkl ${formatTimeStr(openTotalMin)} WIB • Booking online & Chat WhatsApp tetap dapat dikirim`
    };
}

// --- FUNGSI STATUS OPERASIONAL & TUTUP/BUKA BENGKEL ---
function renderShopStatus() {
    const profile = state.profile || DEFAULT_PROFILE;
    const isClosed = Boolean(profile.isStoreClosed);
    const closedReason = (profile.closedReason || 'Tutup Sementara').trim();

    // 1. Status Bar Subheader
    const headerStatus = document.getElementById('header-open-status');
    const headerDot = document.getElementById('header-open-dot');
    const userClosedPill = document.getElementById('user-closed-pill');
    if (headerStatus && headerDot) {
        if (isClosed) {
            headerDot.className = 'w-2 h-2 rounded-full bg-rose-500 animate-pulse';
            headerStatus.className = 'font-bold text-rose-400';
            headerStatus.textContent = `🔴 BENGKEL SEDANG TUTUP ${closedReason ? `(${closedReason})` : ''}`;
            if (userClosedPill) userClosedPill.classList.remove('hidden');
        } else {
            const opStatus = getOperatingStatus(profile.operatingHours);
            headerDot.className = opStatus.isOpen ? 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse' : 'w-2 h-2 rounded-full bg-rose-500';
            headerStatus.className = opStatus.isOpen ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400';
            headerStatus.textContent = opStatus.isOpen ? 'Buka Sekarang' : 'Sedang Tutup';
            if (userClosedPill) userClosedPill.classList.add('hidden');
        }
    }

    // 2. Banner Tutup Bengkel di Form Booking Pengguna
    const userBanner = document.getElementById('banner-user-shop-closed');
    const reasonBadge = document.getElementById('closed-reason-badge');
    if (userBanner) {
        if (isClosed) {
            userBanner.classList.remove('hidden');
            if (reasonBadge) reasonBadge.textContent = closedReason;
        } else {
            userBanner.classList.add('hidden');
        }
    }

    // 3. Tombol Navigasi Tutup/Buka Bengkel di Navbar Admin
    const navToggleBtn = document.getElementById('btn-admin-nav-toggle-shop');
    const navToggleIcon = document.getElementById('nav-shop-toggle-icon');
    const navToggleLabel = document.getElementById('nav-shop-toggle-label');
    if (navToggleBtn) {
        if (isClosed) {
            navToggleBtn.className = 'px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer animate-pulse';
            navToggleBtn.title = 'Bengkel saat ini TUTUP. Klik untuk membuka kembali bengkel untuk pengguna.';
            if (navToggleIcon) navToggleIcon.textContent = '🟢';
            if (navToggleLabel) navToggleLabel.textContent = 'Buka Bengkel';
        } else {
            navToggleBtn.className = 'px-2.5 sm:px-3 py-1.5 sm:py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer';
            navToggleBtn.title = 'Bengkel saat ini BUKA. Klik untuk menutup bengkel & memunculkan status tutup ke pengguna.';
            if (navToggleIcon) navToggleIcon.textContent = '🔴';
            if (navToggleLabel) navToggleLabel.textContent = 'Tutup Bengkel';
        }
    }

    // 4. Kartu Pengaturan Jam Operasional & Status Bengkel di Menu Admin (Settings)
    const settingsBadge = document.getElementById('settings-shop-status-badge');
    const settingsToggleBtn = document.getElementById('btn-settings-toggle-shop');
    const settingsToggleIcon = document.getElementById('settings-toggle-icon');
    const settingsToggleText = document.getElementById('settings-toggle-text');
    const settingsClosedReason = document.getElementById('settings-closed-reason');

    if (settingsBadge) {
        if (isClosed) {
            settingsBadge.innerHTML = `
                <span class="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 rounded-full flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>TUTUP SEMENTARA</span>
                </span>
            `;
        } else {
            settingsBadge.innerHTML = `
                <span class="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>BUKA MELAYANI</span>
                </span>
            `;
        }
    }

    if (settingsToggleBtn) {
        if (isClosed) {
            settingsToggleBtn.className = 'px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer';
            if (settingsToggleIcon) settingsToggleIcon.textContent = '🟢';
            if (settingsToggleText) settingsToggleText.textContent = 'Buka Bengkel Kembali';
        } else {
            settingsToggleBtn.className = 'px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer';
            if (settingsToggleIcon) settingsToggleIcon.textContent = '🔴';
            if (settingsToggleText) settingsToggleText.textContent = 'Tutup Bengkel Sekarang';
        }
    }

    if (settingsClosedReason && !settingsClosedReason.matches(':focus')) {
        settingsClosedReason.value = profile.closedReason || '';
    }

    // 5. Kartu 4 & Hero di Panel Info
    const infoClosedAlert = document.getElementById('info-closed-alert-box');
    const infoClosedReasonText = document.getElementById('info-closed-reason-text');
    if (infoClosedAlert) {
        if (isClosed) {
            infoClosedAlert.classList.remove('hidden');
            if (infoClosedReasonText) {
                infoClosedReasonText.textContent = `Operasional bengkel saat ini sedang ditutup sementara oleh admin (${closedReason}). Silakan hubungi WhatsApp 085156696378.`;
            }
        } else {
            infoClosedAlert.classList.add('hidden');
        }
    }
}

function toggleShopStatus(source = 'nav') {
    if (!state.isAdmin) {
        openAdminLoginModal();
        return;
    }

    const currentClosed = Boolean(state.profile.isStoreClosed);

    if (!currentClosed) {
        // Mau MENUTUP bengkel
        const inputReason = prompt(
            'TUTUP OPERASIONAL BENGKEL:\n\n' +
            'Status tutup akan langsung ditampilkan ke seluruh pengguna/pelanggan di website.\n\n' +
            'Masukkan keterangan/alasan tutup (opsional):',
            state.profile.closedReason || 'Tutup Sementara'
        );
        if (inputReason === null) return; // Dibatalkan

        state.profile.isStoreClosed = true;
        state.profile.closedReason = inputReason.trim() || 'Tutup Sementara';
        saveProfile();
        renderShopStatus();
        renderInfoPanel();
        showToast('🔴 Bengkel berhasil DITUTUP. Status tutup kini tampil di sistem pengguna.');
    } else {
        // Mau MEMBUKA KEMBALI bengkel
        if (!confirm('Buka kembali operasional bengkel untuk melayani pelanggan seperti biasa?')) {
            return;
        }
        state.profile.isStoreClosed = false;
        saveProfile();
        renderShopStatus();
        renderInfoPanel();
        showToast('🟢 Bengkel berhasil DIBUKA kembali untuk pelanggan!');
    }
}
window.toggleShopStatus = toggleShopStatus;

// --- RENDER PANEL INFORMASI PENGGUNA (KONTAK, ALAMAT, EMAIL, JAM BUKA) ---
function renderInfoPanel() {
    const profile = state.profile || DEFAULT_PROFILE;
    const name = profile.name || DEFAULT_PROFILE.name;
    const tagline = profile.tagline || DEFAULT_PROFILE.tagline;
    const phone = profile.phone || DEFAULT_PROFILE.phone;
    const address = profile.address || DEFAULT_PROFILE.address;
    const email = profile.email || DEFAULT_PROFILE.email || 'jaarsgarage.madiun@gmail.com';
    const hours = profile.operatingHours || DEFAULT_PROFILE.operatingHours || 'Senin - Minggu: 08.00 - 21.00 WIB';

    // Populate Hero elements
    const heroName = document.getElementById('info-bengkel-name');
    const heroTagline = document.getElementById('info-bengkel-tagline');
    const heroStatusBadge = document.getElementById('info-status-badge');
    const heroStatusDesc = document.getElementById('info-status-desc');
    const heroWaBtn = document.getElementById('hero-wa-btn');

    if (heroName) heroName.textContent = name;
    if (heroTagline) heroTagline.textContent = tagline;

    // Real-time Operating Status
    const status = getOperatingStatus(hours);
    if (heroStatusBadge) {
        if (status.isOpen) {
            heroStatusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
            heroStatusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> BUKA SEKARANG';
        } else {
            heroStatusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/30';
            heroStatusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-400"></span> SEDANG TUTUP';
        }
    }
    if (heroStatusDesc) {
        heroStatusDesc.innerHTML = `<span>⏱️</span> <span>${status.statusDesc}</span>`;
    }

    // Subheader status badge
    const subheaderStatus = document.getElementById('header-open-status');
    if (subheaderStatus) {
        subheaderStatus.textContent = status.isOpen ? 'Buka Sekarang' : 'Sedang Tutup';
        subheaderStatus.className = status.isOpen ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400';
    }

    // Populate 4 Info Cards
    const infoPhone = document.getElementById('info-bengkel-phone');
    const infoAddress = document.getElementById('info-bengkel-address');
    const infoEmail = document.getElementById('info-bengkel-email');
    const infoHours = document.getElementById('info-bengkel-hours');
    const infoOpenStatusBadge = document.getElementById('info-open-status-badge');

    if (infoPhone) infoPhone.textContent = phone;
    if (infoAddress) infoAddress.textContent = address;
    if (infoEmail) infoEmail.textContent = email;
    if (infoHours) infoHours.textContent = hours;
    if (infoOpenStatusBadge) {
        infoOpenStatusBadge.textContent = status.isOpen ? 'Buka Hari Ini' : 'Tutup Hari Ini';
        infoOpenStatusBadge.className = status.isOpen 
            ? 'text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full'
            : 'text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full';
    }

    // Sync all shop status elements
    renderShopStatus();

    // Action Links
    const cleanPhone = formatWhatsAppNumber(phone);
    const waText = encodeURIComponent(`Halo ${name}, saya ingin bertanya mengenai layanan tambal ban / cuci kendaraan.`);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : '#';

    const linkWa = document.getElementById('link-wa-direct');
    if (linkWa) linkWa.href = waUrl;
    if (heroWaBtn) heroWaBtn.href = waUrl;

    const linkPhone = document.getElementById('link-phone-call');
    if (linkPhone) {
        linkPhone.href = phone ? `tel:${phone.replace(/\s+/g, '')}` : '#';
    }

    const linkGmaps = document.getElementById('link-gmaps');
    if (linkGmaps) {
        linkGmaps.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || (name + ' Madiun'))}`;
    }

    const linkEmail = document.getElementById('link-email-direct');
    if (linkEmail) {
        const mailSubject = encodeURIComponent(`Pertanyaan Layanan - ${name}`);
        linkEmail.href = email ? `mailto:${email}?subject=${mailSubject}` : '#';
    }
}

// --- PAYMENT SECTIONS & QRIS / TRANSFER DISPLAY ---
function renderPaymentSections() {
    const cashSection = document.getElementById('cash-calculation-section');
    const qrisSection = document.getElementById('qris-display-section');
    const transferSection = document.getElementById('transfer-display-section');
    const bonSection = document.getElementById('bon-display-section');

    // Jika bukan admin dan metode adalah cash atau bon, paksa ke QRIS atau Transfer
    if (!state.isAdmin && (state.paymentMethod === 'cash' || state.paymentMethod === 'bon')) {
        state.paymentMethod = 'qris';
        const qrisRadio = document.querySelector('input[name="payment-method"][value="qris"]');
        if (qrisRadio) qrisRadio.checked = true;
    }

    const method = state.paymentMethod || 'qris';

    if (cashSection) cashSection.classList.toggle('hidden', method !== 'cash' || !state.isAdmin);
    if (qrisSection) qrisSection.classList.toggle('hidden', method !== 'qris');
    if (transferSection) transferSection.classList.toggle('hidden', method !== 'transfer');
    if (bonSection) bonSection.classList.toggle('hidden', method !== 'bon' || !state.isAdmin);

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

// --- HELPER COMPRESS IMAGE & FALLBACK ---
function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Gagal memproses gambar'));
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getFallbackCatalogImage(category) {
    const isOil = (category || '').includes('oli');
    const isCar = (category || '').includes('mobil');
    const bgColor = isOil ? '#f59e0b' : (isCar ? '#0284c7' : '#10b981');
    const icon = isOil ? '🛢️' : '🛞';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="${bgColor}"/>
        <circle cx="200" cy="200" r="110" fill="#ffffff" opacity="0.18"/>
        <circle cx="200" cy="200" r="85" fill="#ffffff" opacity="0.12"/>
        <text x="200" y="235" font-size="100" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${icon}</text>
    </svg>`;

    try {
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    } catch (e) {
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
}

window.handleCatalogImgError = function(imgEl, category) {
    if (!imgEl) return;
    imgEl.onerror = null;
    imgEl.src = getFallbackCatalogImage(category);
};

// --- KATALOG BAN MOTOR, MOBIL & OLI KENDARAAN ---
function renderCatalogPanel() {
    updateCatalogCountBadges();
    renderCatalogFilterBrands();
    renderCatalogProducts();

    const toolbar = document.getElementById('catalog-admin-toolbar');
    if (toolbar) {
        if (state.isAdmin) {
            toolbar.classList.remove('hidden');
        } else {
            toolbar.classList.add('hidden');
        }
    }
}

function updateCatalogCountBadges() {
    const catalog = state.catalog || [];
    const countAll = catalog.length;
    const countBanMotor = catalog.filter(p => p.category === 'ban-motor').length;
    const countBanMobil = catalog.filter(p => p.category === 'ban-mobil').length;
    const countOli = catalog.filter(p => p.category.includes('oli')).length;

    const bAll = document.getElementById('badge-count-all');
    const bMotor = document.getElementById('badge-count-ban-motor');
    const bMobil = document.getElementById('badge-count-ban-mobil');
    const bOli = document.getElementById('badge-count-oli');

    if (bAll) bAll.textContent = countAll;
    if (bMotor) bMotor.textContent = countBanMotor;
    if (bMobil) bMobil.textContent = countBanMobil;
    if (bOli) bOli.textContent = countOli;
}

function renderCatalogFilterBrands() {
    const bar = document.getElementById('catalog-brand-filter-bar');
    if (!bar) return;

    let items = state.catalog || [];
    if (state.catalogCategoryFilter === 'ban-motor') {
        items = items.filter(p => p.category === 'ban-motor');
    } else if (state.catalogCategoryFilter === 'ban-mobil') {
        items = items.filter(p => p.category === 'ban-mobil');
    } else if (state.catalogCategoryFilter === 'oli') {
        items = items.filter(p => p.category.includes('oli'));
    }

    const brands = [ ...new Set(items.map(p => p.brand).filter(Boolean)) ].sort();

    let html = `
        <button type="button" data-catalog-brand="all"
            class="px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${state.catalogBrandFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            Semua Merek
        </button>
    `;

    brands.forEach(b => {
        const isActive = state.catalogBrandFilter.toLowerCase() === b.toLowerCase();
        html += `
            <button type="button" data-catalog-brand="${b}"
                class="px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${isActive ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                ${b}
            </button>
        `;
    });

    bar.innerHTML = html;

    bar.querySelectorAll('[data-catalog-brand]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.catalogBrandFilter = btn.getAttribute('data-catalog-brand');
            renderCatalogFilterBrands();
            renderCatalogProducts();
        });
    });
}

function renderCatalogProducts() {
    const grid = document.getElementById('catalog-products-grid');
    const emptyState = document.getElementById('catalog-empty-state');
    const countEl = document.getElementById('catalog-results-count');
    if (!grid) return;

    let list = state.catalog || [];

    if (state.catalogCategoryFilter === 'ban-motor') {
        list = list.filter(p => p.category === 'ban-motor');
    } else if (state.catalogCategoryFilter === 'ban-mobil') {
        list = list.filter(p => p.category === 'ban-mobil');
    } else if (state.catalogCategoryFilter === 'oli') {
        list = list.filter(p => p.category.includes('oli'));
    }

    if (state.catalogBrandFilter && state.catalogBrandFilter !== 'all') {
        list = list.filter(p => p.brand.toLowerCase() === state.catalogBrandFilter.toLowerCase());
    }

    if (state.catalogSearchQuery) {
        const q = state.catalogSearchQuery.toLowerCase();
        list = list.filter(p => 
            (p.brand && p.brand.toLowerCase().includes(q)) ||
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.spec && p.spec.toLowerCase().includes(q)) ||
            (p.desc && p.desc.toLowerCase().includes(q))
        );
    }

    if (countEl) {
        countEl.textContent = `${list.length} produk ditampilkan`;
    }

    if (list.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = list.map(item => {
        let catBadgeText = 'Ban Motor';
        let catBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (item.category === 'ban-mobil') {
            catBadgeText = 'Ban Mobil';
            catBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
        } else if (item.category === 'oli-motor') {
            catBadgeText = 'Oli Motor';
            catBadgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
        } else if (item.category === 'oli-mobil') {
            catBadgeText = 'Oli Mobil';
            catBadgeClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
        }

        let stockText = 'Ready Stok';
        let stockClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (item.stockStatus === 'limited') {
            stockText = 'Stok Terbatas';
            stockClass = 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (item.stockStatus === 'preorder') {
            stockText = 'Bisa Dipesan';
            stockClass = 'bg-blue-50 text-blue-700 border-blue-200';
        }

        const fallbackImg = getFallbackCatalogImage(item.category);
        const imgSrc = (item.image && typeof item.image === 'string' && item.image.trim()) ? item.image : fallbackImg;

        return `
            <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                <!-- Area Tinjau Produk yang Dapat Diklik -->
                <div onclick="openCatalogDetailModal('${escapeHtml(item.id)}')" class="cursor-pointer" title="Klik untuk meninjau detail & spesifikasi lengkap produk">
                    <!-- Product Image Container -->
                    <div class="relative w-full aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                        <img src="${imgSrc}" alt="${escapeHtml(item.brand)} ${escapeHtml(item.name)}"
                            onerror="window.handleCatalogImgError(this, '${escapeHtml(item.category)}')"
                            class="w-full h-full object-cover group-hover:scale-105 transition-all duration-300">
                        
                        <!-- Overlay Tombol Tinjau Detail saat Hover -->
                        <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span class="bg-white/95 text-slate-800 text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all backdrop-blur-xs">
                                <span>🔍</span>
                                <span>Tinjau Produk</span>
                            </span>
                        </div>

                        <!-- Badges on Image -->
                        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-slate-800 shadow-xs backdrop-blur-xs border border-slate-200">
                                ${escapeHtml(item.brand)}
                            </span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${catBadgeClass} bg-white/90 shadow-xs backdrop-blur-xs">
                                ${catBadgeText}
                            </span>
                        </div>

                        <div class="absolute bottom-2.5 right-2.5">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${stockClass} bg-white/95 shadow-xs backdrop-blur-xs">
                                ${stockText}
                            </span>
                        </div>
                    </div>

                    <!-- Product Body Content -->
                    <div class="p-4 flex flex-col gap-1.5">
                        <div class="flex items-start justify-between gap-1">
                            <div>
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">${escapeHtml(item.brand)}</span>
                                <h4 class="font-extrabold text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">${escapeHtml(item.name)}</h4>
                            </div>
                        </div>

                        <div class="inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-mono font-semibold text-slate-700 w-fit">
                            <span>📐</span>
                            <span>${escapeHtml(item.spec)}</span>
                        </div>

                        ${item.desc ? `<p class="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">${escapeHtml(item.desc)}</p>` : ''}

                        <!-- Price Tag -->
                        <div class="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                            <span class="text-[10px] uppercase font-bold text-slate-400">Harga Resmi</span>
                            <span class="font-black text-base text-emerald-700">${formatRupiah(item.price)}</span>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-1.5">
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="event.stopPropagation(); inquireCatalogWhatsApp('${escapeHtml(item.id)}')"
                            class="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                            title="Tanya ketersediaan stok via WhatsApp">
                            <span>💬</span>
                            <span>Tanya WA</span>
                        </button>
                        <button type="button" onclick="event.stopPropagation(); addCatalogItemToCart('${escapeHtml(item.id)}')"
                            class="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                            title="${state.isAdmin ? 'Masukkan produk ini ke nota kasir saat ini' : 'Tambahkan produk ini ke form booking pelayanan'}">
                            <span>${state.isAdmin ? '🛒' : '📅'}</span>
                            <span class="hidden sm:inline">${state.isAdmin ? 'Kasir' : 'Booking'}</span>
                        </button>
                    </div>

                    ${state.isAdmin ? `
                    <div class="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                        <button type="button" onclick="event.stopPropagation(); openEditCatalogModal('${escapeHtml(item.id)}')"
                            class="flex-1 py-1.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-[11px] rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1">
                            <span>✏️</span>
                            <span>Edit</span>
                        </button>
                        <button type="button" onclick="event.stopPropagation(); deleteCatalogItem('${escapeHtml(item.id)}')"
                            class="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-bold text-[11px] rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1"
                            title="Hapus produk ini">
                            <span>🗑️</span>
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// --- MODAL TINJAU DETAIL PRODUK KATALOG (USER & ADMIN) ---
function openCatalogDetailModal(itemId) {
    const item = (state.catalog || []).find(p => p.id === itemId);
    if (!item) return;

    const modal = document.getElementById('modal-catalog-detail');
    if (!modal) return;

    // Foto produk
    const imgEl = document.getElementById('detail-product-img');
    const fallbackImg = getFallbackCatalogImage(item.category);
    const imgSrc = (item.image && typeof item.image === 'string' && item.image.trim()) ? item.image : fallbackImg;
    if (imgEl) {
        imgEl.src = imgSrc;
        imgEl.alt = `${item.brand} ${item.name}`;
        imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = fallbackImg; };
    }

    // Merek
    const brandBadge = document.getElementById('detail-brand-badge');
    const brandText = document.getElementById('detail-brand-text');
    if (brandBadge) brandBadge.textContent = item.brand;
    if (brandText) brandText.textContent = item.brand;

    // Nama produk
    const nameEl = document.getElementById('detail-name-text');
    if (nameEl) nameEl.textContent = item.name;

    // Spesifikasi teknis
    const specEl = document.getElementById('detail-spec-text');
    if (specEl) specEl.textContent = item.spec || '-';

    // Harga
    const priceEl = document.getElementById('detail-price-text');
    if (priceEl) priceEl.textContent = formatRupiah(item.price);

    // Deskripsi / Rekomendasi
    const descEl = document.getElementById('detail-desc-text');
    if (descEl) {
        descEl.textContent = item.desc || 'Produk ban & oli original bergaransi resmi dari Bengkel JAARS. Melayani konsultasi pemilihan tipe yang sesuai dengan kendaraan Anda dan siap pasang langsung di bengkel.';
    }

    // Kategori
    const catIcon = document.getElementById('detail-category-icon');
    const catBadge = document.getElementById('detail-category-badge');
    let catText = 'Ban Motor';
    let catIconChar = '🛵';
    let catClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (item.category === 'ban-mobil') {
        catText = 'Ban Mobil';
        catIconChar = '🚗';
        catClass = 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (item.category === 'oli-motor') {
        catText = 'Oli Motor';
        catIconChar = '🛢️';
        catClass = 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (item.category === 'oli-mobil') {
        catText = 'Oli Mobil';
        catIconChar = '🛢️';
        catClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
    }
    if (catIcon) catIcon.textContent = catIconChar;
    if (catBadge) {
        catBadge.textContent = catText;
        catBadge.className = `px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${catClass}`;
    }

    // Status Stok
    const stockBadge = document.getElementById('detail-stock-badge');
    let sText = 'Ready Stok';
    let sClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (item.stockStatus === 'limited') {
        sText = 'Stok Terbatas';
        sClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (item.stockStatus === 'preorder') {
        sText = 'Bisa Dipesan';
        sClass = 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (stockBadge) {
        stockBadge.textContent = sText;
        stockBadge.className = `px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sClass}`;
    }

    // Tombol WhatsApp
    const btnWa = document.getElementById('detail-btn-wa');
    if (btnWa) {
        btnWa.onclick = () => inquireCatalogWhatsApp(itemId);
    }

    // Tombol Kasir / Booking
    const btnCart = document.getElementById('detail-btn-cart');
    if (btnCart) {
        btnCart.innerHTML = state.isAdmin 
            ? '<span>🛒</span> <span>Masukkan ke Kasir (+ Kasir)</span>'
            : '<span>📅</span> <span>Tambah ke Booking Pelayanan</span>';
        btnCart.onclick = () => {
            addCatalogItemToCart(itemId);
            closeModal();
        };
    }

    // Tombol Edit Admin
    const btnEditAdmin = document.getElementById('detail-btn-edit-admin');
    if (btnEditAdmin) {
        if (state.isAdmin) {
            btnEditAdmin.classList.remove('hidden');
            btnEditAdmin.onclick = () => {
                closeModal();
                openEditCatalogModal(itemId);
            };
        } else {
            btnEditAdmin.classList.add('hidden');
        }
    }

    modal.classList.remove('hidden');
}

function openAddCatalogModal() {
    state.editingCatalogId = null;
    const title = document.getElementById('modal-catalog-title');
    const form = document.getElementById('form-catalog-item');
    if (title) title.textContent = 'Tambah Produk Ban / Oli Baru';
    if (form) form.reset();

    const hidId = document.getElementById('catalog-form-id');
    const hidImg = document.getElementById('catalog-form-image-data');
    const previewImg = document.getElementById('catalog-form-preview-img');
    const previewPlaceholder = document.getElementById('catalog-form-preview-placeholder');

    if (hidId) hidId.value = '';
    if (hidImg) hidImg.value = '';
    if (previewImg) {
        previewImg.src = '';
        previewImg.classList.add('hidden');
    }
    if (previewPlaceholder) previewPlaceholder.classList.remove('hidden');

    const modal = document.getElementById('modal-catalog-item');
    if (modal) modal.classList.remove('hidden');
}

function openEditCatalogModal(id) {
    const item = state.catalog.find(p => p.id === id);
    if (!item) return;

    state.editingCatalogId = id;
    const title = document.getElementById('modal-catalog-title');
    if (title) title.textContent = `Edit Produk: ${item.brand} ${item.name}`;

    const hidId = document.getElementById('catalog-form-id');
    const cat = document.getElementById('catalog-form-category');
    const brand = document.getElementById('catalog-form-brand');
    const name = document.getElementById('catalog-form-name');
    const spec = document.getElementById('catalog-form-spec');
    const price = document.getElementById('catalog-form-price');
    const stock = document.getElementById('catalog-form-stock');
    const desc = document.getElementById('catalog-form-desc');
    const hidImg = document.getElementById('catalog-form-image-data');
    const urlInput = document.getElementById('catalog-form-image-url');
    const previewImg = document.getElementById('catalog-form-preview-img');
    const previewPlaceholder = document.getElementById('catalog-form-preview-placeholder');

    if (hidId) hidId.value = item.id;
    if (cat) cat.value = item.category;
    if (brand) brand.value = item.brand;
    if (name) name.value = item.name;
    if (spec) spec.value = item.spec;
    if (price) price.value = item.price;
    if (stock) stock.value = item.stockStatus || 'ready';
    if (desc) desc.value = item.desc || '';
    if (hidImg) hidImg.value = item.image || '';
    if (urlInput) urlInput.value = item.image && item.image.startsWith('http') ? item.image : '';

    if (item.image) {
        if (previewImg) {
            previewImg.src = item.image;
            previewImg.classList.remove('hidden');
        }
        if (previewPlaceholder) previewPlaceholder.classList.add('hidden');
    } else {
        if (previewImg) {
            previewImg.src = '';
            previewImg.classList.add('hidden');
        }
        if (previewPlaceholder) previewPlaceholder.classList.remove('hidden');
    }

    const modal = document.getElementById('modal-catalog-item');
    if (modal) modal.classList.remove('hidden');
}

async function handleSaveCatalogItem(e) {
    e.preventDefault();
    const id = document.getElementById('catalog-form-id').value;
    const category = document.getElementById('catalog-form-category').value;
    const brand = document.getElementById('catalog-form-brand').value.trim();
    const name = document.getElementById('catalog-form-name').value.trim();
    const spec = document.getElementById('catalog-form-spec').value.trim();
    const price = Number(document.getElementById('catalog-form-price').value) || 0;
    const stockStatus = document.getElementById('catalog-form-stock').value;
    const desc = document.getElementById('catalog-form-desc').value.trim();
    let image = document.getElementById('catalog-form-image-data').value.trim();
    const urlInput = document.getElementById('catalog-form-image-url').value.trim();

    if (urlInput && !image) {
        image = urlInput;
    }

    if (!brand || !name || price <= 0) {
        alert('Mohon lengkapi merek, nama produk, dan harga yang valid!');
        return;
    }

    if (id) {
        // Edit existing
        const idx = state.catalog.findIndex(p => p.id === id);
        if (idx >= 0) {
            state.catalog[idx] = {
                ...state.catalog[idx],
                category, brand, name, spec, price, stockStatus, desc,
                image: image || state.catalog[idx].image
            };
        }
    } else {
        // Create new
        const newItem = {
            id: generateId('cat'),
            category, brand, name, spec, price, stockStatus, desc,
            image: image || ''
        };
        state.catalog.unshift(newItem);
    }

    saveCatalog();
    closeModal();
    renderCatalogPanel();
    showToast(`Produk "${brand} ${name}" berhasil disimpan ke katalog!`);
}

function deleteCatalogItem(id) {
    const item = state.catalog.find(p => p.id === id);
    if (!item) return;

    if (confirm(`Yakin ingin menghapus produk "${item.brand} ${item.name}" dari katalog?`)) {
        state.catalog = state.catalog.filter(p => p.id !== id);
        saveCatalog();
        renderCatalogPanel();
        showToast(`Produk "${item.brand} ${item.name}" telah dihapus.`);
    }
}

function resetDefaultCatalog() {
    if (confirm('PERINGATAN: Semua produk katalog akan dikembalikan ke daftar bawaan default awal. Lanjutkan?')) {
        state.catalog = [ ...DEFAULT_CATALOG ];
        saveCatalog();
        renderCatalogPanel();
        showToast('Katalog ban & oli berhasil direset ke pengaturan default.');
    }
}

function inquireCatalogWhatsApp(itemId) {
    const item = state.catalog.find(p => p.id === itemId);
    if (!item) return;

    const profile = state.profile || DEFAULT_PROFILE;
    const phone = profile.phone || DEFAULT_PROFILE.phone;
    const cleanPhone = formatWhatsAppNumber(phone);
    if (!cleanPhone) {
        alert('Nomor WhatsApp bengkel belum diatur!');
        return;
    }

    let categoryLabel = 'Ban Motor';
    if (item.category === 'ban-mobil') categoryLabel = 'Ban Mobil';
    else if (item.category === 'oli-motor') categoryLabel = 'Oli Motor';
    else if (item.category === 'oli-mobil') categoryLabel = 'Oli Mobil';

    const msg = `Halo *${profile.name}*,\nSaya melihat katalog di website dan ingin menanyakan stok produk:\n\n*${item.brand} - ${item.name}*\n📦 Kategori: ${categoryLabel}\n📐 Spesifikasi/Ukuran: ${item.spec}\n💰 Harga: ${formatRupiah(item.price)}\n\nApakah barang ini ready dan bisa langsung dipasang/ganti di bengkel? Terima kasih!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

function addCatalogItemToCart(itemId) {
    const item = state.catalog.find(p => p.id === itemId);
    if (!item) return;

    const existingIndex = state.cart.findIndex(c => c.catalogId === itemId || c.name === `${item.brand} ${item.name} (${item.spec})`);
    if (existingIndex >= 0) {
        state.cart[existingIndex].qty += 1;
    } else {
        state.cart.push({
            id: generateId('cart'),
            catalogId: item.id,
            name: `${item.brand} ${item.name} (${item.spec})`,
            price: Number(item.price),
            qty: 1,
            unit: 'pcs',
            applicable: item.category.includes('motor') ? 'motor' : 'mobil'
        });
    }
    renderCart();
    showToast(`"${item.brand} ${item.name}" dimasukkan ke Struk Kasir!`);
}

// Expose functions to window for onclick handlers
window.openCatalogDetailModal = openCatalogDetailModal;
window.openAddCatalogModal = openAddCatalogModal;
window.openEditCatalogModal = openEditCatalogModal;
window.deleteCatalogItem = deleteCatalogItem;
window.resetDefaultCatalog = resetDefaultCatalog;
window.inquireCatalogWhatsApp = inquireCatalogWhatsApp;
window.addCatalogItemToCart = addCatalogItemToCart;
window.handleCatalogImgError = handleCatalogImgError;

// Cloud Sync Window Exports
window.syncChannel = syncChannel;
window.mergeTransactionsClient = mergeTransactionsClient;
window.mergeVouchersClient = mergeVouchersClient;
window.mergeClearedVehiclesClient = mergeClearedVehiclesClient;
window.openCloudSyncModal = openCloudSyncModal;
window.openCloudQrModal = openCloudQrModal;
window.syncFromCloud = syncFromCloud;
window.syncToCloud = syncToCloud;
window.copySyncShareUrl = copySyncShareUrl;
window.shareSyncWhatsApp = shareSyncWhatsApp;
window.downloadUpdatedDefaultData = downloadUpdatedDefaultData;
window.saveCustomCloudSyncUrl = saveCustomCloudSyncUrl;
window.toggleCloudConfigAdvanced = toggleCloudConfigAdvanced;

// --- ADMIN MODE MANAGER ---
function updateAdminUI() {
    const navGroup = document.getElementById('admin-nav-group');
    const btnLogin = document.getElementById('btn-admin-login');
    const barLoggedIn = document.getElementById('admin-logged-in-bar');
    const catalogToolbar = document.getElementById('catalog-admin-toolbar');
    const btnCloudSync = document.getElementById('btn-cloud-sync-status');
    const summaryAdminBadge = document.getElementById('summary-admin-badge');
    const posHeaderStatusText = document.getElementById('pos-header-status-text');

    const cashWrapper = document.getElementById('payment-method-cash-wrapper');
    const bonWrapper = document.getElementById('payment-method-bon-wrapper');
    const paymentGrid = document.getElementById('payment-methods-selector-grid');
    const paymentModeBadge = document.getElementById('payment-method-mode-badge');
    const navPosIcon = document.getElementById('nav-pos-icon');
    const navPosLabel = document.getElementById('nav-pos-label');
    const cartPanelTitle = document.getElementById('cart-panel-title');
    const cartPanelDesc = document.getElementById('cart-panel-desc');
    const btnCheckoutIcon = document.getElementById('btn-checkout-icon');
    const btnCheckoutText = document.getElementById('btn-checkout-text');

    const discountWrapper = document.getElementById('cart-discount-wrapper');
    const discountRow = document.getElementById('summary-discount-row');
    const discountInput = document.getElementById('discount-value');
    const discountTypeSelect = document.getElementById('discount-type');

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
        if (catalogToolbar) catalogToolbar.classList.remove('hidden');
        if (btnCloudSync) {
            btnCloudSync.classList.remove('hidden');
            btnCloudSync.classList.add('flex');
        }
        if (summaryAdminBadge) summaryAdminBadge.classList.remove('hidden');
        if (posHeaderStatusText) posHeaderStatusText.textContent = 'Mode Admin: Kasir & Booking Pelayanan Aktif';

        // Tampilkan Metode Tunai & Bon Khusus Admin
        if (cashWrapper) cashWrapper.classList.remove('hidden');
        if (bonWrapper) bonWrapper.classList.remove('hidden');
        if (paymentGrid) {
            paymentGrid.classList.remove('grid-cols-2');
            paymentGrid.classList.add('grid-cols-4');
        }
        if (paymentModeBadge) {
            paymentModeBadge.textContent = 'Admin: Semua Metode (Tunai, QRIS, BRI, Bon)';
            paymentModeBadge.className = 'text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full';
        }

        // Tampilkan Fitur Diskon Khusus Kasir Admin
        if (discountWrapper) discountWrapper.classList.remove('hidden');
        if (discountRow) discountRow.classList.remove('hidden');

        if (navPosIcon) navPosIcon.textContent = '📅';
        if (navPosLabel) navPosLabel.innerHTML = '<span class="hidden md:inline">Booking</span> Pelayanan';
        if (cartPanelTitle) cartPanelTitle.textContent = '🧮 Nota Kasir & Booking';
        if (cartPanelDesc) cartPanelDesc.textContent = 'Mode kasir admin: input pesanan, diskon kasir, pembayaran tunai/non-tunai & cetak nota';
        if (btnCheckoutIcon) btnCheckoutIcon.textContent = '🧾';
        if (btnCheckoutText) btnCheckoutText.textContent = 'Selesaikan & Cetak Struk';
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
        if (catalogToolbar) catalogToolbar.classList.add('hidden');
        if (btnCloudSync) {
            btnCloudSync.classList.add('hidden');
            btnCloudSync.classList.remove('flex');
        }
        if (summaryAdminBadge) summaryAdminBadge.classList.add('hidden');
        if (posHeaderStatusText) posHeaderStatusText.textContent = 'Booking Pelayanan Online Bengkel JAARS';

        // Hapus & Sembunyikan Pembayaran Uang Tunai & Bon di Sistem Pengguna/User
        if (cashWrapper) cashWrapper.classList.add('hidden');
        if (bonWrapper) bonWrapper.classList.add('hidden');
        if (paymentGrid) {
            paymentGrid.classList.remove('grid-cols-4');
            paymentGrid.classList.add('grid-cols-2');
        }
        if (paymentModeBadge) {
            paymentModeBadge.textContent = 'Non-Tunai (QRIS & Transfer BRI)';
            paymentModeBadge.className = 'text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full';
        }

        // Hapus & Sembunyikan Fitur Diskon di Sistem Pengguna/User (Hanya Bisa Dilakukan di Sistem Admin)
        if (discountWrapper) discountWrapper.classList.add('hidden');
        if (discountRow) discountRow.classList.add('hidden');
        state.discountValue = 0;
        state.discountType = 'nominal';
        if (discountInput) discountInput.value = '0';
        if (discountTypeSelect) discountTypeSelect.value = 'nominal';

        if (navPosIcon) navPosIcon.textContent = '📅';
        if (navPosLabel) navPosLabel.innerHTML = '<span class="hidden md:inline">Booking</span> Pelayanan';
        if (cartPanelTitle) cartPanelTitle.textContent = '📅 Form Booking Pelayanan';
        if (cartPanelDesc) cartPanelDesc.textContent = 'Pilih layanan bengkel & lakukan pembayaran digital non-tunai';
        if (btnCheckoutIcon) btnCheckoutIcon.textContent = '📅';
        if (btnCheckoutText) btnCheckoutText.textContent = 'Konfirmasi Booking Pelayanan';

        // Jika sebelumnya metode adalah cash atau bon, otomatis ubah ke QRIS
        if (state.paymentMethod === 'cash' || state.paymentMethod === 'bon') {
            state.paymentMethod = 'qris';
        }
        const qrisRadio = document.querySelector('input[name="payment-method"][value="qris"]');
        const transferRadio = document.querySelector('input[name="payment-method"][value="transfer"]');
        if (state.paymentMethod === 'transfer' && transferRadio) {
            transferRadio.checked = true;
        } else if (qrisRadio) {
            qrisRadio.checked = true;
        }

        // Jika sedang berada di tab admin saat logout, kembalikan ke tab pos (booking)
        if (state.activeTab !== 'pos' && state.activeTab !== 'catalog' && state.activeTab !== 'info') {
            switchTab('pos');
        }
    }

    renderShopStatus();

    renderPaymentSections();
    renderCatalogProducts();
    renderPaidServicesSummary();
    if (typeof updateLoyaltyBadgesAndCounts === 'function') updateLoyaltyBadgesAndCounts();
}

function openAdminLoginModal() {
    const modal = document.getElementById('modal-admin-login');
    const emailInput = document.getElementById('admin-email-input');
    const passwordInput = document.getElementById('admin-password-input');
    const errorMsg = document.getElementById('admin-login-error');

    if (!modal) return;
    if (emailInput) {
        emailInput.value = state.adminEmail || DEFAULT_ADMIN.email;
    }
    if (passwordInput) {
        passwordInput.value = '';
    }
    if (errorMsg) errorMsg.classList.add('hidden');

    modal.classList.remove('hidden');
    setTimeout(() => {
        if (emailInput && !emailInput.value) {
            emailInput.focus();
        } else if (passwordInput) {
            passwordInput.focus();
        }
    }, 150);
}

function handleAdminLoginSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('admin-email-input');
    const passwordInput = document.getElementById('admin-password-input');
    const errorMsg = document.getElementById('admin-login-error');

    const enteredEmail = (emailInput?.value || '').toLowerCase().trim();
    const enteredPassword = (passwordInput?.value || '').trim();

    const expectedEmail = (state.adminEmail || DEFAULT_ADMIN.email).toLowerCase().trim();
    const expectedPassword = state.adminPassword || DEFAULT_ADMIN.password;

    if (enteredEmail === expectedEmail && enteredPassword === expectedPassword) {
        state.isAdmin = true;
        sessionStorage.setItem('bengkel_is_admin', 'true');
        closeModal();
        updateAdminUI();
        switchTab('summary');
        showToast('Login berhasil! Selamat datang Admin.');
    } else {
        if (errorMsg) {
            errorMsg.classList.remove('hidden');
            errorMsg.textContent = '❌ Email atau Password salah! Periksa kembali kredensial Anda.';
        }
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

function handleAdminLogout() {
    state.isAdmin = false;
    sessionStorage.removeItem('bengkel_is_admin');
    updateAdminUI();
    showToast('Telah keluar dari mode Admin. Mode Kasir aktif.');
}

function handleSaveAdminAccount(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('settings-admin-email');
    const pwdInput = document.getElementById('settings-admin-password');
    const confirmPwdInput = document.getElementById('settings-admin-confirm-password');

    const newEmail = (emailInput?.value || '').toLowerCase().trim();
    const newPwd = (pwdInput?.value || '').trim();
    const confirmPwd = (confirmPwdInput?.value || '').trim();

    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
        alert('Masukkan format alamat email yang valid!');
        emailInput?.focus();
        return;
    }

    if (newPwd) {
        if (newPwd.length < 6) {
            alert('Password admin baru minimal 6 karakter demi keamanan!');
            pwdInput?.focus();
            return;
        }
        if (newPwd !== confirmPwd) {
            alert('Konfirmasi password tidak cocok dengan password baru!');
            confirmPwdInput?.focus();
            return;
        }
        state.adminPassword = newPwd;
        localStorage.setItem('bengkel_admin_password', newPwd);
    }

    state.adminEmail = newEmail;
    localStorage.setItem('bengkel_admin_email', newEmail);

    if (pwdInput) pwdInput.value = '';
    if (confirmPwdInput) confirmPwdInput.value = '';

    triggerAutoSyncToCloud('Akun Admin');
    showToast('Kredensial email & password admin berhasil diperbarui!');
}

// --- TAB SWITCHER ---
function switchTab(tabId) {
    // Proteksi: Hanya admin yang boleh membuka menu kelola selain 'pos', 'catalog', dan 'info'
    if (tabId !== 'pos' && tabId !== 'catalog' && tabId !== 'info' && !state.isAdmin) {
        openAdminLoginModal();
        return;
    }

    state.activeTab = tabId;
    
    // Nav tabs styling
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
        if (btn.getAttribute('data-tab-target') === tabId) {
            btn.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
            btn.classList.remove('text-slate-600', 'hover:bg-slate-200/60');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
            btn.classList.add('text-slate-600', 'hover:bg-slate-200/60');
        }
    });

    // Show/hide sections
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    const activeSection = document.getElementById(`panel-${tabId}`);
    if (activeSection) activeSection.classList.remove('hidden');

    if (tabId === 'pos') {
        renderCart();
        renderCatalog();
    } else if (tabId === 'summary') {
        renderPaidServicesSummary();
    } else if (tabId === 'prices') {
        renderPricesTable();
    } else if (tabId === 'history') {
        renderHistory();
    } else if (tabId === 'info') {
        renderInfoPanel();
    } else if (tabId === 'catalog') {
        renderCatalogPanel();
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
    if (typeof updateCartWashLoyaltyIndicator === 'function') updateCartWashLoyaltyIndicator();
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

    const discountRow = document.getElementById('summary-discount-row');
    if (discountRow) {
        if (state.isAdmin) {
            discountRow.classList.remove('hidden');
        } else {
            discountRow.classList.add('hidden');
        }
    }

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
        catalog: state.catalog,
        categories: state.categories,
        transactions: state.transactions,
        adminEmail: state.adminEmail
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
            if (data.catalog && Array.isArray(data.catalog)) {
                state.catalog = data.catalog;
                saveCatalog();
            }
            if (data.adminEmail) {
                state.adminEmail = data.adminEmail;
                localStorage.setItem('bengkel_admin_email', data.adminEmail);
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
        alert('Daftar layanan / barang masih kosong! Pilih minimal 1 layanan bengkel atau produk terlebih dahulu.');
        return;
    }

    if (!state.isAdmin && state.paymentMethod === 'cash') {
        alert('Pembayaran uang tunai hanya dapat dilakukan langsung di kasir oleh admin bengkel. Untuk booking online, silakan gunakan pembayaran non-tunai (QRIS atau Transfer Bank BRI).');
        state.paymentMethod = 'qris';
        renderPaymentSections();
        return;
    }

    const totals = calculateTotals();

    if (state.paymentMethod === 'cash' && totals.cash < totals.total) {
        if (!confirm(`Uang tunai kurang (${formatRupiah(Math.abs(totals.change))}). Apakah transaksi ini ingin tetap dicatat sebagai Belum Lunas / Bon?`)) {
            return;
        }
    }

    const isBookingMode = !state.isAdmin;
    const bookingCode = `INV-${Date.now().toString().slice(-6)}`;
    const isCash = state.paymentMethod === 'cash';
    const isBon = state.paymentMethod === 'bon';

    const transaction = {
        id: generateId('INV'),
        invoiceNo: bookingCode,
        date: new Date().toISOString(),
        customerName: state.customerName || (isBookingMode ? 'Pelanggan Booking Online' : 'Pelanggan Umum'),
        customerPhone: state.customerPhone || '',
        plateNumber: state.plateNumber || '-',
        vehicleType: state.selectedVehicle,
        orderNote: state.orderNote || '-',
        items: JSON.parse(JSON.stringify(state.cart)),
        subtotal: totals.subtotal,
        discountType: state.isAdmin ? state.discountType : 'nominal',
        discountValue: state.isAdmin ? state.discountValue : 0,
        discountAmount: state.isAdmin ? totals.discountAmount : 0,
        total: state.isAdmin ? totals.total : totals.subtotal,
        cash: isCash ? totals.cash : (state.isAdmin ? totals.total : totals.subtotal),
        change: isCash ? totals.change : 0,
        paymentMethod: state.paymentMethod,
        isBooking: isBookingMode,
        // Status Validasi Pembayaran (QRIS / Transfer / Tunai / Bon)
        paymentValidated: isCash ? true : false,
        paymentStatus: isCash ? 'verified' : (isBon ? 'bon' : 'pending'),
        validatedAt: isCash ? new Date().toISOString() : null,
        validatedBy: isCash ? (state.isAdmin ? 'Kasir Admin' : 'Sistem Kasir') : null
    };

    // Save transaction
    state.transactions.unshift(transaction);
    saveTransactions(); // Simpan ke localStorage saja, TANPA auto-sync (sync langsung dilakukan di bawah)

    // Langsung sinkronkan transaksi baru ke Cloud Vercel seketika agar langsung terhubung ke sistem admin di semua device
    if (typeof syncToCloud === 'function') {
        syncToCloud(isBookingMode ? `Booking Baru #${bookingCode}` : `Nota Kasir #${bookingCode}`);
    }

    // Tandai jika transaksi ini menggunakan / menebus Voucher Cuci Gratis
    (transaction.items || []).forEach(it => {
        if (it.freeWashVoucherId && state.freeWashVouchers) {
            const v = state.freeWashVouchers.find(x => x.id === it.freeWashVoucherId);
            if (v) {
                v.status = 'redeemed';
                v.redeemedAt = new Date().toISOString();
                v.redeemedInvoiceNo = transaction.invoiceNo;
            }
        }
    });
    if (typeof saveFreeWashVouchers === 'function') saveFreeWashVouchers();

    // Tampilkan modal nota struk HANYA jika diproses oleh kasir di mode Admin (untuk cetak thermal walk-in)
    // Pada sistem booking pengguna, struk kasir TIDAK dimunculkan otomatis (langsung dialihkan ke WhatsApp Admin)
    if (state.isAdmin) {
        openReceiptModal(transaction);
    }

    // Periksa pencapaian loyalitas cuci (jika transaksi memiliki layanan cuci)
    if (typeof hasWashService === 'function' && hasWashService(transaction)) {
        const washStats = getCustomerWashHistory(transaction.plateNumber || transaction.customerPhone);
        if (washStats.washCount % 7 === 0 && washStats.washCount > 0) {
            setTimeout(() => {
                if (confirm(`🎉 SELAMAT! Pelanggan dengan Plat Nomor ${transaction.plateNumber || 'ini'} telah mencapai 7 Kunjungan Cuci di JAARS Garage!\n\nApakah Anda ingin menerbitkan & mencetak STRUK BUKTI PENUKARAN CUCI GRATIS sekarang?`)) {
                    issueFreeWashVoucherForCustomer(transaction.plateNumber || transaction.customerPhone);
                }
            }, 800);
        }
    }

    // Pada sistem pengguna, langsung kirimkan kode booking ke WhatsApp Admin 085156696378
    if (isBookingMode) {
        sendReceiptWhatsApp(transaction, ADMIN_JAARS_PHONE);
        showToast(`🎉 Booking #${bookingCode} berhasil dibuat & langsung dikirim ke WhatsApp Admin (085156696378)!`);
    } else {
        showToast('🧾 Transaksi kasir berhasil diproses!');
    }

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
    renderPaidServicesSummary();
    if (typeof updateCartWashLoyaltyIndicator === 'function') updateCartWashLoyaltyIndicator();
}

function openReceiptModal(tx) {
    const modal = document.getElementById('modal-receipt');
    const receiptContent = document.getElementById('receipt-print-area');
    if (!modal || !receiptContent) return;

    const isBooking = (!state.isAdmin || tx.isBooking);

    // Update modal title, description, label & badge dynamically
    const modalTitle = document.getElementById('modal-receipt-title');
    const waLabel = document.getElementById('modal-receipt-wa-label');
    const waBadge = document.getElementById('modal-receipt-wa-badge');
    const waDesc = document.getElementById('modal-receipt-wa-desc');
    const waInput = document.getElementById('modal-wa-phone');
    const waBtn = document.getElementById('btn-send-whatsapp');

    if (modalTitle) {
        if (isBooking) {
            modalTitle.innerHTML = '<span>📅</span> <span>Bukti Booking Pelayanan Berhasil Dibuat</span>';
        } else {
            modalTitle.innerHTML = '<span>🧾</span> <span>Nota & Transaksi Kasir Selesai Diproses</span>';
        }
    }
    if (waLabel) {
        waLabel.textContent = isBooking 
            ? 'Kirim Ulang Kode Booking ke WhatsApp Admin:' 
            : 'Kirim Nota Kasir ke WhatsApp Pelanggan:';
    }
    if (waBadge) {
        if (isBooking) {
            waBadge.textContent = '🔒 Nomor Admin (Terkunci)';
            waBadge.className = 'text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full';
        } else {
            waBadge.textContent = 'Bisa diedit';
            waBadge.className = 'text-[10px] text-emerald-700 font-medium';
        }
    }
    if (waDesc) {
        waDesc.textContent = isBooking 
            ? `Pesan WhatsApp otomatis dikirimkan ke WhatsApp resmi Admin JAARS Garage (${ADMIN_JAARS_PHONE}) dengan Kode Booking #${tx.invoiceNo}.`
            : 'Membuka WhatsApp & menyiapkan pesan nota biaya lengkap ke nomor pelanggan.';
    }

    // Nomor Tujuan WhatsApp:
    // Pada mode pengguna/booking, otomatis terkunci ke Admin JAARS (085156696378) tanpa bisa diedit pengguna
    if (waInput) {
        if (isBooking) {
            waInput.value = ADMIN_JAARS_PHONE;
            waInput.readOnly = true;
            waInput.className = 'w-full pl-8 pr-2.5 py-2 text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl focus:outline-none text-slate-700 cursor-not-allowed select-none';
            waInput.title = 'Nomor tujuan dikunci ke nomor resmi Admin JAARS Garage';
        } else {
            waInput.value = tx.customerPhone || '';
            waInput.readOnly = false;
            waInput.className = 'w-full pl-8 pr-2.5 py-2 text-xs font-bold bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 text-slate-800 cursor-text';
            waInput.placeholder = 'Contoh: 08123456789';
            waInput.title = 'Nomor WhatsApp pelanggan penerima struk';
        }
    }

    // Setup WhatsApp button
    if (waBtn) {
        waBtn.innerHTML = isBooking 
            ? '<span>Kirim Ulang ke WA Admin</span> <span>➔</span>' 
            : '<span>Kirim WA</span> <span>➔</span>';
        waBtn.onclick = () => {
            // Pada mode booking, SELALU kirim ke ADMIN_JAARS_PHONE tanpa bisa diubah pengguna
            const destPhone = isBooking ? ADMIN_JAARS_PHONE : (waInput && waInput.value.trim() ? waInput.value.trim() : (tx.customerPhone || ''));
            sendReceiptWhatsApp(tx, destPhone);
        };
    }

    receiptContent.innerHTML = generateReceiptHTML(tx);

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

    const isBooking = (!state.isAdmin || tx.isBooking);
    const bookingBadge = isBooking 
        ? `<div style="text-align: center; margin: 6px 0; font-size: 11px; font-weight: 800; background: #eff6ff; color: #1d4ed8; padding: 4px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px dashed #93c5fd;">📅 Bukti Booking Pelayanan Online</div>` 
        : '';

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

            ${bookingBadge}

            ${isBooking ? `
                <div style="margin: 6px 0 10px 0; padding: 6px 8px; background: #eff6ff; border: 1.5px dashed #2563eb; border-radius: 8px; text-align: center;">
                    <span style="font-size: 10px; font-weight: bold; color: #1e40af; text-transform: uppercase; display: block; letter-spacing: 0.5px;">KODE BOOKING RESMI</span>
                    <span style="font-size: 16px; font-weight: 900; color: #1d4ed8; letter-spacing: 1px; font-family: monospace;">#${tx.invoiceNo}</span>
                </div>
            ` : ''}

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
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; margin-top: 4px; border-top: 1px dashed #93c5fd; padding-top: 4px;">
                    <span>TOTAL BAYAR:</span>
                    <span>${formatRupiah(tx.total)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span>Metode:</span>
                    <span style="font-weight: bold;">${paymentLabel}</span>
                </div>
                ${(tx.paymentMethod === 'qris' || tx.paymentMethod === 'transfer') ? `
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px;">
                        <span>Status Validasi:</span>
                        <span style="color: ${isTransactionPaymentValidated(tx) ? '#059669' : '#d97706'};">
                            ${isTransactionPaymentValidated(tx) ? '✅ LUNAS (TERVERIFIKASI)' : '⏳ MENUNGGU CEK REKENING'}
                        </span>
                    </div>
                ` : ''}
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
    const isBooking = (!state.isAdmin || tx.isBooking);
    // Untuk mode booking pengguna, nomor tujuan selalu terkunci ke WhatsApp Admin JAARS (085156696378)
    let phone = isBooking ? ADMIN_JAARS_PHONE : (targetPhone !== undefined ? targetPhone : (tx.customerPhone || ''));
    let cleanPhone = formatWhatsAppNumber(phone);

    let itemsText = tx.items.map((it, idx) => 
        `${idx + 1}. *${it.name}* (${it.qty} ${it.unit}) = ${formatRupiah(it.price * it.qty)}`
    ).join('\n');

    const paymentLabel = tx.paymentMethod === 'cash' ? 'TUNAI' :
                         tx.paymentMethod === 'qris' ? 'QRIS' :
                         tx.paymentMethod === 'transfer' ? `TRANSFER BANK BRI (${state.profile.bankAccount || '-'} a.n ${state.profile.bankHolder || '-'})` : 'BON / HUTANG';

    let waMessage = '';
    if (isBooking) {
        waMessage = 
`*📅 KONFIRMASI BOOKING PELAYANAN BENGKEL*
*KODE BOOKING: #${tx.invoiceNo}*
==============================
*Bengkel:* ${state.profile.name.toUpperCase()}
*Waktu Pemesanan:* ${formatDate(tx.date)}
==============================
*👤 DATA PEMESAN:*
• *Nama Pelanggan:* ${tx.customerName || 'Pelanggan Online'}
• *Nomor WhatsApp Pemesan:* ${tx.customerPhone || '-'}
• *Kendaraan:* ${tx.vehicleType.toUpperCase()} ${tx.plateNumber ? `(${tx.plateNumber})` : ''}
${tx.orderNote && tx.orderNote !== '-' ? `• *Rencana Datang / Catatan:* ${tx.orderNote}\n` : ''}
*📋 RINCIAN LAYANAN & ESTIMASI BIAYA:*
${itemsText}
==============================
*Subtotal:* ${formatRupiah(tx.subtotal)}
${tx.discountAmount > 0 ? `*Diskon:* -${formatRupiah(tx.discountAmount)}\n` : ''}*TOTAL ESTIMASI:* ${formatRupiah(tx.total)}
*Metode Pembayaran:* ${paymentLabel}
==============================
_Halo Admin JAARS Garage, saya telah memesan booking pelayanan di atas melalui website dengan *KODE BOOKING: #${tx.invoiceNo}*. Mohon konfirmasi jadwal dan teknisi bengkel. Terima kasih!_
`;
    } else {
        waMessage = 
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
    }

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

// --- HELPER STATUS VALIDASI PEMBAYARAN (QRIS / TRANSFER / TUNAI / BON) ---
function isTransactionPaymentValidated(tx) {
    if (!tx) return false;
    if (tx.paymentMethod === 'cash') return true;
    if (tx.paymentMethod === 'bon') return false;
    // QRIS & Transfer:
    return tx.paymentValidated === true || tx.paymentStatus === 'verified';
}

function toggleTransactionPaymentValidation(txId) {
    const tx = (state.transactions || []).find(t => t.id === txId);
    if (!tx) return;

    const currentlyValidated = isTransactionPaymentValidated(tx);
    if (!currentlyValidated) {
        tx.paymentValidated = true;
        tx.paymentStatus = 'verified';
        tx.validatedAt = new Date().toISOString();
        tx.validatedBy = 'Admin JAARS';
        showToast(`✅ Pembayaran Nota #${tx.invoiceNo} (${(tx.paymentMethod || '').toUpperCase()}) berhasil divalidasi LUNAS!`);
    } else {
        tx.paymentValidated = false;
        tx.paymentStatus = 'pending';
        tx.validatedAt = null;
        tx.validatedBy = null;
        showToast(`⏳ Status pembayaran Nota #${tx.invoiceNo} dikembalikan ke Menunggu Validasi.`);
    }

    saveTransactions();
    renderPaidServicesSummary();
    if (typeof renderHistory === 'function') renderHistory();
}

function validateAllPendingPaymentsToday() {
    const now = new Date();
    const isTxToday = (tx) => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return false;
        return txDate.getDate() === now.getDate() &&
               txDate.getMonth() === now.getMonth() &&
               txDate.getFullYear() === now.getFullYear();
    };

    const pendingList = (state.transactions || []).filter(tx => {
        return isTxToday(tx) && 
               (tx.paymentMethod === 'qris' || tx.paymentMethod === 'transfer') && 
               !isTransactionPaymentValidated(tx);
    });

    if (pendingList.length === 0) {
        showToast('Seluruh transaksi QRIS & Transfer hari ini sudah tervalidasi.');
        return;
    }

    if (!confirm(`Konfirmasi: Validasi ${pendingList.length} pembayaran QRIS / Transfer hari ini sebagai LUNAS? Pastikan seluruh dana sudah masuk ke rekening/settlement.`)) {
        return;
    }

    const nowIso = new Date().toISOString();
    pendingList.forEach(tx => {
        tx.paymentValidated = true;
        tx.paymentStatus = 'verified';
        tx.validatedAt = nowIso;
        tx.validatedBy = 'Admin JAARS';
    });

    saveTransactions();
    renderPaidServicesSummary();
    if (typeof renderHistory === 'function') renderHistory();
    showToast(`✅ Berhasil memvalidasi ${pendingList.length} transaksi pembayaran sebagai LUNAS!`);
}

function setSummaryValidationFilter(filterKey) {
    state.summaryFilterValidation = filterKey;
    const selectEl = document.getElementById('select-summary-validation');
    if (selectEl) {
        if (['all', 'pending', 'verified'].includes(filterKey)) {
            selectEl.value = filterKey;
        } else {
            selectEl.value = 'all';
        }
    }
    renderPaidServicesSummary();
}

window.isTransactionPaymentValidated = isTransactionPaymentValidated;
window.toggleTransactionPaymentValidation = toggleTransactionPaymentValidation;
window.validateAllPendingPaymentsToday = validateAllPendingPaymentsToday;
window.setSummaryValidationFilter = setSummaryValidationFilter;

// ==============================================================
// SISTEM LOYALITAS PELANGGAN CUCI KENDARAAN (7X CUCI GRATIS 1X)
// DENGAN NOTA / STRUK BUKTI PENUKARAN TERSENDIRI
// ==============================================================

function isWashItem(item) {
    if (!item) return false;
    const catId = (item.categoryId || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    return catId === 'cuci' || name.includes('cuci') || name.includes('wash') || name.includes('snow');
}

function hasWashService(tx) {
    if (!tx || !Array.isArray(tx.items)) return false;
    return tx.items.some(it => isWashItem(it));
}

function normalizePlate(plate) {
    return (plate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function normalizePhone(phone) {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('62')) digits = '0' + digits.slice(2);
    return digits;
}

function saveFreeWashVouchers() {
    localStorage.setItem('bengkel_free_wash_vouchers', JSON.stringify(state.freeWashVouchers || []));
    if (typeof triggerAutoSyncToCloud === 'function') {
        triggerAutoSyncToCloud('Voucher Cuci Gratis');
    }
}

function saveLoyaltyClearedVehicles(options = { sync: true }) {
    localStorage.setItem('jaars_loyalty_cleared', JSON.stringify(state.loyaltyClearedVehicles || []));
    if (syncChannel) {
        try {
            syncChannel.postMessage({ type: 'LOYALTY_CLEARED_UPDATED', timestamp: Date.now() });
        } catch (e) {}
    }
    if (options && options.sync !== false && typeof triggerAutoSyncToCloud === 'function') {
        triggerAutoSyncToCloud('Pembersihan Loyalitas');
    }
}

function getCustomerWashHistory(identifier) {
    if (!identifier) {
        return {
            washCount: 0,
            washTransactions: [],
            customerName: '',
            customerPhone: '',
            plateNumber: '',
            vehicleType: 'motor',
            vouchers: [],
            activeVouchers: [],
            redeemedVouchers: [],
            stampsInCycle: 0,
            isEligibleForFreeWash: false
        };
    }

    const normId = normalizePlate(identifier);
    const normPhoneId = normalizePhone(identifier);

    // Ambil data kendaraan yang sudah pernah dibersihkan/direset klaimnya
    const clearedList = state.loyaltyClearedVehicles || [];
    const clearedEntry = clearedList.slice().reverse().find(c => 
        (normId && c.plate && c.plate === normId) || 
        (normPhoneId && c.phone && c.phone === normPhoneId)
    );

    const washTxList = (state.transactions || []).filter(tx => {
        if (!hasWashService(tx)) return false;
        const pNorm = normalizePlate(tx.plateNumber);
        const phNorm = normalizePhone(tx.customerPhone);
        const matches = (normId && pNorm && pNorm === normId) || 
                        (normPhoneId && phNorm && phNorm === normPhoneId);
        if (!matches) return false;
        if (clearedEntry && new Date(tx.date) <= new Date(clearedEntry.clearedAt)) {
            return false;
        }
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const washCount = washTxList.length;
    const latestTx = washTxList.length > 0 ? washTxList[washTxList.length - 1] : null;

    const customerVouchers = (state.freeWashVouchers || []).filter(v => {
        const vPlate = normalizePlate(v.plateNumber);
        const vPhone = normalizePhone(v.customerPhone);
        const matches = (normId && vPlate && vPlate === normId) ||
                        (normPhoneId && vPhone && vPhone === normPhoneId);
        if (!matches) return false;
        if (clearedEntry && new Date(v.issuedAt) <= new Date(clearedEntry.clearedAt)) {
            return false;
        }
        return true;
    });

    const activeVouchers = customerVouchers.filter(v => v.status === 'active');
    const redeemedVouchers = customerVouchers.filter(v => v.status === 'redeemed');

    const stampsInCycle = washCount > 0 ? ((washCount % 7 === 0) ? 7 : (washCount % 7)) : 0;
    const vouchersAllowed = Math.floor(washCount / 7);
    const isEligibleForFreeWash = washCount >= 7 && (customerVouchers.length < vouchersAllowed);

    return {
        washCount,
        washTransactions: washTxList,
        customerName: latestTx ? latestTx.customerName : '',
        customerPhone: latestTx ? latestTx.customerPhone : '',
        plateNumber: latestTx ? latestTx.plateNumber : identifier,
        vehicleType: latestTx ? latestTx.vehicleType : 'motor',
        vouchers: customerVouchers,
        activeVouchers,
        redeemedVouchers,
        stampsInCycle,
        isEligibleForFreeWash
    };
}

function getAllWashCustomers() {
    const map = new Map();
    const clearedList = state.loyaltyClearedVehicles || [];

    (state.transactions || []).forEach(tx => {
        if (!hasWashService(tx)) return;
        const plate = (tx.plateNumber && tx.plateNumber !== '-') ? tx.plateNumber : '';
        const phone = tx.customerPhone || '';
        const normP = normalizePlate(plate);
        const normPh = normalizePhone(phone);
        const key = normP || normPh;
        if (!key) return;

        // Jangan masukkan transaksi cuci yang sudah dibersihkan/direset
        const clearedEntry = clearedList.slice().reverse().find(c => 
            (normP && c.plate && c.plate === normP) || 
            (normPh && c.phone && c.phone === normPh)
        );
        if (clearedEntry && new Date(tx.date) <= new Date(clearedEntry.clearedAt)) {
            return;
        }

        if (!map.has(key)) {
            map.set(key, {
                key,
                plateNumber: plate || '-',
                customerName: tx.customerName || 'Pelanggan Cuci',
                customerPhone: phone,
                vehicleType: tx.vehicleType || 'motor',
                washTransactions: [],
                lastDate: tx.date
            });
        }
        const record = map.get(key);
        record.washTransactions.push(tx);
        if (plate && (!record.plateNumber || record.plateNumber === '-')) record.plateNumber = plate;
        if (tx.customerName && record.customerName === 'Pelanggan Cuci') record.customerName = tx.customerName;
        if (phone && !record.customerPhone) record.customerPhone = phone;
        if (new Date(tx.date) > new Date(record.lastDate)) {
            record.lastDate = tx.date;
            if (tx.vehicleType) record.vehicleType = tx.vehicleType;
        }
    });

    (state.freeWashVouchers || []).forEach(v => {
        const plate = v.plateNumber || '';
        const phone = v.customerPhone || '';
        const normP = normalizePlate(plate);
        const normPh = normalizePhone(phone);
        const key = normP || normPh;
        if (!key) return;

        // Jangan masukkan voucher yang sudah dibersihkan
        const clearedEntry = clearedList.slice().reverse().find(c => 
            (normP && c.plate && c.plate === normP) || 
            (normPh && c.phone && c.phone === normPh)
        );
        if (clearedEntry && new Date(v.issuedAt) <= new Date(clearedEntry.clearedAt)) {
            return;
        }

        if (!map.has(key)) {
            map.set(key, {
                key,
                plateNumber: plate || '-',
                customerName: v.customerName || 'Pelanggan Cuci',
                customerPhone: phone,
                vehicleType: v.vehicleType || 'motor',
                washTransactions: [],
                lastDate: v.issuedAt
            });
        }
    });

    const list = Array.from(map.values()).map(cust => {
        const history = getCustomerWashHistory(cust.plateNumber !== '-' ? cust.plateNumber : cust.customerPhone);
        return {
            ...cust,
            washCount: history.washCount,
            stampsInCycle: history.stampsInCycle,
            vouchers: history.vouchers,
            activeVouchers: history.activeVouchers,
            redeemedVouchers: history.redeemedVouchers,
            isEligible: history.isEligibleForFreeWash || (history.washCount >= 7 && (history.vouchers || []).length === 0)
        };
    });

    list.sort((a, b) => b.washCount - a.washCount || new Date(b.lastDate) - new Date(a.lastDate));
    return list;
}

function generateFreeWashVoucher(options = {}) {
    if (!state.freeWashVouchers) state.freeWashVouchers = [];

    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `FREE-CUCI-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;
    const id = `vch_${Date.now()}_${randomSuffix}`;

    const newVoucher = {
        id,
        code,
        customerName: options.customerName || 'Pelanggan Setia JAARS',
        customerPhone: options.customerPhone || '',
        plateNumber: (options.plateNumber || '-').toUpperCase().trim(),
        vehicleType: options.vehicleType || 'motor',
        issuedAt: now.toISOString(),
        expiresAt: expiryDate.toISOString(),
        washCount: options.washCount || 7,
        status: 'active',
        redeemedAt: null,
        redeemedInvoiceNo: null,
        serviceItemName: options.vehicleType === 'mobil' 
            ? '1x Cuci Mobil Snow Wash & Semir Ban' 
            : '1x Cuci Motor Snow Wash & Semir Ban',
        notes: options.notes || 'Hadiah Program Loyalitas Pelanggan: Cuci 7x Gratis 1x',
        issuedBy: 'Admin JAARS Garage'
    };

    state.freeWashVouchers.unshift(newVoucher);
    saveFreeWashVouchers();
    if (typeof updateLoyaltyBadgesAndCounts === 'function') updateLoyaltyBadgesAndCounts();
    return newVoucher;
}

function renderFreeWashReceiptHTML(voucher) {
    if (!voucher) return '';

    const isMotor = voucher.vehicleType === 'motor';
    const normalPrice = isMotor ? 15000 : 40000;
    const isRedeemed = voucher.status === 'redeemed';
    const isExpired = !isRedeemed && new Date(voucher.expiresAt) < new Date();

    const stampsHTML = [1, 2, 3, 4, 5, 6, 7].map(num => {
        const isFree = num === 7;
        return `
            <div class="flex flex-col items-center justify-center p-1.5 rounded-lg border ${
                isFree 
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-black ring-1 ring-amber-300' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
            }">
                <span class="text-sm">${isFree ? '🎁' : '✅'}</span>
                <span class="text-[9px] uppercase">${isFree ? 'GRATIS' : '#' + num}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs font-mono text-xs flex flex-col gap-3">
            
            <!-- HEADER BENGKEL -->
            <div class="text-center pb-2 border-b border-dashed border-slate-300">
                <div class="font-black text-sm tracking-wide text-slate-900">${state.profile.name || 'BENGKEL JAARS GARAGE'}</div>
                <div class="text-[10px] text-slate-500 font-sans mt-0.5">${state.profile.address || 'Spesialis Servis, Tune Up, Ganti Oli & Cuci Bersih'}</div>
                <div class="text-[10px] text-slate-500 font-sans">Telp / WA: ${state.profile.phone || ADMIN_JAARS_PHONE}</div>
            </div>

            <!-- TITLE STRUK KHUSUS -->
            <div class="text-center py-1 bg-cyan-50 border border-cyan-200 rounded-xl">
                <div class="font-black text-cyan-950 text-xs sm:text-sm">STRUK BUKTI PENUKARAN CUCI GRATIS</div>
                <div class="text-[10px] font-bold text-cyan-800 uppercase tracking-wide">Program Loyalitas: Cuci 7x Gratis 1x</div>
            </div>

            <!-- VOUCHER CODE & STATUS BADGE -->
            <div class="flex flex-col items-center justify-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span class="text-[10px] text-slate-500 uppercase">KODE KUPON PENUKARAN:</span>
                <span class="text-base sm:text-lg font-black text-cyan-800 tracking-wider">${voucher.code}</span>
                <div class="mt-1">
                    ${isRedeemed ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700 border border-slate-300">
                            🎁 SUDAH DITUKARKAN (Inv: ${voucher.redeemedInvoiceNo || '-'})
                        </span>
                    ` : (isExpired ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            ⚠️ MASA BERLAKU BERAKHIR
                        </span>
                    ` : `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                            ✅ VOUCHER AKTIF - SIAP DITUKARKAN
                        </span>
                    `)}
                </div>
            </div>

            <!-- CUSTOMER & VEHICLE DATA -->
            <div class="space-y-1.5 pt-1 text-[11px]">
                <div class="flex justify-between">
                    <span class="text-slate-500">Tgl Diterbitkan:</span>
                    <span class="font-bold text-slate-800">${formatDate(voucher.issuedAt)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Berlaku Hingga:</span>
                    <span class="font-bold text-slate-800">${formatDate(voucher.expiresAt)} (30 Hari)</span>
                </div>
                <div class="flex justify-between items-center py-1 border-y border-dashed border-slate-200">
                    <span class="text-slate-500">No. Plat Kendaraan:</span>
                    <span class="font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 tracking-wider">${voucher.plateNumber || '-'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Nama Pelanggan:</span>
                    <span class="font-bold text-slate-800">${voucher.customerName || 'Pelanggan Setia'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Jenis Kendaraan:</span>
                    <span class="font-bold text-slate-800">${isMotor ? '🛵 Sepeda Motor' : '🚗 Mobil'}</span>
                </div>
                ${voucher.customerPhone ? `
                    <div class="flex justify-between">
                        <span class="text-slate-500">No. WhatsApp:</span>
                        <span class="font-bold text-slate-800">${voucher.customerPhone}</span>
                    </div>
                ` : ''}
            </div>

            <!-- VISUAL 7-STAMP BAR -->
            <div class="pt-2">
                <div class="text-[10px] font-bold text-slate-600 mb-1.5 text-center font-sans">
                    VERIFIKASI 7 KALI CUCI KENDARAAN:
                </div>
                <div class="grid grid-cols-7 gap-1">
                    ${stampsHTML}
                </div>
            </div>

            <!-- SERVICE DETAIL & VALUE (RP 0) -->
            <div class="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                <div class="font-bold text-slate-800 font-sans">Layanan yang Ditukarkan:</div>
                <div class="flex justify-between">
                    <span class="text-slate-600">${voucher.serviceItemName || (isMotor ? '1x Cuci Motor Snow Wash' : '1x Cuci Mobil Snow Wash')}</span>
                    <span class="text-slate-400 line-through">${formatRupiah(normalPrice)}</span>
                </div>
                <div class="flex justify-between text-emerald-700 font-bold">
                    <span>Diskon Loyalitas 7x Cuci:</span>
                    <span>-100% (${formatRupiah(normalPrice)})</span>
                </div>
                <div class="flex justify-between items-center pt-1.5 border-t border-slate-200 text-xs sm:text-sm font-black">
                    <span class="text-slate-900">TOTAL BAYAR:</span>
                    <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">RP 0 (GRATIS)</span>
                </div>
            </div>

            <!-- SYARAT & KETENTUAN PENUKARAN -->
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-200 text-[10px] text-slate-500 font-sans space-y-1 leading-tight">
                <div class="font-bold text-slate-700">Syarat & Ketentuan:</div>
                <div>1. Tunjukkan struk fisik ini atau pesan WhatsApp ke kasir JAARS Garage.</div>
                <div>2. Berlaku untuk 1 (satu) kali pelayanan cuci kendaraan dengan Plat: <strong>${voucher.plateNumber}</strong>.</div>
                <div>3. Masa berlaku s.d ${formatDate(voucher.expiresAt)}. Tidak dapat diuangkan.</div>
            </div>

            <!-- TANDA TANGAN VERIFIKASI -->
            <div class="grid grid-cols-2 gap-4 pt-3 text-center text-[10px] font-sans border-t border-dashed border-slate-200">
                <div>
                    <div class="text-slate-400">Kasir JAARS Garage</div>
                    <div class="h-10"></div>
                    <div class="font-bold text-slate-700 border-t border-slate-300 pt-0.5">( ${voucher.issuedBy || 'Admin Bengkel'} )</div>
                </div>
                <div>
                    <div class="text-slate-400">Pelanggan / Pemilik</div>
                    <div class="h-10"></div>
                    <div class="font-bold text-slate-700 border-t border-slate-300 pt-0.5">( ${voucher.customerName || 'Pelanggan'} )</div>
                </div>
            </div>

            <!-- FOOTER MOTTO -->
            <div class="text-center text-[9px] text-slate-400 font-sans pt-1 border-t border-slate-100">
                Terima kasih atas kepercayaan & kesetiaan Anda di JAARS Garage!
            </div>
        </div>
    `;
}

let currentViewingVoucher = null;

function openFreeWashReceiptModal(voucherOrId) {
    let voucher = voucherOrId;
    if (typeof voucherOrId === 'string') {
        voucher = (state.freeWashVouchers || []).find(v => v.id === voucherOrId || v.code === voucherOrId);
    }
    if (!voucher) {
        showToast('Struk kupon cuci gratis tidak ditemukan.');
        return;
    }

    currentViewingVoucher = voucher;

    const receiptArea = document.getElementById('free-wash-receipt-area');
    if (receiptArea) {
        receiptArea.innerHTML = renderFreeWashReceiptHTML(voucher);
    }

    // Pastikan printSection tetap bersih dan tidak tampil di layar halaman
    const printSection = document.getElementById('print-free-wash-section');
    if (printSection) {
        printSection.innerHTML = '';
    }

    const phoneInput = document.getElementById('free-wash-wa-phone');
    if (phoneInput) {
        phoneInput.value = voucher.customerPhone || '';
    }

    const btnSendWA = document.getElementById('btn-send-free-wash-wa');
    if (btnSendWA) {
        btnSendWA.onclick = () => {
            const phone = phoneInput ? phoneInput.value.trim() : voucher.customerPhone;
            sendFreeWashVoucherWA(voucher.id, phone);
        };
    }

    const btnPrint = document.getElementById('btn-print-free-wash');
    if (btnPrint) {
        btnPrint.onclick = () => {
            printFreeWashVoucher(voucher.id);
        };
    }

    const btnRedeem = document.getElementById('btn-redeem-free-wash-pos');
    if (btnRedeem) {
        if (voucher.status === 'redeemed') {
            btnRedeem.disabled = true;
            btnRedeem.classList.add('opacity-50', 'cursor-not-allowed');
            btnRedeem.innerHTML = '<span>✅</span><span>Sudah Ditukar</span>';
        } else {
            btnRedeem.disabled = false;
            btnRedeem.classList.remove('opacity-50', 'cursor-not-allowed');
            btnRedeem.innerHTML = '<span>🎁</span><span>Klaim ke Kasir</span>';
            btnRedeem.onclick = () => {
                redeemFreeWashInPOS(voucher.id);
            };
        }
    }

    const modal = document.getElementById('modal-free-wash-receipt');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function printFreeWashVoucher(voucherId) {
    const voucher = (state.freeWashVouchers || []).find(v => v.id === voucherId) || currentViewingVoucher;
    if (!voucher) return;

    const printSection = document.getElementById('print-free-wash-section');
    if (printSection) {
        printSection.innerHTML = renderFreeWashReceiptHTML(voucher);
    }
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            if (printSection) {
                printSection.innerHTML = '';
            }
        }, 1000);
    }, 200);
}

function sendFreeWashVoucherWA(voucherId, targetPhone) {
    const voucher = (state.freeWashVouchers || []).find(v => v.id === voucherId) || currentViewingVoucher;
    if (!voucher) return;

    let phone = targetPhone || voucher.customerPhone || '';
    let clean = phone.replace(/\D/g, '');
    if (!clean) {
        alert('Silakan masukkan nomor WhatsApp pelanggan tujuan pengiriman.');
        return;
    }
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);

    const isMotor = voucher.vehicleType === 'motor';
    const msg = 
`*SELAMAT! ANDA MENDAPATKAN 1X CUCI KENDARAAN GRATIS DI BENGKEL JAARS GARAGE!* 🎁🚿

Halo Kak *${voucher.customerName || 'Pelanggan Setia'}*,
Terima kasih banyak telah menjadi pelanggan setia JAARS Garage! Anda telah menyelesaikan *7x kunjungan cuci kendaraan* bersama kami.

Berikut adalah *STRUK BUKTI PENUKARAN CUCI GRATIS* resmi Anda:
━━━━━━━━━━━━━━━━━━━━
🏷️ *KODE KUPON*: *${voucher.code}*
🚗 *NO. PLAT*: *${voucher.plateNumber || '-'}*
🛵 *KENDARAAN*: ${isMotor ? 'Sepeda Motor' : 'Mobil'}
🎁 *LAYANAN GRATIS*: ${voucher.serviceItemName || '1x Cuci Bersih Snow Wash & Semir Ban'}
💰 *BIAYA*: *RP 0 (100% GRATIS)*
📅 *Tgl Terbit*: ${formatDate(voucher.issuedAt)}
⏳ *Berlaku Hingga*: ${formatDate(voucher.expiresAt)} (30 Hari)
━━━━━━━━━━━━━━━━━━━━

*Cara Penukaran Struk:*
1. Tunjukkan pesan WhatsApp ini atau struk bukti ke kasir JAARS Garage saat kedatangan cuci berikutnya.
2. Kasir akan memvalidasi kupon dan memberikan layanan cuci secara GRATIS tanpa dipungut biaya.

📍 *${state.profile.name || 'Bengkel JAARS Garage'}*
Alamat: ${state.profile.address || 'Bengkel JAARS'}
No. WA Admin: ${ADMIN_JAARS_PHONE}
_Bodi Kinclong, Mesin Prima!_`;

    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
}

function redeemFreeWashInPOS(voucherId) {
    const voucher = (state.freeWashVouchers || []).find(v => v.id === voucherId);
    if (!voucher) return;

    if (voucher.status === 'redeemed') {
        alert(`Voucher kupon ini sudah pernah ditukarkan pada invoice: ${voucher.redeemedInvoiceNo || '-'}`);
        return;
    }

    if (!confirm(`Konfirmasi penukaran voucher ${voucher.code} untuk Plat ${voucher.plateNumber}? Layanan cuci Rp 0 akan otomatis dimasukkan ke kasir saat ini.`)) {
        return;
    }

    switchTab('pos');

    state.plateNumber = voucher.plateNumber !== '-' ? voucher.plateNumber : state.plateNumber;
    state.customerName = voucher.customerName;
    state.customerPhone = voucher.customerPhone;
    state.selectedVehicle = voucher.vehicleType || 'motor';

    const plateInput = document.getElementById('input-plate-number');
    const nameInput = document.getElementById('input-customer-name');
    const phoneInput = document.getElementById('input-customer-phone');
    if (plateInput) plateInput.value = state.plateNumber;
    if (nameInput) nameInput.value = state.customerName;
    if (phoneInput) phoneInput.value = state.customerPhone;

    state.cart = state.cart.filter(it => !it.freeWashVoucherId);

    const isMotor = voucher.vehicleType === 'motor';
    const freeWashItem = {
        id: 'wash_free_' + Date.now(),
        name: `Pelayanan Cuci Gratis (${isMotor ? 'Motor' : 'Mobil'}) - Reward 7x Cuci`,
        price: 0,
        qty: 1,
        unit: 'kendaraan',
        categoryId: 'cuci',
        desc: `Klaim Struk Kupon #${voucher.code} (Plat: ${voucher.plateNumber})`,
        freeWashVoucherId: voucher.id
    };

    state.cart.unshift(freeWashItem);
    renderCart();

    const receiptModal = document.getElementById('modal-free-wash-receipt');
    if (receiptModal) receiptModal.classList.add('hidden');
    const loyaltyModal = document.getElementById('modal-loyalty-wash');
    if (loyaltyModal) loyaltyModal.classList.add('hidden');
    const printSection = document.getElementById('print-free-wash-section');
    if (printSection) printSection.innerHTML = '';

    showToast(`🎁 Voucher ${voucher.code} berhasil dimasukkan ke Kasir! Total biaya Cuci Rp 0.`);
}

function issueFreeWashVoucherForCustomer(identifier) {
    if (!identifier) {
        showToast('Plat nomor atau identitas pelanggan tidak valid.');
        return;
    }

    const history = getCustomerWashHistory(identifier);
    const existingActive = (history.activeVouchers || [])[0];

    if (existingActive) {
        if (confirm(`Pelanggan ${history.plateNumber || identifier} sudah memiliki voucher aktif (#${existingActive.code}). Ingin membuka kembali struk bukti voucher tersebut?`)) {
            openFreeWashReceiptModal(existingActive);
            return;
        }
    }

    const newVoucher = generateFreeWashVoucher({
        plateNumber: history.plateNumber || identifier,
        customerName: history.customerName || 'Pelanggan Setia JAARS',
        customerPhone: history.customerPhone || '',
        vehicleType: history.vehicleType || 'motor',
        washCount: history.washCount || 7
    });

    showToast(`🎉 Berhasil menerbitkan Struk Cuci Gratis untuk Plat ${newVoucher.plateNumber}!`);
    openFreeWashReceiptModal(newVoucher);
    if (typeof renderLoyaltyWashManagerModal === 'function') renderLoyaltyWashManagerModal();
}

function updateCartWashLoyaltyIndicator() {
    const indicatorEl = document.getElementById('cart-wash-loyalty-indicator');
    if (!indicatorEl) return;

    const plateInput = document.getElementById('input-plate-number');
    const phoneInput = document.getElementById('input-customer-phone');
    const currentPlate = plateInput ? plateInput.value.trim() : (state.plateNumber || '');
    const currentPhone = phoneInput ? phoneInput.value.trim() : (state.customerPhone || '');

    const hasWash = state.cart.some(it => isWashItem(it));

    if (!currentPlate && !currentPhone && !hasWash) {
        indicatorEl.classList.add('hidden');
        return;
    }

    const history = getCustomerWashHistory(currentPlate || currentPhone);
    const washCount = history.washCount;
    const stamps = history.stampsInCycle;
    const isEligible = history.isEligibleForFreeWash || (washCount >= 7);
    const activeVoucher = (history.activeVouchers || [])[0];

    indicatorEl.classList.remove('hidden');

    const stampsVisual = [1, 2, 3, 4, 5, 6, 7].map(num => {
        const isDone = num <= stamps;
        const isFree = num === 7;
        let bg = 'bg-slate-100 text-slate-400 border-slate-200';
        if (isDone) {
            bg = isFree 
                ? 'bg-amber-400 text-amber-950 border-amber-500 font-black animate-pulse' 
                : 'bg-emerald-500 text-white border-emerald-600 font-bold';
        }
        return `
            <div class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] border ${bg}" title="Cuci ke-${num}">
                ${isDone ? (isFree ? '🎁' : '✓') : num}
            </div>
        `;
    }).join('');

    indicatorEl.innerHTML = `
        <div class="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl flex flex-col gap-2 shadow-xs">
            <div class="flex items-center justify-between flex-wrap gap-1">
                <div class="flex items-center gap-2">
                    <span class="text-base">🚿</span>
                    <div>
                        <div class="font-extrabold text-xs text-cyan-950 flex items-center gap-1.5">
                            <span>Program Loyalitas Cuci 7x Gratis 1x</span>
                            ${currentPlate ? `<span class="font-mono bg-white px-1.5 py-0.5 rounded border border-cyan-200 text-[10px] text-cyan-800">${currentPlate}</span>` : ''}
                        </div>
                        <div class="text-[10px] text-cyan-700">
                            Total Kunjungan Cuci: <strong class="text-cyan-950">${washCount} kali</strong> • Status Siklus: <strong>${stamps}/7 Stamp</strong>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-1">
                    ${stampsVisual}
                </div>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-cyan-100 flex-wrap gap-2 text-xs">
                ${activeVoucher ? `
                    <div class="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                        <span>🎁</span>
                        <span>Ada Kupon Aktif: <strong class="font-mono">${activeVoucher.code}</strong></span>
                    </div>
                    <button type="button" onclick="redeemFreeWashInPOS('${activeVoucher.id}')"
                        class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer">
                        Gunakan Kupon di Kasir
                    </button>
                ` : (isEligible ? `
                    <div class="text-[11px] text-amber-900 font-bold flex items-center gap-1">
                        <span>🎉</span>
                        <span>Pelanggan berhak atas 1x Cuci Gratis (Sudah 7x Cuci)!</span>
                    </div>
                    <button type="button" onclick="issueFreeWashVoucherForCustomer('${currentPlate || currentPhone}')"
                        class="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-black rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer">
                        🎟️ Terbitkan Struk Cuci Gratis
                    </button>
                ` : `
                    <div class="text-[10px] text-cyan-800">
                        ${stamps === 6 
                            ? '🔥 Tinggal 1x cuci lagi untuk mendapatkan 1x Cuci Kendaraan GRATIS!' 
                            : `Kumpulkan ${7 - stamps} stamp cuci lagi untuk penukaran Cuci Gratis.`}
                    </div>
                    <button type="button" onclick="openLoyaltyWashModal()"
                        class="text-[10px] font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer">
                        Lihat Data Loyalitas
                    </button>
                `)}
            </div>
        </div>
    `;
}

function updateLoyaltyBadgesAndCounts() {
    const allCustomers = getAllWashCustomers();
    const eligibleCount = allCustomers.filter(c => c.isEligible).length;
    const activeVouchersCount = (state.freeWashVouchers || []).filter(v => v.status === 'active').length;
    const claimedVehiclesCount = allCustomers.filter(c => (c.redeemedVouchers || []).length > 0).length;

    const navBadge = document.getElementById('badge-eligible-wash-count');
    if (navBadge) {
        if (eligibleCount > 0) {
            navBadge.textContent = eligibleCount;
            navBadge.classList.remove('hidden');
        } else {
            navBadge.classList.add('hidden');
        }
    }

    const summaryBadge = document.getElementById('summary-loyalty-count-badge');
    if (summaryBadge) {
        if (eligibleCount > 0) {
            summaryBadge.textContent = `${eligibleCount} Berhak Cuci Gratis`;
            summaryBadge.classList.remove('hidden');
        } else {
            summaryBadge.classList.add('hidden');
        }
    }

    const statTotalEl = document.getElementById('loyalty-stat-total-customers');
    const statEligibleEl = document.getElementById('loyalty-stat-eligible-count');
    const statActiveVchEl = document.getElementById('loyalty-stat-active-vouchers');
    const statClaimedEl = document.getElementById('loyalty-stat-claimed-count');

    if (statTotalEl) statTotalEl.textContent = allCustomers.length;
    if (statEligibleEl) statEligibleEl.textContent = eligibleCount;
    if (statActiveVchEl) statActiveVchEl.textContent = activeVouchersCount;
    if (statClaimedEl) statClaimedEl.textContent = claimedVehiclesCount;
}

function setLoyaltyCustomerFilter(filterKey) {
    state.loyaltyCustomerFilter = filterKey || 'all';
    renderLoyaltyWashManagerModal();
}

function setLoyaltyVoucherFilter(filterKey) {
    state.loyaltyVoucherFilter = filterKey || 'all';
    renderLoyaltyWashManagerModal();
}

function deleteActiveVoucherCustomer(identifier) {
    if (!identifier) return;

    const normId = normalizePlate(identifier);
    const normPhoneId = normalizePhone(identifier);

    const history = getCustomerWashHistory(identifier);
    const label = history.plateNumber || identifier;
    const name = history.customerName ? ` (${history.customerName})` : '';

    if (!confirm(`Yakin ingin menghapus kendaraan Plat "${label}"${name} yang masih memiliki kupon aktif?\n\nKupon voucher aktif (belum diklaim) akan dibatalkan/dihapus dan data kendaraan ini akan dibersihkan dari daftar loyalitas pelanggan.`)) {
        return;
    }

    // 1. Hapus semua voucher untuk kendaraan ini dari daftar vouchers
    state.freeWashVouchers = (state.freeWashVouchers || []).filter(v => {
        const vPlate = normalizePlate(v.plateNumber);
        const vPhone = normalizePhone(v.customerPhone);
        const isMatch = (normId && vPlate && vPlate === normId) ||
                        (normPhoneId && vPhone && vPhone === normPhoneId);
        return !isMatch;
    });
    saveFreeWashVouchers();

    // 2. Bersihkan kendaraan ini dari riwayat transaksi loyalitas
    const cleared = state.loyaltyClearedVehicles || [];
    cleared.push({
        plate: normId || normalizePlate(history.plateNumber),
        phone: normPhoneId || normalizePhone(history.customerPhone),
        clearedAt: new Date().toISOString()
    });
    state.loyaltyClearedVehicles = cleared;
    saveLoyaltyClearedVehicles();

    renderLoyaltyWashManagerModal();
    showToast(`🗑️ Kendaraan Plat ${label} dan kupon aktifnya berhasil dihapus.`);
}

function deleteAllActiveVoucherVehicles() {
    const allCustomers = getAllWashCustomers();
    const activeCustomers = allCustomers.filter(c => (c.activeVouchers || []).length > 0);

    if (activeCustomers.length === 0) {
        showToast('ℹ️ Tidak ada kendaraan yang memiliki kupon aktif.');
        return;
    }

    if (!confirm(`Yakin ingin menghapus semua (${activeCustomers.length}) kendaraan yang masih memiliki kupon aktif (belum diklaim)?\n\nSemua kupon aktif akan dibatalkan dan kendaraan-kendaraan ini akan dibersihkan dari daftar loyalitas.`)) {
        return;
    }

    // Hapus semua voucher berstatus active
    state.freeWashVouchers = (state.freeWashVouchers || []).filter(v => v.status !== 'active');
    saveFreeWashVouchers();

    // Tandai semua pelanggan berkupon aktif ke dalam cleared
    const cleared = state.loyaltyClearedVehicles || [];
    const nowIso = new Date().toISOString();
    activeCustomers.forEach(c => {
        cleared.push({
            plate: normalizePlate(c.plateNumber),
            phone: normalizePhone(c.customerPhone),
            clearedAt: nowIso
        });
    });
    state.loyaltyClearedVehicles = cleared;
    saveLoyaltyClearedVehicles();

    renderLoyaltyWashManagerModal();
    showToast(`🗑️ Berhasil menghapus ${activeCustomers.length} kendaraan berkupon aktif.`);
}

function deleteClaimedCustomerVouchers(identifier) {
    if (!identifier) return;

    const normId = normalizePlate(identifier);
    const normPhoneId = normalizePhone(identifier);

    const history = getCustomerWashHistory(identifier);
    const label = history.plateNumber || identifier;

    if (!confirm(`Yakin ingin menghapus riwayat kendaraan Plat "${label}" yang sudah klaim cuci gratis?\n\nKupon voucher yang sudah ditukar akan dihapus dan siklus stamp akan dibersihkan/direset untuk kunjungan berikutnya.`)) {
        return;
    }

    // 1. Hapus voucher yang sudah redeemed untuk kendaraan ini
    state.freeWashVouchers = (state.freeWashVouchers || []).filter(v => {
        const vPlate = normalizePlate(v.plateNumber);
        const vPhone = normalizePhone(v.customerPhone);
        const isMatch = (normId && vPlate && vPlate === normId) ||
                        (normPhoneId && vPhone && vPhone === normPhoneId);
        return !(isMatch && v.status === 'redeemed');
    });
    saveFreeWashVouchers();

    // 2. Tandai kendaraan ini dalam riwayat pembersihan/reset
    const cleared = state.loyaltyClearedVehicles || [];
    cleared.push({
        plate: normId || normalizePlate(history.plateNumber),
        phone: normPhoneId || normalizePhone(history.customerPhone),
        clearedAt: new Date().toISOString()
    });
    state.loyaltyClearedVehicles = cleared;
    saveLoyaltyClearedVehicles();

    renderLoyaltyWashManagerModal();
    showToast(`🗑️ Data klaim cuci kendaraan Plat ${label} berhasil dihapus.`);
}

function deleteAllClaimedWashVehicles() {
    const allCustomers = getAllWashCustomers();
    const claimedCustomers = allCustomers.filter(c => (c.redeemedVouchers || []).length > 0);

    if (claimedCustomers.length === 0) {
        showToast('ℹ️ Tidak ada data kendaraan yang sudah klaim cuci.');
        return;
    }

    if (!confirm(`Yakin ingin menghapus semua (${claimedCustomers.length}) kendaraan yang sudah mengklaim cuci gratis?\n\nSemua kupon yang sudah selesai ditukar akan dihapus dan siklus stamp pelanggan akan direset.`)) {
        return;
    }

    // Hapus semua voucher berstatus redeemed
    state.freeWashVouchers = (state.freeWashVouchers || []).filter(v => v.status !== 'redeemed');
    saveFreeWashVouchers();

    // Tandai semua pelanggan yang klaim ke dalam cleared
    const cleared = state.loyaltyClearedVehicles || [];
    const nowIso = new Date().toISOString();
    claimedCustomers.forEach(c => {
        cleared.push({
            plate: normalizePlate(c.plateNumber),
            phone: normalizePhone(c.customerPhone),
            clearedAt: nowIso
        });
    });
    state.loyaltyClearedVehicles = cleared;
    saveLoyaltyClearedVehicles();

    renderLoyaltyWashManagerModal();
    showToast(`🗑️ Berhasil menghapus ${claimedCustomers.length} kendaraan yang sudah klaim cuci.`);
}

function deleteAllClaimedWashVouchers() {
    const redeemedList = (state.freeWashVouchers || []).filter(v => v.status === 'redeemed');

    if (redeemedList.length === 0) {
        showToast('ℹ️ Tidak ada struk voucher yang berstatus sudah diklaim.');
        return;
    }

    if (!confirm(`Yakin ingin menghapus semua (${redeemedList.length}) struk voucher yang sudah diklaim / ditukarkan?`)) {
        return;
    }

    state.freeWashVouchers = (state.freeWashVouchers || []).filter(v => v.status !== 'redeemed');
    saveFreeWashVouchers();

    renderLoyaltyWashManagerModal();
    showToast(`🗑️ Berhasil menghapus ${redeemedList.length} struk voucher yang sudah diklaim.`);
}

function deleteVoucherById(voucherId) {
    const voucher = (state.freeWashVouchers || []).find(v => v.id === voucherId);
    if (!voucher) return;

    if (!confirm(`Yakin ingin menghapus struk voucher #${voucher.code} (Plat: ${voucher.plateNumber})?`)) {
        return;
    }

    state.freeWashVouchers = (state.freeWashVouchers || []).filter(v => v.id !== voucherId);
    saveFreeWashVouchers();

    renderLoyaltyWashManagerModal();
    showToast(`🗑️ Struk voucher #${voucher.code} berhasil dihapus.`);
}

function openLoyaltyWashModal(subTab = 'customers') {
    const modal = document.getElementById('modal-loyalty-wash');
    if (!modal) return;

    state.activeLoyaltySubTab = subTab;
    renderLoyaltyWashManagerModal();
    modal.classList.remove('hidden');
}

function switchLoyaltySubTab(tab) {
    state.activeLoyaltySubTab = tab;
    const btnCustomers = document.getElementById('tab-loyalty-customers-btn');
    const btnVouchers = document.getElementById('tab-loyalty-vouchers-btn');
    const secCustomers = document.getElementById('loyalty-subtab-customers');
    const secVouchers = document.getElementById('loyalty-subtab-vouchers');

    if (tab === 'customers') {
        if (btnCustomers) {
            btnCustomers.className = 'px-3.5 py-1.5 rounded-xl bg-slate-900 text-white cursor-pointer transition-all';
        }
        if (btnVouchers) {
            btnVouchers.className = 'px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-all';
        }
        if (secCustomers) secCustomers.classList.remove('hidden');
        if (secVouchers) secVouchers.classList.add('hidden');
    } else {
        if (btnCustomers) {
            btnCustomers.className = 'px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-all';
        }
        if (btnVouchers) {
            btnVouchers.className = 'px-3.5 py-1.5 rounded-xl bg-slate-900 text-white cursor-pointer transition-all';
        }
        if (secCustomers) secCustomers.classList.add('hidden');
        if (secVouchers) secVouchers.classList.remove('hidden');
    }

    renderLoyaltyWashManagerModal();
}

function renderLoyaltyWashManagerModal() {
    updateLoyaltyBadgesAndCounts();

    const allCustomers = getAllWashCustomers();
    const allVouchers = state.freeWashVouchers || [];

    // Update Filter navigation count badges
    const countCustAllEl = document.getElementById('count-cust-all');
    const countCustEligibleEl = document.getElementById('count-cust-eligible');
    const countCustActiveEl = document.getElementById('count-cust-active');
    const countCustClaimedEl = document.getElementById('count-cust-claimed');
    const eligibleCount = allCustomers.filter(c => c.isEligible).length;
    const activeCustCount = allCustomers.filter(c => (c.activeVouchers || []).length > 0).length;
    const claimedCustCount = allCustomers.filter(c => (c.redeemedVouchers || []).length > 0).length;

    if (countCustAllEl) countCustAllEl.textContent = allCustomers.length;
    if (countCustEligibleEl) countCustEligibleEl.textContent = eligibleCount;
    if (countCustActiveEl) countCustActiveEl.textContent = activeCustCount;
    if (countCustClaimedEl) countCustClaimedEl.textContent = claimedCustCount;

    const countVchAllEl = document.getElementById('count-vch-all');
    const countVchActiveEl = document.getElementById('count-vch-active');
    const countVchRedeemedEl = document.getElementById('count-vch-redeemed');
    const activeVchCount = allVouchers.filter(v => v.status === 'active').length;
    const redeemedVchCount = allVouchers.filter(v => v.status === 'redeemed').length;

    if (countVchAllEl) countVchAllEl.textContent = allVouchers.length;
    if (countVchActiveEl) countVchActiveEl.textContent = activeVchCount;
    if (countVchRedeemedEl) countVchRedeemedEl.textContent = redeemedVchCount;

    // Filter Navigation Buttons Styling
    const btnCustAll = document.getElementById('filter-cust-all-btn');
    const btnCustEligible = document.getElementById('filter-cust-eligible-btn');
    const btnCustActive = document.getElementById('filter-cust-active-btn');
    const btnCustClaimed = document.getElementById('filter-cust-claimed-btn');
    const activeCustFilter = state.loyaltyCustomerFilter || 'all';

    if (btnCustAll) btnCustAll.className = activeCustFilter === 'all'
        ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-slate-900 text-white shrink-0'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shrink-0';

    if (btnCustEligible) btnCustEligible.className = activeCustFilter === 'eligible'
        ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-amber-600 text-white shrink-0 shadow-xs'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shrink-0';

    if (btnCustActive) btnCustActive.className = activeCustFilter === 'active'
        ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-cyan-700 text-white shrink-0 shadow-xs'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50 shrink-0';

    if (btnCustClaimed) btnCustClaimed.className = activeCustFilter === 'claimed'
        ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-purple-700 text-white shrink-0 shadow-xs'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shrink-0';

    const btnVchAll = document.getElementById('filter-vch-all-btn');
    const btnVchActive = document.getElementById('filter-vch-active-btn');
    const btnVchRedeemed = document.getElementById('filter-vch-redeemed-btn');
    const activeVchFilter = state.loyaltyVoucherFilter || 'all';

    if (btnVchAll) btnVchAll.className = activeVchFilter === 'all'
        ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-slate-900 text-white shrink-0'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shrink-0';

    if (btnVchActive) btnVchActive.className = activeVchFilter === 'active'
        ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-emerald-700 text-white shrink-0 shadow-xs'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shrink-0';

    if (btnVchRedeemed) btnVchRedeemed.className = activeVchFilter === 'redeemed'
        ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-purple-700 text-white shrink-0 shadow-xs'
        : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 shrink-0';

    // Filter customers
    let displayedCustomers = allCustomers;
    if (activeCustFilter === 'eligible') {
        displayedCustomers = allCustomers.filter(c => c.isEligible);
    } else if (activeCustFilter === 'active') {
        displayedCustomers = allCustomers.filter(c => (c.activeVouchers || []).length > 0);
    } else if (activeCustFilter === 'claimed') {
        displayedCustomers = allCustomers.filter(c => (c.redeemedVouchers || []).length > 0);
    }

    const custTbody = document.getElementById('loyalty-customers-table-body');
    if (custTbody) {
        if (displayedCustomers.length === 0) {
            let emptyMsg = 'Belum ada data pelanggan cuci kendaraan.';
            let emptySub = 'Transaksi layanan cuci yang dicatat di kasir akan otomatis masuk ke program loyalitas.';
            if (activeCustFilter === 'eligible') {
                emptyMsg = 'Tidak ada pelanggan yang saat ini siap klaim cuci gratis (≥7x).';
                emptySub = 'Pelanggan yang sudah mengumpulkan 7 stamp cuci akan otomatis tampil di sini.';
            } else if (activeCustFilter === 'active') {
                emptyMsg = 'Tidak ada kendaraan yang memiliki kupon aktif saat ini.';
                emptySub = 'Kendaraan yang memiliki kupon voucher cuci aktif (belum ditukarkan) akan tampil di sini.';
            } else if (activeCustFilter === 'claimed') {
                emptyMsg = 'Tidak ada kendaraan yang berstatus sudah klaim cuci.';
                emptySub = 'Semua kendaraan yang sudah klaim cuci gratis telah dibersihkan atau belum ada penukaran voucher.';
            }
            custTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-3 py-8 text-center text-slate-400">
                        <div class="text-2xl mb-1">${activeCustFilter === 'claimed' ? '🎁' : (activeCustFilter === 'active' ? '🎟️' : '🚿')}</div>
                        <p class="font-bold text-slate-700">${emptyMsg}</p>
                        <p class="text-[11px] text-slate-400">${emptySub}</p>
                    </td>
                </tr>
            `;
        } else {
            custTbody.innerHTML = displayedCustomers.map((cust) => {
                const isEligible = cust.isEligible;
                const activeVch = (cust.activeVouchers || [])[0];
                const hasRedeemed = (cust.redeemedVouchers || []).length > 0;

                const stampsVisual = [1, 2, 3, 4, 5, 6, 7].map(num => {
                    const isDone = num <= cust.stampsInCycle;
                    const isFree = num === 7;
                    return `<span class="${isDone ? (isFree ? 'text-amber-500 font-black' : 'text-emerald-600 font-bold') : 'text-slate-300'}">${isDone ? (isFree ? '🎁' : '●') : '○'}</span>`;
                }).join(' ');

                return `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-3 py-2.5 text-center font-mono font-black text-slate-900">
                            <span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">${cust.plateNumber}</span>
                        </td>
                        <td class="px-3 py-2.5">
                            <div class="font-bold text-slate-800">${cust.customerName}</div>
                            ${cust.customerPhone ? `
                                <div class="text-[10px] text-slate-400 font-mono">${cust.customerPhone}</div>
                            ` : ''}
                        </td>
                        <td class="px-3 py-2.5 text-center">
                            ${cust.vehicleType === 'mobil' 
                                ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">🚗 Mobil</span>' 
                                : '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">🛵 Motor</span>'}
                        </td>
                        <td class="px-3 py-2.5 text-center font-mono font-black text-slate-800 text-sm">
                            ${cust.washCount}x
                        </td>
                        <td class="px-3 py-2.5 text-center">
                            <div class="text-xs tracking-wider">${stampsVisual}</div>
                            <div class="text-[10px] mt-0.5">
                                ${activeVch ? `
                                    <span class="inline-block px-2 py-0.5 rounded-full font-black bg-cyan-100 text-cyan-800 border border-cyan-200">
                                        🎟️ Kupon Aktif (#${activeVch.code})
                                    </span>
                                ` : (hasRedeemed ? `
                                    <span class="inline-block px-2 py-0.5 rounded-full font-black bg-purple-100 text-purple-800 border border-purple-200">
                                        🎁 Sudah Klaim (${cust.redeemedVouchers.length}x)
                                    </span>
                                ` : (isEligible ? `
                                    <span class="inline-block px-2 py-0.5 rounded-full font-black bg-amber-100 text-amber-800 border border-amber-200">
                                        🎉 Siap Klaim Gratis
                                    </span>
                                ` : `
                                    <span class="text-slate-500 font-medium">${cust.stampsInCycle}/7 Stamp</span>
                                `))}
                            </div>
                        </td>
                        <td class="px-3 py-2.5 text-right">
                            <div class="flex items-center justify-end gap-1.5 flex-wrap">
                                ${activeVch ? `
                                    <button onclick="openFreeWashReceiptModal('${activeVch.id}')"
                                        class="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-black rounded-lg shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                        title="Buka Struk Voucher Aktif">
                                        <span>🎟️</span>
                                        <span>Lihat Struk</span>
                                    </button>
                                    <button onclick="deleteActiveVoucherCustomer('${cust.plateNumber !== '-' ? cust.plateNumber : cust.customerPhone}')"
                                        class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                        title="Hapus kendaraan ini dan batalkan kupon aktifnya">
                                        <span>🗑️</span>
                                        <span>Hapus</span>
                                    </button>
                                ` : (isEligible ? `
                                    <button onclick="issueFreeWashVoucherForCustomer('${cust.plateNumber !== '-' ? cust.plateNumber : cust.customerPhone}')"
                                        class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black rounded-lg shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                        title="Terbitkan Struk Bukti Cuci Gratis">
                                        <span>🎟️</span>
                                        <span>Terbitkan Struk</span>
                                    </button>
                                ` : `
                                    <button onclick="issueFreeWashVoucherForCustomer('${cust.plateNumber !== '-' ? cust.plateNumber : cust.customerPhone}')"
                                        class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                                        title="Beri voucher cuci gratis secara khusus">
                                        + Hadiahkan
                                    </button>
                                `)}

                                ${hasRedeemed ? `
                                    <button onclick="deleteClaimedCustomerVouchers('${cust.plateNumber !== '-' ? cust.plateNumber : cust.customerPhone}')"
                                        class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                        title="Hapus riwayat kendaraan yang sudah klaim cuci gratis ini">
                                        <span>🗑️</span>
                                        <span>Hapus Klaim</span>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Filter vouchers
    let displayedVouchers = allVouchers;
    if (activeVchFilter === 'active') {
        displayedVouchers = allVouchers.filter(v => v.status === 'active');
    } else if (activeVchFilter === 'redeemed') {
        displayedVouchers = allVouchers.filter(v => v.status === 'redeemed');
    }

    const vchTbody = document.getElementById('loyalty-vouchers-table-body');
    if (vchTbody) {
        if (displayedVouchers.length === 0) {
            let emptyMsg = 'Belum ada struk kupon voucher cuci gratis.';
            if (activeVchFilter === 'active') {
                emptyMsg = 'Tidak ada voucher cuci gratis yang berstatus aktif.';
            } else if (activeVchFilter === 'redeemed') {
                emptyMsg = 'Tidak ada struk voucher yang berstatus sudah ditukarkan / diklaim.';
            }
            vchTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-3 py-8 text-center text-slate-400">
                        <div class="text-2xl mb-1">🎟️</div>
                        <p class="font-bold text-slate-700">${emptyMsg}</p>
                        <p class="text-[11px] text-slate-400">Voucher yang diterbitkan otomatis atau manual akan tersimpan di sini.</p>
                    </td>
                </tr>
            `;
        } else {
            vchTbody.innerHTML = displayedVouchers.map(v => {
                const isRedeemed = v.status === 'redeemed';
                const isExpired = !isRedeemed && new Date(v.expiresAt) < new Date();

                return `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-3 py-2.5 font-mono font-bold text-cyan-800 text-xs">
                            ${v.code}
                        </td>
                        <td class="px-3 py-2.5 font-mono font-black text-slate-900">
                            <span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">${v.plateNumber}</span>
                        </td>
                        <td class="px-3 py-2.5">
                            <div class="font-bold text-slate-800 text-xs">${v.customerName}</div>
                            ${v.customerPhone ? `<div class="text-[10px] text-slate-400 font-mono">${v.customerPhone}</div>` : ''}
                        </td>
                        <td class="px-3 py-2.5 text-xs text-slate-600">
                            ${formatDate(v.issuedAt)}
                        </td>
                        <td class="px-3 py-2.5 text-center">
                            ${isRedeemed ? `
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                                    🎁 Sudah Ditukar
                                </span>
                            ` : (isExpired ? `
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                    ⚠️ Kedaluwarsa
                                </span>
                            ` : `
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✅ Aktif
                                </span>
                            `)}
                        </td>
                        <td class="px-3 py-2.5 text-right">
                            <div class="flex items-center justify-end gap-1.5 flex-wrap">
                                <button onclick="openFreeWashReceiptModal('${v.id}')"
                                    class="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                    title="Buka Struk Bukti Penukaran">
                                    <span>👁️</span>
                                    <span>Struk</span>
                                </button>
                                ${!isRedeemed ? `
                                    <button onclick="redeemFreeWashInPOS('${v.id}')"
                                        class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                        title="Klaim penukaran di Kasir POS">
                                        <span>🎁</span>
                                        <span>Klaim</span>
                                    </button>
                                ` : ''}
                                <button onclick="deleteVoucherById('${v.id}')"
                                    class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                    title="Hapus struk kupon ini">
                                    <span>🗑️</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function checkLoyaltyCustomerDirect() {
    const input = document.getElementById('loyalty-search-input');
    const resultBox = document.getElementById('loyalty-search-result-box');
    if (!input || !resultBox) return;

    const query = input.value.trim();
    if (!query) {
        resultBox.classList.add('hidden');
        return;
    }

    const history = getCustomerWashHistory(query);
    resultBox.classList.remove('hidden');

    if (history.washCount === 0 && (history.vouchers || []).length === 0) {
        resultBox.innerHTML = `
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start justify-between gap-2">
                <div>
                    <span class="font-bold text-amber-900">Belum ada riwayat cuci aktif untuk: "${query}"</span>
                    <p class="text-[11px] text-amber-700 mt-0.5">Pastikan plat nomor atau nomor WhatsApp sudah benar dan pernah bertransaksi layanan cuci di kasir.</p>
                </div>
                <button type="button" onclick="openManualCreateVoucherModal('${query}')"
                    class="shrink-0 px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer">
                    + Buat Voucher Manual
                </button>
            </div>
        `;
        return;
    }

    const isEligible = history.isEligibleForFreeWash || (history.washCount >= 7);
    const activeVch = (history.activeVouchers || [])[0];
    const hasRedeemed = (history.redeemedVouchers || []).length > 0;

    resultBox.innerHTML = `
        <div class="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl flex flex-col gap-2.5 text-xs">
            <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <div class="font-black text-sm text-cyan-950 flex items-center gap-2 flex-wrap">
                        <span class="font-mono bg-white px-2 py-0.5 rounded border border-cyan-300">${history.plateNumber || query}</span>
                        <span>${history.customerName || 'Pelanggan Cuci'}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-cyan-200 text-cyan-800">
                            ${history.vehicleType === 'mobil' ? '🚗 Mobil' : '🛵 Motor'}
                        </span>
                        ${hasRedeemed ? `
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                🎁 Sudah Klaim (${history.redeemedVouchers.length}x)
                            </span>
                        ` : ''}
                    </div>
                    <div class="text-[11px] text-cyan-700 mt-1">
                        Total Kunjungan Cuci: <strong class="text-cyan-950 text-sm font-mono">${history.washCount}x</strong> • Stamp Siklus: <strong class="text-cyan-950 text-sm font-mono">${history.stampsInCycle}/7</strong>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap">
                    ${activeVch ? `
                        <button type="button" onclick="openFreeWashReceiptModal('${activeVch.id}')"
                            class="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer">
                            🎟️ Lihat Struk Voucher Aktif
                        </button>
                        <button type="button" onclick="deleteActiveVoucherCustomer('${history.plateNumber || query}')"
                            class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Hapus kendaraan ini dan batalkan kupon aktif">
                            <span>🗑️</span>
                            <span>Hapus Kendaraan</span>
                        </button>
                    ` : (isEligible ? `
                        <button type="button" onclick="issueFreeWashVoucherForCustomer('${history.plateNumber || query}')"
                            class="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer">
                            🎉 Terbitkan Struk Cuci Gratis Sekarang!
                        </button>
                    ` : `
                        <button type="button" onclick="issueFreeWashVoucherForCustomer('${history.plateNumber || query}')"
                            class="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer">
                            + Beri Voucher Spesial
                        </button>
                    `)}

                    ${hasRedeemed ? `
                        <button type="button" onclick="deleteClaimedCustomerVouchers('${history.plateNumber || query}')"
                            class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Hapus riwayat klaim cuci kendaraan ini">
                            <span>🗑️</span>
                            <span>Hapus Klaim</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function openManualCreateVoucherModal(prefillPlate = '') {
    const plate = prompt('Masukkan Nomor Plat Kendaraan untuk Struk Cuci Gratis:', prefillPlate || '');
    if (!plate) return;

    const name = prompt('Masukkan Nama Pelanggan:', 'Pelanggan Setia JAARS') || 'Pelanggan Setia JAARS';
    const phone = prompt('Masukkan Nomor WhatsApp Pelanggan (opsional):', '') || '';
    const vehicle = confirm('Pilih Jenis Kendaraan:\n\nKlik OK untuk SEPEDA MOTOR (🛵)\nKlik CANCEL untuk MOBIL (🚗)') ? 'motor' : 'mobil';

    const newVoucher = generateFreeWashVoucher({
        plateNumber: plate.toUpperCase().trim(),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        vehicleType: vehicle,
        washCount: 7,
        notes: 'Penerbitan Struk Bukti Penukaran Cuci Gratis Manual oleh Admin'
    });

    showToast(`✅ Berhasil menerbitkan Struk Cuci Gratis manual untuk Plat ${newVoucher.plateNumber}!`);
    openFreeWashReceiptModal(newVoucher);
    if (typeof renderLoyaltyWashManagerModal === 'function') renderLoyaltyWashManagerModal();
}

window.isWashItem = isWashItem;
window.hasWashService = hasWashService;
window.normalizePlate = normalizePlate;
window.normalizePhone = normalizePhone;
window.saveFreeWashVouchers = saveFreeWashVouchers;
window.saveLoyaltyClearedVehicles = saveLoyaltyClearedVehicles;
window.getCustomerWashHistory = getCustomerWashHistory;
window.getAllWashCustomers = getAllWashCustomers;
window.generateFreeWashVoucher = generateFreeWashVoucher;
window.renderFreeWashReceiptHTML = renderFreeWashReceiptHTML;
window.openFreeWashReceiptModal = openFreeWashReceiptModal;
window.printFreeWashVoucher = printFreeWashVoucher;
window.sendFreeWashVoucherWA = sendFreeWashVoucherWA;
window.redeemFreeWashInPOS = redeemFreeWashInPOS;
window.issueFreeWashVoucherForCustomer = issueFreeWashVoucherForCustomer;
window.updateCartWashLoyaltyIndicator = updateCartWashLoyaltyIndicator;
window.updateLoyaltyBadgesAndCounts = updateLoyaltyBadgesAndCounts;
window.openLoyaltyWashModal = openLoyaltyWashModal;
window.switchLoyaltySubTab = switchLoyaltySubTab;
window.renderLoyaltyWashManagerModal = renderLoyaltyWashManagerModal;
window.checkLoyaltyCustomerDirect = checkLoyaltyCustomerDirect;
window.openManualCreateVoucherModal = openManualCreateVoucherModal;
window.setLoyaltyCustomerFilter = setLoyaltyCustomerFilter;
window.setLoyaltyVoucherFilter = setLoyaltyVoucherFilter;
window.deleteActiveVoucherCustomer = deleteActiveVoucherCustomer;
window.deleteAllActiveVoucherVehicles = deleteAllActiveVoucherVehicles;
window.deleteClaimedCustomerVouchers = deleteClaimedCustomerVouchers;
window.deleteAllClaimedWashVehicles = deleteAllClaimedWashVehicles;
window.deleteAllClaimedWashVouchers = deleteAllClaimedWashVouchers;
window.deleteVoucherById = deleteVoucherById;

// --- KOMPONEN KARTU HASIL LAYANAN DETAIL YANG SUDAH DIBAYAR ---
function generatePaidServicesCardHTML(tx) {
    const isMotor = tx.vehicleType === 'motor';
    const vehicleBadge = isMotor 
        ? '<span class="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">🛵 Motor</span>' 
        : '<span class="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">🚗 Mobil</span>';

    const isWash = hasWashService(tx);
    const washStats = isWash ? getCustomerWashHistory(tx.plateNumber || tx.customerPhone) : null;
    let washBadge = '';
    if (isWash && washStats) {
        washBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 flex items-center gap-1">🚿 Cuci (${washStats.washCount}x)</span>`;
        if (washStats.washCount >= 7) {
            washBadge += `<span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">🎁 HAK CUCI GRATIS</span>`;
        }
    }

    const isBon = tx.paymentMethod === 'bon';
    const isDigital = tx.paymentMethod === 'qris' || tx.paymentMethod === 'transfer';
    const isValidated = isTransactionPaymentValidated(tx);

    let statusBadge = '';
    if (isBon) {
        statusBadge = '<span class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">⚠️ BELUM LUNAS (BON)</span>';
    } else if (isDigital) {
        if (isValidated) {
            statusBadge = '<span class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">✅ LUNAS (TERVALIDASI)</span>';
        } else {
            statusBadge = '<span class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">⏳ MENUNGGU VALIDASI (' + (tx.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER BRI') + ')</span>';
        }
    } else {
        statusBadge = '<span class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">✅ LUNAS (KASIR)</span>';
    }

    const payBadge = tx.paymentMethod === 'cash' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">💵 Tunai (Cash)</span>' :
                     tx.paymentMethod === 'qris' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">📱 QRIS Kasir</span>' :
                     tx.paymentMethod === 'transfer' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">🏦 Transfer BRI</span>' :
                     '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">📝 Bon / Hutang</span>';

    const bookingBadge = tx.isBooking 
        ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">📅 Booking Pelayanan</span>' 
        : '';

    const items = tx.items || [];
    const itemsRowsHTML = items.map((item, itemIdx) => {
        const categoryObj = (state.categories || []).find(c => c.id === item.categoryId);
        const categoryName = categoryObj ? categoryObj.name : (item.categoryId || 'Layanan / Produk');
        const unitPrice = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        const subtotal = unitPrice * qty;

        return `
            <tr class="hover:bg-blue-50/40 transition-colors">
                <td class="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">${itemIdx + 1}</td>
                <td class="px-3 py-2">
                    <div class="font-bold text-slate-800">${item.name}</div>
                    ${item.desc ? `<div class="text-[10px] text-slate-400 font-normal leading-tight">${item.desc}</div>` : ''}
                </td>
                <td class="px-3 py-2">
                    <span class="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 font-medium">
                        ${categoryName}
                    </span>
                </td>
                <td class="px-3 py-2 text-center font-bold font-mono text-slate-700">
                    ${qty} <span class="text-[10px] font-normal text-slate-400">${item.unit || 'x'}</span>
                </td>
                <td class="px-3 py-2 text-right font-mono text-slate-600">${formatRupiah(unitPrice)}</td>
                <td class="px-3 py-2 text-right font-mono font-bold text-slate-900">${formatRupiah(subtotal)}</td>
            </tr>
        `;
    }).join('');

    const cleanPhone = (tx.customerPhone || '').replace(/\D/g, '');

    return `
        <div class="bg-white rounded-2xl border ${isDigital && !isValidated ? 'border-amber-300 ring-2 ring-amber-100/80 shadow-md' : 'border-slate-200/90 shadow-xs'} hover:border-slate-300 transition-all p-4 sm:p-5 flex flex-col gap-3.5">
            
            <!-- TOP HEADER: INVOICE, TIME, VEHICLE, STATUS, PAYMENT -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">${tx.invoiceNo}</span>
                    ${vehicleBadge}
                    ${payBadge}
                    ${bookingBadge}
                    ${statusBadge}
                    ${washBadge}
                </div>
                <div class="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <span>🕒</span>
                    <span>${formatDate(tx.date)}</span>
                </div>
            </div>

            <!-- CUSTOMER, PLATE & WORK ORDER INFO -->
            <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-1.5">
                        <span class="text-slate-400">Plat Nomor:</span>
                        <span class="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 tracking-wider">${tx.plateNumber || '-'}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-slate-400">Pelanggan:</span>
                        <span class="font-bold text-slate-800">${tx.customerName || 'Pelanggan Umum'}</span>
                    </div>
                    ${tx.customerPhone ? `
                        <a href="https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}" target="_blank"
                            class="text-emerald-700 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded-md font-mono font-bold border border-emerald-200 flex items-center gap-1 transition-all"
                            title="Klik untuk chat WhatsApp pelanggan">
                            <span>📱</span>
                            <span>${tx.customerPhone}</span>
                        </a>
                    ` : ''}
                </div>

                ${tx.orderNote && tx.orderNote !== '-' ? `
                    <div class="text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 flex items-center gap-1.5">
                        <span class="text-amber-500">📝</span>
                        <span class="font-medium">Catatan: <span class="italic text-slate-700">${tx.orderNote}</span></span>
                    </div>
                ` : ''}
            </div>

            <!-- VALIDASI STATUS BANNER KHUSUS QRIS / TRANSFER BANK -->
            ${isDigital ? (
                !isValidated ? `
                    <div class="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                        <div class="flex items-start gap-2.5">
                            <span class="text-xl">⏳</span>
                            <div>
                                <div class="font-black text-amber-950 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                                    <span>Validasi Pembayaran ${tx.paymentMethod === 'qris' ? 'QRIS Kasir' : 'Transfer Bank BRI'} Diperlukan</span>
                                    <span class="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Belum Dicek</span>
                                </div>
                                <p class="text-[11px] text-amber-800 mt-1 leading-relaxed">
                                    Total tagihan: <strong class="font-black text-amber-950 font-mono text-xs">${formatRupiah(tx.total)}</strong>. 
                                    ${tx.paymentMethod === 'qris' 
                                        ? 'Silakan periksa notifikasi/settlement pada aplikasi QRIS Kasir JAARS Garage.' 
                                        : `Silakan periksa mutasi Rekening BRI (${state.profile.bankAccount || '-'} a.n ${state.profile.bankHolder || '-'}).`}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="toggleTransactionPaymentValidation('${tx.id}')"
                            class="shrink-0 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
                            <span>✅</span>
                            <span>Validasi Lunas (Uang Masuk)</span>
                        </button>
                    </div>
                ` : `
                    <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-emerald-700 font-bold">✅</span>
                            <span class="font-extrabold text-emerald-900">Pembayaran ${tx.paymentMethod === 'qris' ? 'QRIS Kasir' : 'Transfer BRI'} Sudah Divalidasi Lunas</span>
                            ${tx.validatedAt ? `<span class="text-[10px] text-emerald-800 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">🕒 Divalidasi: ${formatDate(tx.validatedAt)}</span>` : ''}
                        </div>
                        <button type="button" onclick="toggleTransactionPaymentValidation('${tx.id}')"
                            class="text-[11px] font-bold text-slate-500 hover:text-amber-800 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Batalkan status validasi jika dana belum masuk atau salah cek">
                            <span>↩️</span>
                            <span>Batalkan Validasi</span>
                        </button>
                    </div>
                `
            ) : ''}

            <!-- TABEL HASIL LAYANAN DETAIL YANG SUDAH DIBAYAR -->
            <div class="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/40">
                <table class="w-full text-xs text-left">
                    <thead class="bg-slate-100/90 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                            <th class="px-3 py-2 text-center w-8">#</th>
                            <th class="px-3 py-2">Layanan / Produk yang Selesai Dikerjakan</th>
                            <th class="px-3 py-2">Kategori</th>
                            <th class="px-3 py-2 text-center">Jumlah</th>
                            <th class="px-3 py-2 text-right">Tarif Satuan</th>
                            <th class="px-3 py-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200/60 font-medium bg-white">
                        ${itemsRowsHTML}
                    </tbody>
                </table>
            </div>

            <!-- BOTTOM TOTALS & ACTION BUTTONS -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div class="flex items-center gap-3 flex-wrap text-xs">
                    <div>
                        <span class="text-slate-400 text-[10px] block font-semibold">Subtotal Layanan:</span>
                        <span class="font-bold text-slate-700 font-mono">${formatRupiah(tx.subtotal)}</span>
                    </div>
                    ${tx.discountAmount > 0 ? `
                        <div>
                            <span class="text-rose-400 text-[10px] block font-semibold">Potongan Diskon:</span>
                            <span class="font-bold text-rose-600 font-mono">-${formatRupiah(tx.discountAmount)}</span>
                        </div>
                    ` : ''}
                    <div class="pl-2 border-l border-slate-200">
                        <span class="text-[10px] text-slate-400 block font-bold uppercase">TOTAL SUDAH DIBAYAR:</span>
                        <span class="text-lg font-black text-blue-600 font-mono">${formatRupiah(tx.total)}</span>
                    </div>
                    ${tx.paymentMethod === 'cash' && tx.cash ? `
                        <div class="text-[11px] text-slate-500 pl-2 border-l border-slate-200 font-mono">
                            <span>Tunai: ${formatRupiah(tx.cash)}</span>
                            <span class="text-emerald-700 font-bold ml-1">(Kembalian: ${formatRupiah(tx.change || 0)})</span>
                        </div>
                    ` : ''}
                </div>

                <div class="flex items-center gap-1.5 justify-end flex-wrap">
                    ${isDigital ? (
                        !isValidated ? `
                            <button onclick="toggleTransactionPaymentValidation('${tx.id}')"
                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                title="Konfirmasi bahwa dana telah dicek dan masuk">
                                <span>✅</span>
                                <span>Validasi Lunas</span>
                            </button>
                        ` : `
                            <button onclick="toggleTransactionPaymentValidation('${tx.id}')"
                                class="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                title="Batalkan validasi jika diperlukan">
                                <span>↩️</span>
                                <span>Batal Validasi</span>
                            </button>
                        `
                    ) : ''}
                    ${isWash && washStats && washStats.washCount >= 7 ? `
                        <button onclick="issueFreeWashVoucherForCustomer('${tx.plateNumber || tx.customerPhone}')"
                            class="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Cetak Struk Bukti Penukaran Cuci Gratis">
                            <span>🎟️</span>
                            <span>Struk Cuci Gratis</span>
                        </button>
                    ` : ''}
                    <button onclick="sendDirectWhatsApp('${tx.id}')"
                        class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        title="Kirim Nota via WhatsApp">
                        <span>💬</span>
                        <span>Kirim WA</span>
                    </button>
                    <button onclick="viewHistoryReceipt('${tx.id}')"
                        class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Buka Nota Kasir">
                        <span>👁️</span>
                        <span>Lihat Nota</span>
                    </button>
                    <button onclick="printTransactionDirect('${tx.id}')"
                        class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                        title="Cetak Struk Thermal / Kertas">
                        <span>🖨️</span>
                        <span>Cetak</span>
                    </button>
                    ${state.isAdmin ? `
                        <button onclick="deleteTransaction('${tx.id}')"
                            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1 cursor-pointer" title="Hapus transaksi dari riwayat">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>

        </div>
    `;
}

// --- RENDER RINGKASAN PEMBAYARAN LAYANAN HARI INI ---
function renderPaidServicesSummary() {
    const container = document.getElementById('paid-services-detail-container');
    const servicesTableBody = document.getElementById('summary-services-table-body');
    const servicesTableFoot = document.getElementById('summary-services-table-foot');
    const totalOmsetEl = document.getElementById('summary-stat-total-omset');
    const totalTxEl = document.getElementById('summary-stat-total-tx');
    const totalServicesEl = document.getElementById('summary-stat-total-services-count');
    const discountEl = document.getElementById('summary-stat-discount');
    const paidCountBadge = document.getElementById('paid-services-count-badge');
    const uniqueServicesBadge = document.getElementById('summary-unique-services-badge');
    const periodDescEl = document.getElementById('paid-services-period-desc');
    const bannerDateEl = document.getElementById('summary-banner-date');
    const filterTodayText = document.getElementById('summary-filter-today-text');
    const methodsGrid = document.getElementById('summary-payment-methods-grid');

    if (!container) return;

    const now = new Date();
    const dateFormattedLong = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const dateFormattedShort = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    if (bannerDateEl) bannerDateEl.textContent = dateFormattedLong;
    if (filterTodayText) filterTodayText.textContent = `Hari Ini (${dateFormattedShort})`;

    // Helper untuk cek apakah tanggal transaksi adalah Hari Ini
    const isTxToday = (tx) => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return false;
        return txDate.getDate() === now.getDate() &&
               txDate.getMonth() === now.getMonth() &&
               txDate.getFullYear() === now.getFullYear();
    };

    // 1. Ambil seluruh transaksi hari ini
    const allTodayTx = (state.transactions || []).filter(isTxToday);

    // 2. Agregasi Rincian Pembayaran Per Setiap Layanan Hari Ini
    const serviceMap = {};
    let totalServicesQtyToday = 0;
    let totalServicesRevenueToday = 0;

    allTodayTx.forEach(tx => {
        (tx.items || []).forEach(item => {
            const key = item.id || item.name;
            if (!serviceMap[key]) {
                serviceMap[key] = {
                    id: item.id || key,
                    name: item.name,
                    category: item.categoryId || item.category || 'jasa',
                    vehicle: tx.vehicleType || 'motor',
                    unit: item.unit || 'unit',
                    price: Number(item.price) || 0,
                    qty: 0,
                    revenue: 0,
                    txCount: 0,
                    methods: { cash: 0, qris: 0, transfer: 0, bon: 0 }
                };
            }
            const qty = Number(item.qty) || 1;
            const sub = (Number(item.price) || 0) * qty;
            serviceMap[key].qty += qty;
            serviceMap[key].revenue += sub;
            serviceMap[key].txCount += 1;
            totalServicesQtyToday += qty;
            totalServicesRevenueToday += sub;

            const m = tx.paymentMethod || 'cash';
            if (serviceMap[key].methods[m] !== undefined) {
                serviceMap[key].methods[m] += sub;
            }
        });
    });

    const aggregatedServices = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    // Render Tabel Rekapitulasi Per Layanan Hari Ini
    if (servicesTableBody) {
        if (aggregatedServices.length === 0) {
            servicesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-8 text-center text-slate-400 bg-slate-50/50">
                        <span class="text-2xl block mb-1">🛠️</span>
                        <span class="font-bold text-slate-600">Belum ada layanan yang selesai atau dibayar pada hari ini (${dateFormattedShort})</span>
                        <p class="text-[11px] text-slate-400 mt-0.5">Selesaikan transaksi di kasir untuk melihat rincian pembayaran per layanan.</p>
                    </td>
                </tr>
            `;
            if (servicesTableFoot) servicesTableFoot.innerHTML = '';
        } else {
            servicesTableBody.innerHTML = aggregatedServices.map((svc, idx) => {
                const categoryObj = (state.categories || DEFAULT_CATEGORIES).find(c => c.id === svc.category);
                const categoryName = categoryObj ? categoryObj.name : (svc.category === 'oli-motor' ? 'Oli Motor' : (svc.category === 'oli-mobil' ? 'Oli Mobil' : svc.category));
                const vehIcon = svc.vehicle === 'mobil' ? '🚗' : '🛵';
                const vehLabel = svc.vehicle === 'mobil' ? 'Mobil' : 'Motor';

                // Method breakdown pills
                const methodPills = [];
                if (svc.methods.cash > 0) methodPills.push(`<span class="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">💵 ${formatRupiah(svc.methods.cash)}</span>`);
                if (svc.methods.qris > 0) methodPills.push(`<span class="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">📱 ${formatRupiah(svc.methods.qris)}</span>`);
                if (svc.methods.transfer > 0) methodPills.push(`<span class="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded border border-cyan-200">🏦 ${formatRupiah(svc.methods.transfer)}</span>`);
                if (svc.methods.bon > 0) methodPills.push(`<span class="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">📝 ${formatRupiah(svc.methods.bon)}</span>`);

                return `
                    <tr class="hover:bg-blue-50/40 transition-colors">
                        <td class="py-3 px-3 text-center font-bold text-slate-400">${idx + 1}</td>
                        <td class="py-3 px-4 font-bold text-slate-900">
                            <div class="flex items-center gap-1.5">
                                <span>${svc.name}</span>
                            </div>
                            <div class="flex items-center gap-1 mt-1 flex-wrap">
                                ${methodPills.join(' ')}
                            </div>
                        </td>
                        <td class="py-3 px-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                ${categoryName}
                            </span>
                        </td>
                        <td class="py-3 px-3 text-center">
                            <span class="inline-flex items-center gap-1 font-semibold text-slate-700">
                                <span>${vehIcon}</span>
                                <span>${vehLabel}</span>
                            </span>
                        </td>
                        <td class="py-3 px-3 text-center font-mono text-slate-600">
                            ${formatRupiah(svc.price)}
                            <div class="text-[10px] text-slate-400">/${svc.unit}</div>
                        </td>
                        <td class="py-3 px-3 text-center">
                            <span class="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-black text-xs">
                                ${svc.qty}x
                            </span>
                        </td>
                        <td class="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                            ${formatRupiah(svc.revenue)}
                        </td>
                    </tr>
                `;
            }).join('');

            if (servicesTableFoot) {
                servicesTableFoot.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-3 px-4 text-right font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                            Total Seluruh Layanan Hari Ini:
                        </td>
                        <td class="py-3 px-3 text-center font-black text-slate-900 text-xs">
                            <span class="px-2.5 py-1 bg-slate-200 rounded-lg">${totalServicesQtyToday} unit</span>
                        </td>
                        <td class="py-3 px-4 text-right font-black text-emerald-700 text-base">
                            ${formatRupiah(totalServicesRevenueToday)}
                        </td>
                    </tr>
                `;
            }
        }
    }

    if (uniqueServicesBadge) {
        uniqueServicesBadge.textContent = `${aggregatedServices.length} Jenis Layanan`;
    }

    // 3. KPI Hari Ini
    const totalTodayOmset = allTodayTx.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
    const totalTodayDiscount = allTodayTx.reduce((sum, tx) => sum + (Number(tx.discountAmount) || 0), 0);
    const countTodayTx = allTodayTx.length;

    if (totalOmsetEl) totalOmsetEl.textContent = formatRupiah(totalTodayOmset);
    if (totalTxEl) totalTxEl.textContent = `${countTodayTx} Transaksi`;
    if (totalServicesEl) totalServicesEl.textContent = `${totalServicesQtyToday} Layanan`;
    if (discountEl) discountEl.textContent = formatRupiah(totalTodayDiscount);

    // 4. Rekapitulasi Metode Pembayaran Hari Ini
    if (methodsGrid) {
        const methods = [
            { id: 'cash', name: 'Tunai di Laci Kasir', icon: '💵', color: 'border-emerald-200 bg-emerald-50/70 text-emerald-800' },
            { id: 'qris', name: 'QRIS Kasir', icon: '📱', color: 'border-blue-200 bg-blue-50/70 text-blue-800' },
            { id: 'transfer', name: 'Transfer Bank BRI', icon: '🏦', color: 'border-cyan-200 bg-cyan-50/70 text-cyan-800' },
            { id: 'bon', name: 'Bon / Piutang', icon: '📝', color: 'border-amber-200 bg-amber-50/70 text-amber-800' }
        ];

        methodsGrid.innerHTML = methods.map(m => {
            const mTx = allTodayTx.filter(t => t.paymentMethod === m.id);
            const sum = mTx.reduce((a, b) => a + (Number(b.total) || 0), 0);
            const pct = totalTodayOmset > 0 ? Math.round((sum / totalTodayOmset) * 100) : 0;

            return `
                <div class="p-3 rounded-xl border flex flex-col justify-between ${m.color}">
                    <div class="flex items-center justify-between">
                        <span class="font-extrabold flex items-center gap-1.5">${m.icon} ${m.name}</span>
                        <span class="text-[10px] font-bold opacity-75">${mTx.length} nota (${pct}%)</span>
                    </div>
                    <div class="text-sm font-black mt-2">
                        ${formatRupiah(sum)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 5. Agregasi Status Validasi Pembayaran Digital Hari Ini (QRIS / Transfer Bank)
    const pendingValidationTx = allTodayTx.filter(tx => {
        return (tx.paymentMethod === 'qris' || tx.paymentMethod === 'transfer') && !isTransactionPaymentValidated(tx);
    });
    const verifiedDigitalTx = allTodayTx.filter(tx => {
        return (tx.paymentMethod === 'qris' || tx.paymentMethod === 'transfer') && isTransactionPaymentValidated(tx);
    });
    const verifiedAllTx = allTodayTx.filter(tx => isTransactionPaymentValidated(tx));
    const qrisTx = allTodayTx.filter(tx => tx.paymentMethod === 'qris');
    const transferTx = allTodayTx.filter(tx => tx.paymentMethod === 'transfer');
    const sumPendingValidation = pendingValidationTx.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);

    // Update Navigasi Badges
    const badgeAll = document.getElementById('nav-val-badge-all');
    const badgePending = document.getElementById('nav-val-badge-pending');
    const badgeVerified = document.getElementById('nav-val-badge-verified');
    const badgeQris = document.getElementById('nav-val-badge-qris');
    const badgeTransfer = document.getElementById('nav-val-badge-transfer');
    const btnValidateAll = document.getElementById('btn-validate-all-summary');
    const alertBox = document.getElementById('summary-validation-alert');

    if (badgeAll) badgeAll.textContent = allTodayTx.length;
    if (badgePending) badgePending.textContent = pendingValidationTx.length;
    if (badgeVerified) badgeVerified.textContent = verifiedAllTx.length;
    if (badgeQris) badgeQris.textContent = qrisTx.length;
    if (badgeTransfer) badgeTransfer.textContent = transferTx.length;

    // Show/hide tombol validasi semua
    if (btnValidateAll) {
        if (pendingValidationTx.length > 0) {
            btnValidateAll.classList.remove('hidden');
        } else {
            btnValidateAll.classList.add('hidden');
        }
    }

    // Tampilkan Alert Status Validasi
    if (alertBox) {
        if (pendingValidationTx.length > 0) {
            alertBox.innerHTML = `
                <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl mt-0.5">⚠️</span>
                        <div>
                            <div class="font-black text-amber-950 text-sm flex items-center gap-2 flex-wrap">
                                <span>Perhatian Kasir: Ada ${pendingValidationTx.length} Transaksi QRIS / Transfer Perlu Dicek!</span>
                                <span class="bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded-full text-[10px]">Menunggu Verifikasi Mutasi</span>
                            </div>
                            <p class="text-amber-800 mt-1 leading-relaxed">
                                Total nominal belum dicek: <strong class="font-mono text-amber-950 font-black text-xs">${formatRupiah(sumPendingValidation)}</strong>. 
                                Silakan periksa mutasi rekening BRI atau aplikasi QRIS sebelum menyerahkan kunci atau menyelesaikan pengerjaan bengkel.
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button type="button" onclick="setSummaryValidationFilter('pending')"
                            class="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer">
                            <span>🔍</span>
                            <span>Filter Belum Dicek (${pendingValidationTx.length})</span>
                        </button>
                    </div>
                </div>
            `;
        } else if (allTodayTx.length > 0 && (qrisTx.length > 0 || transferTx.length > 0)) {
            alertBox.innerHTML = `
                <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-2.5">
                        <span class="text-lg">✅</span>
                        <div>
                            <span class="font-extrabold text-emerald-900">Seluruh transaksi QRIS dan Transfer BRI hari ini (${qrisTx.length + transferTx.length} nota) telah divalidasi LUNAS.</span>
                            <span class="text-slate-500 block text-[11px] mt-0.5">Semua dana telah diverifikasi masuk ke kas / mutasi rekening JAARS Garage.</span>
                        </div>
                    </div>
                    <span class="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                        Penerimaan Terverifikasi
                    </span>
                </div>
            `;
        } else {
            alertBox.innerHTML = '';
        }
    }

    // Update active style on navigation buttons
    const activeVal = state.summaryFilterValidation || 'all';
    ['all', 'pending', 'verified', 'qris', 'transfer'].forEach(k => {
        const btn = document.getElementById(`nav-val-btn-${k}`);
        if (btn) {
            if (k === activeVal) {
                btn.className = 'summary-val-btn px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer bg-slate-900 text-white border-slate-900 shadow-xs shrink-0';
            } else {
                btn.className = 'summary-val-btn px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all flex items-center gap-2 cursor-pointer shrink-0';
            }
        }
    });

    const selectVal = document.getElementById('select-summary-validation');
    if (selectVal) {
        if (['all', 'pending', 'verified'].includes(activeVal)) {
            selectVal.value = activeVal;
        } else {
            selectVal.value = 'all';
        }
    }

    // 6. Filter List Transaksi Hari Ini berdasarkan Validasi, Metode & Kendaraan
    const filteredTx = allTodayTx.filter(tx => {
        const isDigital = tx.paymentMethod === 'qris' || tx.paymentMethod === 'transfer';
        const isVal = isTransactionPaymentValidated(tx);

        // Status Validasi Filter
        if (state.summaryFilterValidation === 'pending') {
            if (!isDigital || isVal) return false;
        } else if (state.summaryFilterValidation === 'verified') {
            if (!isVal) return false;
        } else if (state.summaryFilterValidation === 'qris') {
            if (tx.paymentMethod !== 'qris') return false;
        } else if (state.summaryFilterValidation === 'transfer') {
            if (tx.paymentMethod !== 'transfer') return false;
        }

        // Metode
        if (state.summaryFilterPayment && state.summaryFilterPayment !== 'all') {
            if (tx.paymentMethod !== state.summaryFilterPayment) return false;
        }
        // Kendaraan
        if (state.summaryFilterVehicle && state.summaryFilterVehicle !== 'all') {
            if (tx.vehicleType !== state.summaryFilterVehicle) return false;
        }
        // Kata Kunci
        if (state.summarySearchKeyword && state.summarySearchKeyword.trim() !== '') {
            const kw = state.summarySearchKeyword.toLowerCase().trim();
            const invMatch = (tx.invoiceNo || '').toLowerCase().includes(kw);
            const nameMatch = (tx.customerName || '').toLowerCase().includes(kw);
            const plateMatch = (tx.plateNumber || '').toLowerCase().includes(kw);
            const phoneMatch = (tx.customerPhone || '').toLowerCase().includes(kw);
            const itemMatch = (tx.items || []).some(item => (item.name || '').toLowerCase().includes(kw));
            if (!invMatch && !nameMatch && !plateMatch && !phoneMatch && !itemMatch) return false;
        }
        return true;
    });

    if (paidCountBadge) {
        paidCountBadge.textContent = `${filteredTx.length} nota hari ini`;
    }

    if (periodDescEl) {
        periodDescEl.textContent = `Penerimaan Hari Ini (${dateFormattedShort}) • Total Pembayaran Masuk: ${formatRupiah(totalTodayOmset)}`;
    }

    // Render Kartu Nota Detail Hari Ini
    if (filteredTx.length === 0) {
        let emptyTitle = `Tidak ada transaksi yang cocok untuk hari ini (${dateFormattedShort})`;
        let emptyDesc = allTodayTx.length === 0 
            ? 'Belum ada transaksi yang diproses di kasir hari ini. Lakukan pembayaran baru melalui menu Kasir Pembayaran.' 
            : 'Sesuaikan pilihan navigasi validasi, metode pembayaran, kendaraan, atau hapus kata kunci pencarian Anda.';

        if (state.summaryFilterValidation === 'pending') {
            emptyTitle = `Alhamdulillah! Tidak ada transaksi yang menunggu validasi pembayaran`;
            emptyDesc = `Seluruh transaksi QRIS & Transfer Bank hari ini sudah divalidasi dan lunas oleh kasir/admin.`;
        }

        container.innerHTML = `
            <div class="py-10 px-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300">
                <div class="text-4xl mb-2">${state.summaryFilterValidation === 'pending' ? '🎉' : '📋'}</div>
                <h4 class="font-bold text-slate-700 text-sm">${emptyTitle}</h4>
                <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    ${emptyDesc}
                </p>
                <div class="mt-4 flex items-center justify-center gap-2">
                    ${allTodayTx.length > 0 ? `
                        <button type="button" onclick="resetSummaryFilters()" 
                            class="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
                            Reset Filter Navigasi
                        </button>
                    ` : ''}
                    <button type="button" onclick="switchTab('pos')" 
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                        <span>➕</span>
                        <span>Buka Kasir Pembayaran</span>
                    </button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTx.map(tx => generatePaidServicesCardHTML(tx)).join('');
}

window.printTransactionDirect = function(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;
    openReceiptModal(tx);
    setTimeout(() => {
        window.print();
    }, 250);
};

window.printTodaySummary = function() {
    const printContainer = document.getElementById('print-daily-summary-section');
    if (!printContainer) return;

    const now = new Date();
    const dateFormattedLong = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const isTxToday = (tx) => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return false;
        return txDate.getDate() === now.getDate() &&
               txDate.getMonth() === now.getMonth() &&
               txDate.getFullYear() === now.getFullYear();
    };

    const allTodayTx = (state.transactions || []).filter(isTxToday);
    const totalOmset = allTodayTx.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
    const totalDiscount = allTodayTx.reduce((sum, tx) => sum + (Number(tx.discountAmount) || 0), 0);

    // Group services
    const serviceMap = {};
    let totalQty = 0;
    allTodayTx.forEach(tx => {
        (tx.items || []).forEach(item => {
            const key = item.name || item.id;
            if (!serviceMap[key]) {
                serviceMap[key] = {
                    name: item.name,
                    vehicle: tx.vehicleType || 'motor',
                    price: Number(item.price) || 0,
                    qty: 0,
                    revenue: 0
                };
            }
            const q = Number(item.qty) || 1;
            serviceMap[key].qty += q;
            serviceMap[key].revenue += (Number(item.price) || 0) * q;
            totalQty += q;
        });
    });

    const services = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    const cashSum = allTodayTx.filter(t => t.paymentMethod === 'cash').reduce((a, b) => a + (Number(b.total) || 0), 0);
    const qrisSum = allTodayTx.filter(t => t.paymentMethod === 'qris').reduce((a, b) => a + (Number(b.total) || 0), 0);
    const tfSum = allTodayTx.filter(t => t.paymentMethod === 'transfer').reduce((a, b) => a + (Number(b.total) || 0), 0);
    const bonSum = allTodayTx.filter(t => t.paymentMethod === 'bon').reduce((a, b) => a + (Number(b.total) || 0), 0);

    printContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; font-size: 12px; color: #111; max-width: 800px; margin: 0 auto; line-height: 1.4;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
                <h2 style="font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase;">${state.profile.name || 'JAARS GARAGE'}</h2>
                <div style="font-size: 11px; margin-top: 2px;">${state.profile.tagline || 'Bengkel Ban, Bongkar Roda & Cuci Kendaraan'}</div>
                <div style="font-size: 11px;">${state.profile.address || ''} | Telp: ${state.profile.phone || ''}</div>
                <h3 style="font-size: 14px; font-weight: bold; margin: 8px 0 0; text-decoration: underline;">SLIP REKAPITULASI PEMBAYARAN & TUTUP KASIR HARIAN</h3>
                <div style="font-size: 11px; margin-top: 3px;">Tanggal: <strong>${dateFormattedLong}</strong> | Waktu Cetak: ${timeFormatted} WIB</div>
            </div>

            <!-- Financial Summary Box -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px; background: #f8fafc; width: 25%;">
                        <div>TOTAL PEMBAYARAN MASUK:</div>
                        <strong style="font-size: 14px; color: #047857;">${formatRupiah(totalOmset)}</strong>
                    </td>
                    <td style="border: 1px solid #ccc; padding: 8px; background: #f8fafc; width: 25%;">
                        <div>TOTAL TRANSAKSI:</div>
                        <strong style="font-size: 14px;">${allTodayTx.length} Nota</strong>
                    </td>
                    <td style="border: 1px solid #ccc; padding: 8px; background: #f8fafc; width: 25%;">
                        <div>TOTAL UNIT LAYANAN:</div>
                        <strong style="font-size: 14px;">${totalQty} Pengerjaan</strong>
                    </td>
                    <td style="border: 1px solid #ccc; padding: 8px; background: #f8fafc; width: 25%;">
                        <div>TOTAL DISKON:</div>
                        <strong style="font-size: 14px; color: #e11d48;">${formatRupiah(totalDiscount)}</strong>
                    </td>
                </tr>
            </table>

            <!-- Breakdown Payment Methods -->
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">RINCIAN SALURAN PEMBAYARAN HARI INI:</div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
                <tr style="background: #f1f5f9;">
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: left;">Metode</th>
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: center;">Jumlah Nota</th>
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: right;">Total Nominal (Rp)</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 5px;">💵 Uang Tunai di Laci Kasir</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${allTodayTx.filter(t => t.paymentMethod === 'cash').length}</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: right; font-weight: bold;">${formatRupiah(cashSum)}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 5px;">📱 QRIS Kasir</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${allTodayTx.filter(t => t.paymentMethod === 'qris').length}</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: right; font-weight: bold;">${formatRupiah(qrisSum)}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 5px;">🏦 Transfer Bank BRI</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${allTodayTx.filter(t => t.paymentMethod === 'transfer').length}</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: right; font-weight: bold;">${formatRupiah(tfSum)}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 5px;">📝 Bon / Piutang Belum Lunas</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${allTodayTx.filter(t => t.paymentMethod === 'bon').length}</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: right; font-weight: bold;">${formatRupiah(bonSum)}</td>
                </tr>
            </table>

            <!-- Service Table -->
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">RINCIAN PEMBAYARAN PER SETIAP LAYANAN HARI INI:</div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
                <tr style="background: #f1f5f9;">
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: center; width: 30px;">No</th>
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: left;">Nama Layanan / Sparepart</th>
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: center;">Kendaraan</th>
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: center;">Tarif</th>
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: center;">Qty</th>
                    <th style="border: 1px solid #ccc; padding: 6px; text-align: right;">Total Masuk (Rp)</th>
                </tr>
                ${services.map((s, i) => `
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${i + 1}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">${s.name}</td>
                        <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${s.vehicle.toUpperCase()}</td>
                        <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${formatRupiah(s.price)}</td>
                        <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold;">${s.qty}x</td>
                        <td style="border: 1px solid #ccc; padding: 5px; text-align: right; font-weight: bold;">${formatRupiah(s.revenue)}</td>
                    </tr>
                `).join('')}
                <tr style="background: #f8fafc; font-weight: bold;">
                    <td colspan="4" style="border: 1px solid #ccc; padding: 6px; text-align: right;">TOTAL:</td>
                    <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${totalQty}x</td>
                    <td style="border: 1px solid #ccc; padding: 6px; text-align: right; color: #047857;">${formatRupiah(totalOmset)}</td>
                </tr>
            </table>

            <!-- Signatures -->
            <div style="display: flex; justify-content: space-between; margin-top: 30px; padding: 0 40px; text-align: center; font-size: 11px;">
                <div>
                    <div>Kasir / Petugas,</div>
                    <div style="height: 50px;"></div>
                    <div style="border-top: 1px solid #000; width: 140px; margin: 0 auto; padding-top: 4px;">(..................................)</div>
                </div>
                <div>
                    <div>Owner / Administrator,</div>
                    <div style="height: 50px;"></div>
                    <div style="border-top: 1px solid #000; width: 140px; margin: 0 auto; padding-top: 4px;">( ${state.profile.name ? 'Jaars Garage' : 'Admin'} )</div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        window.print();
    }, 250);
};

window.resetSummaryFilters = function() {
    state.summaryFilterPayment = 'all';
    state.summaryFilterVehicle = 'all';
    state.summaryFilterValidation = 'all';
    state.summarySearchKeyword = '';
    const searchInput = document.getElementById('search-paid-services-input');
    const paySelect = document.getElementById('select-summary-payment');
    const vehSelect = document.getElementById('select-summary-vehicle');
    const valSelect = document.getElementById('select-summary-validation');
    if (searchInput) searchInput.value = '';
    if (paySelect) paySelect.value = 'all';
    if (vehSelect) vehSelect.value = 'all';
    if (valSelect) valSelect.value = 'all';
    renderPaidServicesSummary();
};

window.exportTodayPaidServicesToExcel = function() {
    const now = new Date();
    const isTxToday = (tx) => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return false;
        return txDate.getDate() === now.getDate() &&
               txDate.getMonth() === now.getMonth() &&
               txDate.getFullYear() === now.getFullYear();
    };

    const allTodayTx = (state.transactions || []).filter(isTxToday);
    if (allTodayTx.length === 0) {
        alert('Belum ada transaksi hari ini untuk diekspor ke Excel.');
        return;
    }

    // 1. Sheet Rekap Layanan Hari Ini
    const serviceMap = {};
    allTodayTx.forEach(tx => {
        (tx.items || []).forEach(item => {
            const key = item.name || item.id;
            if (!serviceMap[key]) {
                serviceMap[key] = {
                    name: item.name,
                    category: item.categoryId || item.category || 'Jasa',
                    vehicle: (tx.vehicleType || 'motor').toUpperCase(),
                    price: Number(item.price) || 0,
                    qty: 0,
                    revenue: 0,
                    cash: 0,
                    qris: 0,
                    transfer: 0,
                    bon: 0
                };
            }
            const q = Number(item.qty) || 1;
            const sub = (Number(item.price) || 0) * q;
            serviceMap[key].qty += q;
            serviceMap[key].revenue += sub;
            const pm = tx.paymentMethod || 'cash';
            if (serviceMap[key][pm] !== undefined) serviceMap[key][pm] += sub;
        });
    });

    const services = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);
    const serviceRows = [
        ['REKAPITULASI PEMBAYARAN PER SETIAP LAYANAN HARI INI'],
        [`Bengkel: ${state.profile.name || 'Jaars Garage'}`],
        [`Tanggal: ${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`],
        [''],
        ['No', 'Nama Layanan / Sparepart', 'Kategori', 'Kendaraan', 'Tarif Satuan (Rp)', 'Jumlah Dikerjakan (Qty)', 'Tunai (Rp)', 'QRIS (Rp)', 'Transfer BRI (Rp)', 'Bon (Rp)', 'Total Pemasukan (Rp)']
    ];

    let totalQty = 0;
    let totalRevenue = 0;
    services.forEach((s, idx) => {
        totalQty += s.qty;
        totalRevenue += s.revenue;
        serviceRows.push([
            idx + 1,
            s.name,
            s.category,
            s.vehicle,
            s.price,
            s.qty,
            s.cash,
            s.qris,
            s.transfer,
            s.bon,
            s.revenue
        ]);
    });
    serviceRows.push(['']);
    serviceRows.push(['', 'TOTAL KESELURUHAN HARI INI', '', '', '', totalQty, '', '', '', '', totalRevenue]);

    // 2. Sheet Daftar Nota Hari Ini
    const txRows = [
        ['DAFTAR TRANSAKSI & HASIL LAYANAN DETAIL HARI INI'],
        [`Bengkel: ${state.profile.name || 'Jaars Garage'}`],
        [`Tanggal: ${now.toLocaleDateString('id-ID')}`],
        [''],
        ['No', 'No. Nota', 'Jam', 'Nama Pelanggan', 'No. WhatsApp', 'Plat Nomor', 'Kendaraan', 'Layanan yang Dikerjakan', 'Subtotal (Rp)', 'Diskon (Rp)', 'Total Bayar (Rp)', 'Metode Pembayaran', 'Status Validasi', 'Catatan']
    ];

    allTodayTx.forEach((tx, idx) => {
        const itemsStr = (tx.items || []).map(i => `${i.name} (${i.qty}x)`).join('; ');
        const payStr = tx.paymentMethod === 'cash' ? 'Tunai' :
                       tx.paymentMethod === 'qris' ? 'QRIS' :
                       tx.paymentMethod === 'transfer' ? 'Transfer BRI' : 'Bon / Hutang';
        const valStr = tx.paymentMethod === 'cash' ? 'Lunas (Kasir)' :
                       (isTransactionPaymentValidated(tx) ? 'Lunas (Tervalidasi)' : 'Menunggu Validasi (Cek QRIS/Transfer)');
        const jamStr = tx.date ? new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        txRows.push([
            idx + 1,
            tx.invoiceNo || '-',
            jamStr,
            tx.customerName || 'Pelanggan Umum',
            tx.customerPhone || '-',
            tx.plateNumber || '-',
            (tx.vehicleType || 'motor').toUpperCase(),
            itemsStr,
            Number(tx.subtotal) || 0,
            Number(tx.discountAmount) || 0,
            Number(tx.total) || 0,
            payStr,
            valStr,
            tx.orderNote || '-'
        ]);
    });

    if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const wsServices = XLSX.utils.aoa_to_sheet(serviceRows);
        const wsTx = XLSX.utils.aoa_to_sheet(txRows);
        XLSX.utils.book_append_sheet(wb, wsServices, "Rekap Layanan Hari Ini");
        XLSX.utils.book_append_sheet(wb, wsTx, "Daftar Transaksi Hari Ini");
        const filename = `Ringkasan_Pembayaran_Hari_Ini_${now.toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
        showToast('📗 Berhasil mengunduh ringkasan pembayaran hari ini ke Excel!');
    } else {
        showToast('SheetJS belum termuat. Silakan gunakan tombol cetak rekap.');
    }
};

window.exportPaidServicesToExcel = window.exportTodayPaidServicesToExcel;

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

    listContainer.innerHTML = filteredTx.map(tx => generatePaidServicesCardHTML(tx)).join('');
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
        const deletedId = txId;
        state.transactions = state.transactions.filter(t => t.id !== txId);
        saveTransactions({ sync: false });
        renderHistory();
        renderPaidServicesSummary();
        showToast('Transaksi dihapus dari riwayat.');
        if (typeof syncToCloud === 'function') {
            syncToCloud('Hapus Transaksi', { deletedTransactionIds: [deletedId] });
        }
    }
};

// --- MODAL UTILS ---
function closeModal() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    state.activeModal = null;
    const p1 = document.getElementById('print-free-wash-section');
    const p2 = document.getElementById('print-receipt-section');
    const p3 = document.getElementById('print-daily-summary-section');
    if (p1) p1.innerHTML = '';
    if (p2) p2.innerHTML = '';
    if (p3) p3.innerHTML = '';
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
