// api/sync.js
// Vercel Serverless Function: Sinkronisasi Otomatis Antar-Perangkat (Multi-Device Cloud Sync)
// Mendukung sinkronisasi realtime nota booking, pembayaran QRIS/Transfer/Tunai, tarif, katalog, dan loyalitas
// Endpoint: GET /api/sync & POST /api/sync

let memoryStore = null;

// ID seed/dummy bawaan contoh demo yang TIDAK boleh disimpan atau disinkronkan ke transaksi riil
function isSeedTransaction(tx) {
    if (!tx) return false;
    const id = String(tx.id || '');
    const inv = String(tx.invoiceNo || '');
    if (id.startsWith('INV-JAARS-')) return true;
    if (/^INV-84[789]\d{3}$/.test(inv)) return true;
    return false;
}

// Helper: Gabungkan daftar transaksi dari beberapa perangkat tanpa saling menimpa
function mergeTransactions(existingList, incomingList, deletedIds = []) {
    const map = new Map();
    const deletedSet = new Set(deletedIds || []);

    (existingList || []).forEach(tx => {
        if (!tx || isSeedTransaction(tx)) return;
        const key = tx.invoiceNo || tx.id;
        if (key && !deletedSet.has(tx.id) && !deletedSet.has(tx.invoiceNo)) {
            map.set(key, tx);
        }
    });

    (incomingList || []).forEach(tx => {
        if (!tx || isSeedTransaction(tx)) return;
        const key = tx.invoiceNo || tx.id;
        if (!key || deletedSet.has(tx.id) || deletedSet.has(tx.invoiceNo)) return;

        const existing = map.get(key);
        if (!existing) {
            map.set(key, tx);
        } else {
            // Gabungkan status pembayaran (jika salah satu sudah tervalidasi, jadikan terverifikasi)
            const isVerified = existing.paymentValidated === true || 
                               existing.paymentStatus === 'verified' || 
                               tx.paymentValidated === true || 
                               tx.paymentStatus === 'verified';
            map.set(key, {
                ...existing,
                ...tx,
                paymentValidated: isVerified,
                paymentStatus: isVerified ? 'verified' : (tx.paymentStatus || existing.paymentStatus || 'pending'),
                validatedAt: tx.validatedAt || existing.validatedAt || null,
                validatedBy: tx.validatedBy || existing.validatedBy || null
            });
        }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

// Helper: Gabungkan kupon voucher cuci gratis
function mergeVouchers(existingList, incomingList, deletedIds = []) {
    const map = new Map();
    const deletedSet = new Set(deletedIds || []);

    (existingList || []).forEach(v => {
        if (!v) return;
        const key = v.id || v.code;
        if (key && !deletedSet.has(v.id) && !deletedSet.has(v.code)) {
            map.set(key, v);
        }
    });

    (incomingList || []).forEach(v => {
        if (!v) return;
        const key = v.id || v.code;
        if (!key || deletedSet.has(v.id) || deletedSet.has(v.code)) return;

        const existing = map.get(key);
        if (!existing) {
            map.set(key, v);
        } else {
            const isRedeemed = existing.status === 'redeemed' || v.status === 'redeemed';
            map.set(key, {
                ...existing,
                ...v,
                status: isRedeemed ? 'redeemed' : (v.status || existing.status),
                redeemedAt: v.redeemedAt || existing.redeemedAt || null,
                redeemedInvoiceNo: v.redeemedInvoiceNo || existing.redeemedInvoiceNo || null
            });
        }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));
}

// Helper: Gabungkan riwayat kendaraan loyalitas yang dibersihkan/reset
function mergeClearedVehicles(existingList, incomingList) {
    const map = new Map();
    (existingList || []).forEach(item => {
        if (!item) return;
        const key = (item.plate || '').trim().toUpperCase() + '_' + (item.phone || '').trim();
        if (key !== '_') map.set(key, item);
    });
    (incomingList || []).forEach(item => {
        if (!item) return;
        const key = (item.plate || '').trim().toUpperCase() + '_' + (item.phone || '').trim();
        if (key !== '_') map.set(key, { ...(map.get(key) || {}), ...item });
    });
    return Array.from(map.values());
}

// Helper: Gabungkan daftar katalog ban & oli dari beberapa perangkat tanpa saling menimpa
function mergeCatalog(existingList, incomingList, deletedIds = []) {
    const map = new Map();
    const deletedSet = new Set(deletedIds || []);

    (existingList || []).forEach(item => {
        if (!item || !item.id || deletedSet.has(item.id)) return;
        map.set(item.id, item);
    });

    (incomingList || []).forEach(item => {
        if (!item || !item.id || deletedSet.has(item.id)) return;
        const existing = map.get(item.id);
        if (!existing) {
            map.set(item.id, item);
        } else {
            const inTime = Number(item.updatedAt || 0);
            const exTime = Number(existing.updatedAt || 0);
            if (inTime >= exTime) {
                map.set(item.id, {
                    ...existing,
                    ...item
                });
            }
        }
    });

    return Array.from(map.values());
}

module.exports = async function handler(req, res) {
    // 1. CORS headers agar dapat diakses dari browser mana pun & domain vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sync-Key');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    const CLOUD_URL = process.env.CLOUD_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;

    // Helper: Ambil data dari penyimpanan cloud
    async function getData() {
        // 1. Prioritas Utama: Vercel KV / Upstash Redis bawaan Vercel
        if (KV_URL && KV_TOKEN) {
            try {
                const response = await fetch(`${KV_URL}/get/bengkel_jaars_sync`, {
                    headers: { Authorization: `Bearer ${KV_TOKEN}` }
                });
                const json = await response.json();
                if (json && json.result) {
                    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
                }
            } catch (err) {
                console.error('[Vercel KV Read Error]:', err);
            }
        }

        // 2. Prioritas Kedua: Custom Cloud Database / Firebase Realtime DB
        if (CLOUD_URL) {
            try {
                const cleanUrl = CLOUD_URL.endsWith('.json') ? CLOUD_URL : `${CLOUD_URL.replace(/\/+$/, '')}/bengkel_sync.json`;
                const response = await fetch(cleanUrl);
                if (response.ok) {
                    return await response.json();
                }
            } catch (err) {
                console.error('[Cloud DB Read Error]:', err);
            }
        }

        // 3. Fallback: In-Memory cache serverless instance
        return memoryStore;
    }

    // Helper: Simpan data ke penyimpanan cloud
    async function setData(data) {
        const savedIn = [];

        // 1. Simpan ke Vercel KV / Upstash Redis
        if (KV_URL && KV_TOKEN) {
            try {
                const stringVal = JSON.stringify(data);
                const response = await fetch(`${KV_URL}/set/bengkel_jaars_sync`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${KV_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: stringVal
                });
                if (response.ok) {
                    savedIn.push('Vercel KV');
                }
            } catch (err) {
                console.error('[Vercel KV Write Error]:', err);
            }
        }

        // 2. Simpan ke Custom Cloud Database / Firebase
        if (CLOUD_URL) {
            try {
                const cleanUrl = CLOUD_URL.endsWith('.json') ? CLOUD_URL : `${CLOUD_URL.replace(/\/+$/, '')}/bengkel_sync.json`;
                const response = await fetch(cleanUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    savedIn.push('Cloud DB');
                }
            } catch (err) {
                console.error('[Cloud DB Write Error]:', err);
            }
        }

        // Update memory store
        memoryStore = data;
        savedIn.push('Memory Cache');

        return savedIn;
    }

    // --- METODE GET: Mengambil konfigurasi & transaksi terbaru untuk semua perangkat ---
    if (req.method === 'GET') {
        try {
            const data = await getData();
            if (!data) {
                return res.status(200).json({
                    success: true,
                    synced: false,
                    message: 'Belum ada data di Cloud. Data akan otomatis disinkronkan saat transaksi atau pengaturan disimpan.',
                    storage: KV_URL ? 'Vercel KV (Kosong)' : (CLOUD_URL ? 'Cloud DB (Kosong)' : 'Belum Terhubung Database Cloud'),
                    kvConfigured: Boolean(KV_URL && KV_TOKEN),
                    data: null
                });
            }

            // Bersihkan data transaksi dari seed/dummy demo bawaan & transaksi yang sudah dihapus
            const deletedSet = new Set(Array.isArray(data.deletedTransactionIds) ? data.deletedTransactionIds : []);
            if (data && Array.isArray(data.transactions)) {
                data.transactions = data.transactions.filter(tx => 
                    !isSeedTransaction(tx) && 
                    !deletedSet.has(tx.id) && 
                    !deletedSet.has(tx.invoiceNo)
                );
            }

            // Bersihkan data katalog dari produk yang sudah dihapus
            const deletedCatSet = new Set(Array.isArray(data.deletedCatalogIds) ? data.deletedCatalogIds : []);
            if (data && Array.isArray(data.catalog)) {
                data.catalog = data.catalog.filter(p => p && p.id && !deletedCatSet.has(p.id));
            }

            return res.status(200).json({
                success: true,
                synced: true,
                storage: KV_URL ? 'Vercel KV' : (CLOUD_URL ? 'Cloud DB' : 'Memory Cache'),
                kvConfigured: Boolean(KV_URL && KV_TOKEN),
                updatedAt: data.updatedAt || Date.now(),
                data: data
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // --- METODE POST: Menerima transaksi/booking baru atau perubahan konfigurasi dari perangkat ---
    if (req.method === 'POST') {
        try {
            let payload = req.body;
            if (typeof payload === 'string') {
                payload = JSON.parse(payload);
            }

            if (!payload || typeof payload !== 'object') {
                return res.status(400).json({ success: false, error: 'Payload tidak valid' });
            }

            const existingData = (await getData()) || {};

            // Simpan dan gabungkan seluruh ID transaksi & katalog yang pernah dihapus
            const existingDeleted = Array.isArray(existingData.deletedTransactionIds) ? existingData.deletedTransactionIds : [];
            const incomingDeleted = Array.isArray(payload.deletedTransactionIds) ? payload.deletedTransactionIds : [];
            const allDeletedIds = Array.from(new Set([...existingDeleted, ...incomingDeleted]));

            const existingDeletedCat = Array.isArray(existingData.deletedCatalogIds) ? existingData.deletedCatalogIds : [];
            const incomingDeletedCat = Array.isArray(payload.deletedCatalogIds) ? payload.deletedCatalogIds : [];
            const allDeletedCatIds = Array.from(new Set([...existingDeletedCat, ...incomingDeletedCat]));

            // Gabungkan data agar transaksi & katalog antar-device tidak saling menimpa
            const mergedTransactions = mergeTransactions(
                existingData.transactions,
                payload.transactions,
                allDeletedIds
            );

            const mergedVouchers = mergeVouchers(
                existingData.freeWashVouchers,
                payload.freeWashVouchers,
                payload.deletedVoucherIds
            );

            const mergedClearedVehicles = mergeClearedVehicles(
                existingData.loyaltyClearedVehicles,
                payload.loyaltyClearedVehicles
            );

            const mergedCatalog = mergeCatalog(
                existingData.catalog,
                payload.catalog,
                allDeletedCatIds
            );

            const mergedPayload = {
                ...existingData,
                ...payload,
                profile: payload.profile ? { ...(existingData.profile || {}), ...payload.profile } : existingData.profile,
                services: (Array.isArray(payload.services) && payload.services.length > 0) ? payload.services : (existingData.services || []),
                catalog: mergedCatalog,
                transactions: mergedTransactions,
                deletedTransactionIds: allDeletedIds,
                deletedCatalogIds: allDeletedCatIds,
                freeWashVouchers: mergedVouchers,
                loyaltyClearedVehicles: mergedClearedVehicles,
                adminEmail: payload.adminEmail || existingData.adminEmail,
                adminPassword: payload.adminPassword || existingData.adminPassword,
                updatedAt: Date.now()
            };

            const savedIn = await setData(mergedPayload);

            return res.status(200).json({
                success: true,
                message: 'Data bengkel & nota transaksi berhasil disinkronkan ke Cloud Vercel!',
                savedIn: savedIn,
                kvConfigured: Boolean(KV_URL && KV_TOKEN),
                updatedAt: mergedPayload.updatedAt,
                transactionCount: mergedTransactions.length,
                data: mergedPayload
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Metode HTTP tidak didukung' });
};
