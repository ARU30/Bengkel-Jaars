// api/sync.js
// Vercel Serverless Function: Sinkronisasi Otomatis Antar-Perangkat (Multi-Device Cloud Sync)
// Endpoint: GET /api/sync & POST /api/sync

let memoryStore = null;

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

    // --- METODE GET: Mengambil konfigurasi terbaru untuk semua perangkat ---
    if (req.method === 'GET') {
        try {
            const data = await getData();
            if (!data) {
                return res.status(200).json({
                    success: true,
                    synced: false,
                    message: 'Belum ada data konfigurasi di Cloud. Silakan simpan pengaturan dari menu Admin.',
                    storage: KV_URL ? 'Vercel KV (Kosong)' : (CLOUD_URL ? 'Cloud DB (Kosong)' : 'Belum Terhubung Database Cloud'),
                    kvConfigured: Boolean(KV_URL && KV_TOKEN),
                    data: null
                });
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

    // --- METODE POST: Menerima perubahan dari Admin dan menyebarkan ke Cloud ---
    if (req.method === 'POST') {
        try {
            let payload = req.body;
            if (typeof payload === 'string') {
                payload = JSON.parse(payload);
            }

            if (!payload || typeof payload !== 'object') {
                return res.status(400).json({ success: false, error: 'Payload konfigurasi tidak valid' });
            }

            payload.updatedAt = Date.now();
            const savedIn = await setData(payload);

            return res.status(200).json({
                success: true,
                message: 'Konfigurasi bengkel berhasil disimpan & disinkronkan ke Cloud Vercel!',
                savedIn: savedIn,
                kvConfigured: Boolean(KV_URL && KV_TOKEN),
                updatedAt: payload.updatedAt
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Metode HTTP tidak didukung' });
};
